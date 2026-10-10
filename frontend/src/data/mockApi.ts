import {
  billing,
  cashFlowData,
  dashboardSummary,
  financialAccount,
  insights,
  transactions,
  usageHistory,
  usageTrend,
} from "./mockData";
import type {
  AIInsight,
  Billing,
  DashboardSummary,
  FinancialAccount,
  Forecast,
  Transaction,
  Usage,
} from "../types";

export type TransactionFilters = {
  search?: string;
  type?: "All" | "Income" | "Expense";
  category?: string;
};

export const FUTURE_API_ROUTES = {
  dashboard: "GET /api/dashboard/summary",
  usage: "GET /api/usage",
  billing: "GET /api/billing",
  financialSummary: "GET /api/financial/summary",
  transactions: "GET /api/transactions",
  aiInsights: "GET /api/ai/insights",
  aiChat: "POST /api/ai/chat",
} as const;

// Mock adapter mirrors the future API boundary so fixtures can be swapped for HTTP calls.
export const getDashboardSummary = (): DashboardSummary => dashboardSummary;
export const getUsage = (): Usage[] => usageHistory;
export const getBilling = (): Billing => billing;
export const getFinancialSummary = (): { account: FinancialAccount; cashFlow: Forecast[] } => ({
  account: financialAccount,
  cashFlow: cashFlowData,
});
export const getTransactions = (filters: TransactionFilters = {}): Transaction[] =>
  transactions.filter((transaction) => {
    const matchesSearch = `${transaction.description} ${transaction.category} ${transaction.id}`
      .toLowerCase()
      .includes(filters.search?.toLowerCase() ?? "");
    const matchesType = !filters.type || filters.type === "All" || transaction.type === filters.type;
    const matchesCategory = !filters.category || filters.category === "All" || transaction.category === filters.category;
    return matchesSearch && matchesType && matchesCategory;
  });
export const getAIInsights = (): AIInsight[] => insights;
export const getUsageTrend = (): Forecast[] => usageTrend;

export const postAIChat = (prompt: string): string => {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes("spent") || lowerPrompt.includes("cost")) {
    return `Your current October usage bill is $${billing.currentBill.toLocaleString("en-US", { minimumFractionDigits: 2 })}. Token usage makes up about 82% of that total.`;
  }
  if (lowerPrompt.includes("end of the month") || lowerPrompt.includes("forecast") || lowerPrompt.includes("bill")) {
    return `Based on your current usage pace, I project an October bill of $${billing.projectedBill.toLocaleString("en-US", { minimumFractionDigits: 2 })}. That is about 18% above September.`;
  }
  if (lowerPrompt.includes("quota")) {
    const percent = Math.round((dashboardSummary.usage.totalTokens / dashboardSummary.usage.quota) * 100);
    return `You have used ${percent}% of your monthly token quota (${(dashboardSummary.usage.totalTokens / 1_000_000).toFixed(1)}M of ${(dashboardSummary.usage.quota / 1_000_000).toFixed(0)}M tokens).`;
  }
  if (lowerPrompt.includes("unusual") || lowerPrompt.includes("anomal")) {
    return "I noticed API request volume was 34% above your 7-day average on October 5, mainly from /v1/chat/completions. It may be worth checking the workload behind that spike.";
  }
  if (lowerPrompt.includes("cash flow") || lowerPrompt.includes("technology")) {
    return "Technology spending is about 13% of this month's expenses. Your net cash flow remains positive at $16,135.50, so current usage costs are manageable.";
  }
  return "Output tokens are currently your largest cost driver, accounting for about 68% of usage costs. Prompt caching for repeated context could save an estimated $186 per month.";
};
