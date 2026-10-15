export type Usage = {
  apiRequests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  quota: number;
  period: string;
  date: string;
  endpoint: string;
  status: "Success" | "Rate limited" | "Failed";
  cost: number;
};

export type Invoice = {
  id: string;
  date: string;
  period: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
};

export type Billing = {
  currentBill: number;
  projectedBill: number;
  plan: string;
  periodStart: string;
  periodEnd: string;
  apiCost: number;
  tokenCost: number;
  platformFee: number;
  invoices: Invoice[];
};

export type FinancialAccount = {
  name: string;
  accountNumber: string;
  currency: string;
  balance: number;
  availableBalance: number;
  income: number;
  expenses: number;
  netCashFlow: number;
  lastSynced: string;
};

export type Forecast = {
  month: string;
  actual?: number;
  projected?: number;
  income?: number;
  expenses?: number;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  time: string;
};

export type DashboardSummary = {
  usage: Usage;
  billing: Billing;
  account: FinancialAccount;
  usageTrend: Forecast[];
  cashFlow: Forecast[];
};
