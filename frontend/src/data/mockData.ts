import type {
  Billing,
  DashboardSummary,
  FinancialAccount,
  Forecast,
  Usage,
} from "../types";

export const dashboardUsage: Usage = {
  apiRequests: 18432,
  inputTokens: 28400000,
  outputTokens: 12800000,
  totalTokens: 41200000,
  quota: 100000000,
  period: "Oct 1 – Oct 31, 2026",
  date: "Oct 06, 2026",
  endpoint: "/v1/chat/completions",
  status: "Success",
  cost: 1248.64,
};

export const billing: Billing = {
  currentBill: 1248.64,
  projectedBill: 3842.2,
  plan: "Scale",
  periodStart: "Oct 1, 2026",
  periodEnd: "Oct 31, 2026",
  apiCost: 184.32,
  tokenCost: 1024.32,
  platformFee: 40,
  invoices: [
    { id: "INV-2026-009", date: "Oct 1, 2026", period: "Sep 2026", amount: 2914.8, status: "Paid" },
    { id: "INV-2026-008", date: "Sep 1, 2026", period: "Aug 2026", amount: 2671.4, status: "Paid" },
    { id: "INV-2026-007", date: "Aug 1, 2026", period: "Jul 2026", amount: 3198.25, status: "Paid" },
    { id: "INV-2026-006", date: "Jul 1, 2026", period: "Jun 2026", amount: 2387.1, status: "Pending" },
  ],
};

export const financialAccount: FinancialAccount = {
  name: "Business Current Account",
  accountNumber: "•••• 4821",
  currency: "USD",
  balance: 128450.82,
  availableBalance: 121204.14,
  income: 48320,
  expenses: 32184.5,
  netCashFlow: 16135.5,
  lastSynced: "Today, 08:42",
};

export const cashFlowData: Forecast[] = [
  { month: "May", income: 38200, expenses: 29100 },
  { month: "Jun", income: 41600, expenses: 31400 },
  { month: "Jul", income: 39400, expenses: 28200 },
  { month: "Aug", income: 45200, expenses: 33600 },
  { month: "Sep", income: 43800, expenses: 30900 },
  { month: "Oct", income: 48320, expenses: 32184 },
];

export const usageTrend: Forecast[] = [
  { month: "May", actual: 2380 },
  { month: "Jun", actual: 2640 },
  { month: "Jul", actual: 2310 },
  { month: "Aug", actual: 2970 },
  { month: "Sep", actual: 2915 },
  { month: "Oct", actual: 1249, projected: 3842 },
];

export const usageHistory: Usage[] = [
  { ...dashboardUsage, date: "Oct 06, 2026 · 08:34", apiRequests: 1248, inputTokens: 1840000, outputTokens: 820000, totalTokens: 2660000, cost: 84.32 },
  { ...dashboardUsage, date: "Oct 06, 2026 · 07:58", endpoint: "/v1/embeddings", apiRequests: 892, inputTokens: 920000, outputTokens: 0, totalTokens: 920000, cost: 28.11 },
  { ...dashboardUsage, date: "Oct 05, 2026 · 23:16", apiRequests: 1534, inputTokens: 2380000, outputTokens: 1110000, totalTokens: 3490000, cost: 102.48 },
  { ...dashboardUsage, date: "Oct 05, 2026 · 19:42", endpoint: "/v1/embeddings", apiRequests: 742, inputTokens: 810000, outputTokens: 0, totalTokens: 810000, cost: 24.81 },
  { ...dashboardUsage, date: "Oct 05, 2026 · 14:21", apiRequests: 986, inputTokens: 1640000, outputTokens: 690000, totalTokens: 2330000, cost: 76.13 },
  { ...dashboardUsage, date: "Oct 04, 2026 · 21:05", status: "Rate limited", apiRequests: 614, inputTokens: 1080000, outputTokens: 450000, totalTokens: 1530000, cost: 49.28 },
  { ...dashboardUsage, date: "Oct 04, 2026 · 16:33", endpoint: "/v1/embeddings", apiRequests: 503, inputTokens: 570000, outputTokens: 0, totalTokens: 570000, cost: 17.24 },
  { ...dashboardUsage, date: "Oct 03, 2026 · 11:18", status: "Failed", apiRequests: 228, inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0 },
];

export const dashboardSummary: DashboardSummary = {
  usage: dashboardUsage,
  billing,
  account: financialAccount,
  usageTrend,
  cashFlow: cashFlowData,
};
