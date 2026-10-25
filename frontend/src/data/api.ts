
const TOKEN_KEY = "finsight_access_token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUserId(): string | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const claims = JSON.parse(decoded) as { sub?: unknown; exp?: number };

    if (typeof claims.sub !== "string" || !claims.sub) return null;

    if (typeof claims.exp === "number" && claims.exp * 1000 <= Date.now()) {
      return null;
    }

    return claims.sub;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...options, headers });

  if (!response.ok) {
    const body = await response.text();

    if (response.status === 401) {
      throw new Error(
        "Your session may have expired. Please sign in again.",
      );
    }

    let message = body;

    try {
      const parsed = JSON.parse(body) as { detail?: unknown; message?: unknown };
      if (typeof parsed.detail === "string") {
        message = parsed.detail;
      } else if (typeof parsed.message === "string") {
        message = parsed.message;
      }
    } catch {
      // Keep the original response body if it isn't JSON.
    }

    throw new Error(`API request failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<T>;
}

// Accounts

export interface Account {
  id: string;
  user_id: string;
  account_name: string;
  account_type: string;
  currency: string;
  balance: number | string;
}

export const getAccounts = (userId: string) =>
  request<Account[]>(`/accounts/?user_id=${encodeURIComponent(userId)}`);

// Financial analytics

export type FinancialTransactionType = "income" | "expense" | "fee";

export interface FinancialSummaryAmount {
  total: number | string;
  count: number;
}

export interface FinancialSummaryCurrencyTotals {
  income: FinancialSummaryAmount;
  expense: FinancialSummaryAmount;
  fee: FinancialSummaryAmount;
}

export interface FinancialSummary {
  user_id: string;
  start_date: string | null;
  end_date: string | null;
  summary: Record<string, FinancialSummaryCurrencyTotals>;
}

export interface FinancialSummaryFilters {
  startDate?: string;
  endDate?: string;
}

export const getFinancialSummary = (
  userId: string,
  filters: FinancialSummaryFilters = {},
) => {
  const params = new URLSearchParams({ user_id: userId });

  if (filters.startDate) params.set("start_date", filters.startDate);
  if (filters.endDate) params.set("end_date", filters.endDate);

  return request<FinancialSummary>(
    `/financial-analytics/summary?${params.toString()}`,
  );
};

// Transactions

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  transaction_type: string;
  category: string;
  description: string;
  amount: number | string;
  currency: string;
  transaction_date: string;
}

export const getTransactions = (userId: string, limit = 100) =>
  request<Transaction[]>(
    `/transactions/?user_id=${encodeURIComponent(userId)}&limit=${limit}`,
  );

// AI assistant and insights

export interface AIChatResponse {
  answer: string;
  transactions_considered: number;
}

export const postAIChat = (message: string) =>
  request<AIChatResponse>("/ai/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });

export interface AIInsightsResponse {
  user_id: string;
  period_days: number;
  current_spending: number | string;
  previous_spending: number | string;
  change_percent: number;
  message: string;
}

export const getAIInsights = () => request<AIInsightsResponse>("/ai/insights");

// Usage

export interface UsageResponse {
  tenant_id: string;
  billing_period: {
    start: string;
    end: string;
  };
  subscription: {
    status: string;
    plan: {
      id: string;
      name: string;
      api_call_limit: number;
      token_limit: number;
    };
  };
  usage: {
    api_calls: number;
    api_call_limit: number;
    token_limit: number;
    tokens: {
      input_tokens: number;
      cached_input_tokens: number;
      reasoning_tokens: number;
      output_tokens: number;
      total_billable_tokens: number;
    };
  };
  cost: {
    api_call_cost_cents: number;
    input_cost_cents: number;
    cached_input_cost_cents: number;
    output_cost_cents: number;
    total_cost_cents: number;
  };
  metering_note?: string;
}

export interface UsageHistoryMonth {
  month: number;
  label: string;
  api_calls: number;
  total_billable_tokens: number;
  actual_cost_zar: number | string;
  projected_cost_zar: number | string | null;
}

export interface UsageHistoryResponse {
  year: number;
  currency: string;
  has_data: boolean;
  monthly: UsageHistoryMonth[];
}

export const getUsageHistory = (year?: number) =>
  request<UsageHistoryResponse>(
    `/usage/history${year ? `?year=${year}` : ""}`,
  );

export const getUsage = () => request<UsageResponse>("/usage/me");

// Billing

export interface BillingResponse {
  tenant_id: string;
  subscription: {
    status: string;
    plan: {
      id: string;
      name: string;
      api_call_limit: number;
      token_limit: number;
    };
  };
  payment_provider: string;
  checkout_is_simulated: boolean;
  message: string;
}

export const getBilling = () => request<BillingResponse>("/billing/me");

// Investec sandbox

export interface InvestecSandboxAccount {
  accountId: string;
  accountNumber: string;
  accountName: string;
  referenceName: string;
  productName: string;
  kycCompliant: boolean;
  profileId: string;
  profileName: string;
}

export interface InvestecAccountsResponse {
  source: string;
  simulated_data: boolean;
  accounts: InvestecSandboxAccount[];
}

export interface InvestecSyncResponse {
  source: string;
  simulated_data: boolean;
  accounts_synced: number;
  transactions_imported: number;
  transactions_skipped: number;
  message: string;
}

export const getInvestecSandboxAccounts = () =>
  request<InvestecAccountsResponse>("/investec/accounts");

export const syncInvestecSandbox = () =>
  request<InvestecSyncResponse>("/investec/sync", {
    method: "POST",
  });

// Password recovery

export interface PasswordRecoveryMessage {
  message: string;
}

export interface PasswordResetVerificationResponse {
  reset_token: string;
  expires_in_seconds: number;
}

export const requestPasswordReset = (email: string) =>
  request<PasswordRecoveryMessage>("/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resendPasswordResetCode = (email: string) =>
  request<PasswordRecoveryMessage>("/auth/password/resend", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const verifyPasswordResetCode = (email: string, code: string) =>
  request<PasswordResetVerificationResponse>("/auth/password/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });

export const resetPassword = (token: string, newPassword: string) =>
  request<PasswordRecoveryMessage>("/auth/password/reset", {
    method: "POST",
    body: JSON.stringify({
      token,
      new_password: newPassword,
    }),
  });
