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

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...options, headers });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401) {
      throw new Error("Your session may have expired. Please sign in again.");
    }
    throw new Error(`API request failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

export interface Account {
  id: string;
  user_id: string;
  account_name: string;
  account_type: string;
  currency: string;
  balance: number | string;
}

export interface FinancialSummary {
  user_id: string;
  total_income: string;
  total_expenses: string;
  total_fees: string;
  net_cash_flow: string;
  transaction_count: number;
  period: {
    start_date: string | null;
    end_date: string | null;
  };
}

export interface FinancialSummaryFilters {
  startDate?: string;
  endDate?: string;
}

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

export interface AIChatResponse {
  answer: string;
  transactions_considered: number;
}

export interface SavedInsight {
  id: string;
  title?: string;
  description?: string;
  insight_type?: string;
  category?: string;
  message?: string;
  severity?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface SavedInsightsResponse {
  count: number;
  insights: SavedInsight[];
}

export const getAccounts = (userId: string) =>
  request<Account[]>(`/accounts/?user_id=${encodeURIComponent(userId)}`);

export const getFinancialSummary = (
  userId: string,
  filters: FinancialSummaryFilters = {},
) => {
  const params = new URLSearchParams({ user_id: userId });
  if (filters.startDate) params.set("start_date", filters.startDate);
  if (filters.endDate) params.set("end_date", filters.endDate);

  return request<FinancialSummary>(`/financial-analytics/summary?${params}`);
};

export const getTransactions = (userId: string, limit = 100) =>
  request<Transaction[]>(
    `/transactions/?user_id=${encodeURIComponent(userId)}&limit=${limit}`,
  );

export const postAIChat = (message: string) =>
  request<AIChatResponse>("/ai/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });

export const getSavedInsights = () =>
  request<SavedInsightsResponse>("/ai/insights");
