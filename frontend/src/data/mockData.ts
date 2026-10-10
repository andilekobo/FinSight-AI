import type {
  AIInsight,
  Billing,
  DashboardSummary,
  FinancialAccount,
  Forecast,
  Transaction,
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

export const transactions: Transaction[] = [
  { id: "TX-882104", date: "Oct 06, 2026", description: "Cloud infrastructure · AWS", category: "Cloud services", type: "Expense", amount: 2480.9, status: "Completed" },
  { id: "TX-882103", date: "Oct 06, 2026", description: "Client payment · Acme Corp", category: "Client revenue", type: "Income", amount: 12500, status: "Completed" },
  { id: "TX-882102", date: "Oct 05, 2026", description: "FinSight AI · Usage billing", category: "Technology", type: "Expense", amount: 1248.64, status: "Pending" },
  { id: "TX-882101", date: "Oct 05, 2026", description: "Payroll · October cycle", category: "Payroll", type: "Expense", amount: 8400, status: "Completed" },
  { id: "TX-882100", date: "Oct 04, 2026", description: "Client payment · Northstar", category: "Client revenue", type: "Income", amount: 8750, status: "Completed" },
  { id: "TX-882099", date: "Oct 03, 2026", description: "Workspace · Figma", category: "Software", type: "Expense", amount: 240, status: "Completed" },
  { id: "TX-882098", date: "Oct 02, 2026", description: "Cloud infrastructure · GCP", category: "Cloud services", type: "Expense", amount: 1862.3, status: "Completed" },
  { id: "TX-882097", date: "Oct 01, 2026", description: "Client payment · Lumen Labs", category: "Client revenue", type: "Income", amount: 14200, status: "Completed" },
  { id: "TX-882096", date: "Sep 30, 2026", description: "FinSight AI · September invoice", category: "Technology", type: "Expense", amount: 2914.8, status: "Completed" },
  { id: "TX-882095", date: "Sep 29, 2026", description: "Team travel · London", category: "Travel", type: "Expense", amount: 680, status: "Declined" },
  { id: "TX-882094", date: "Sep 28, 2026", description: "Client payment · Acme Corp", category: "Client revenue", type: "Income", amount: 9500, status: "Completed" },
  { id: "TX-882093", date: "Sep 27, 2026", description: "Data platform · Snowflake", category: "Technology", type: "Expense", amount: 930, status: "Completed" },
];

export const insights: AIInsight[] = [
  { id: "insight-1", category: "Forecast", title: "October spend is tracking above average", description: "At the current pace, your usage bill is projected to reach $3,842 by October 31 — 18% higher than September.", impact: "+18% vs. last month", tone: "warning" },
  { id: "insight-2", category: "Trend", title: "Output tokens are driving cost growth", description: "Output token usage accounts for 68% of your bill. Recent customer-support sessions are generating longer responses.", impact: "68% of usage cost", tone: "neutral" },
  { id: "insight-3", category: "Anomaly", title: "API activity spiked on October 5", description: "Request volume rose 34% above your 7-day average between 2–4 PM UTC. The increase came from /v1/chat/completions.", impact: "+34% request volume", tone: "warning" },
  { id: "insight-4", category: "Recommendation", title: "Enable prompt caching for repeat requests", description: "Your repeated system prompts could benefit from caching. Based on current input volume, this may reduce token charges by around $186/month.", impact: "Save ~$186 / month", tone: "positive" },
];

export const dashboardSummary: DashboardSummary = {
  usage: dashboardUsage,
  billing,
  account: financialAccount,
  usageTrend,
  cashFlow: cashFlowData,
  recentTransactions: transactions.slice(0, 5),
};
