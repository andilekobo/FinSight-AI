import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { DashboardWidgets } from "../components/dashboard/DashboardWidgets";
import { PageHeading } from "../components/ui/Primitives";
import {
  getAccounts,
  getCurrentUserId,
  getFinancialSummary,
  getSavedInsights,
  getTransactions,
  type Account,
  type FinancialSummary,
  type SavedInsight,
  type SavedInsightsResponse,
  type Transaction,
} from "../data/api";
import type { Forecast } from "../types";

type DashboardData = {
  accounts: Account[] | null;
  summary: FinancialSummary | null;
  transactions: Transaction[] | null;
  insights: SavedInsight[] | null;
  cashFlow: Forecast[] | null;
};

type DashboardResource = keyof DashboardData;
type DashboardErrors = Partial<Record<DashboardResource, string>>;

type MonthPeriod = {
  month: string;
  startDate: string;
  endDate: string;
};

const emptyData: DashboardData = {
  accounts: null,
  summary: null,
  transactions: null,
  insights: null,
  cashFlow: null,
};

function recentMonths(count: number): MonthPeriod[] {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const firstDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - count + index + 1, 1),
    );
    const year = firstDay.getUTCFullYear();
    const monthIndex = firstDay.getUTCMonth();
    const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0));

    return {
      month: firstDay.toLocaleDateString("en-ZA", { month: "short", timeZone: "UTC" }),
      startDate: `${firstDay.toISOString().slice(0, 10)}T00:00:00`,
      endDate: `${lastDay.toISOString().slice(0, 10)}T23:59:59.999999`,
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAmount(value: unknown): value is number | string {
  return (
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "string" &&
      value.trim() !== "" &&
      Number.isFinite(Number(value)))
  );
}

function isAccountList(value: unknown): value is Account[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.user_id === "string" &&
        typeof item.account_name === "string" &&
        typeof item.account_type === "string" &&
        typeof item.currency === "string" &&
        isAmount(item.balance),
    )
  );
}

function isFinancialSummary(value: unknown): value is FinancialSummary {
  return (
    isRecord(value) &&
    typeof value.user_id === "string" &&
    isAmount(value.total_income) &&
    isAmount(value.total_expenses) &&
    isAmount(value.total_fees) &&
    isAmount(value.net_cash_flow) &&
    typeof value.transaction_count === "number" &&
    Number.isFinite(value.transaction_count) &&
    isRecord(value.period) &&
    (typeof value.period.start_date === "string" || value.period.start_date === null) &&
    (typeof value.period.end_date === "string" || value.period.end_date === null)
  );
}

function isTransactionList(value: unknown): value is Transaction[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.user_id === "string" &&
        typeof item.account_id === "string" &&
        (item.transaction_type === "income" ||
          item.transaction_type === "expense" ||
          item.transaction_type === "fee") &&
        typeof item.category === "string" &&
        typeof item.description === "string" &&
        isAmount(item.amount) &&
        typeof item.currency === "string" &&
        typeof item.transaction_date === "string",
    )
  );
}

function isSavedInsightsResponse(value: unknown): value is SavedInsightsResponse {
  return (
    isRecord(value) &&
    typeof value.count === "number" &&
    Number.isFinite(value.count) &&
    Array.isArray(value.insights) &&
    value.insights.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        (item.title === undefined || typeof item.title === "string") &&
        (item.description === undefined || typeof item.description === "string") &&
        (item.insight_type === undefined || typeof item.insight_type === "string") &&
        (item.category === undefined || typeof item.category === "string") &&
        (item.message === undefined || typeof item.message === "string") &&
        (item.severity === undefined || typeof item.severity === "string") &&
        (item.created_at === undefined || typeof item.created_at === "string"),
    )
  );
}

function readResource<T>(
  result: PromiseSettledResult<T>,
  isValid: (value: unknown) => value is T,
  failureMessage: string,
): { value: T | null; error: string | null } {
  if (result.status === "rejected") {
    return {
      value: null,
      error: result.reason instanceof Error ? result.reason.message : failureMessage,
    };
  }

  if (!isValid(result.value)) {
    return { value: null, error: `The backend returned an unexpected response for ${failureMessage.toLowerCase()}` };
  }

  return { value: result.value, error: null };
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [errors, setErrors] = useState<DashboardErrors>({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setData(emptyData);
      setErrors({});

      const userId = getCurrentUserId();
      if (!userId) {
        if (active) {
          setErrors({
            accounts: "Your session could not identify the signed-in user. Please sign in again.",
            summary: "Your session could not identify the signed-in user. Please sign in again.",
            transactions: "Your session could not identify the signed-in user. Please sign in again.",
            insights: "Your session could not identify the signed-in user. Please sign in again.",
            cashFlow: "Your session could not identify the signed-in user. Please sign in again.",
          });
          setLoading(false);
        }
        return;
      }

      const periods = recentMonths(6);
      const [[accountsResult, summaryResult, transactionsResult, insightsResult], monthlyResults] =
        await Promise.all([
          Promise.allSettled([
            getAccounts(userId),
            getFinancialSummary(userId),
            getTransactions(userId, 4),
            getSavedInsights(),
          ]),
          Promise.allSettled(
            periods.map((period) =>
              getFinancialSummary(userId, {
                startDate: period.startDate,
                endDate: period.endDate,
              }),
            ),
          ),
        ]);

      if (!active) return;

      const accounts = readResource(
        accountsResult,
        isAccountList,
        "Could not load account balances.",
      );
      const summary = readResource(
        summaryResult,
        isFinancialSummary,
        "Could not load financial totals.",
      );
      const transactions = readResource(
        transactionsResult,
        isTransactionList,
        "Could not load recent transactions.",
      );
      const insights = readResource(
        insightsResult,
        isSavedInsightsResponse,
        "Could not load saved insights.",
      );
      const cashFlow: Forecast[] = [];
      let cashFlowError: string | undefined;
      let successfulMonthCount = 0;
      let monthsWithTransactions = 0;

      monthlyResults.forEach((result, index) => {
        const monthlySummary = readResource(
          result,
          isFinancialSummary,
          "Could not load monthly cash-flow data.",
        );
        if (!monthlySummary.value) {
          cashFlowError = monthlySummary.error ?? "Could not load monthly cash-flow data.";
          return;
        }

        successfulMonthCount += 1;
        if (monthlySummary.value.transaction_count > 0) monthsWithTransactions += 1;
        cashFlow.push({
          month: periods[index].month,
          income: Number(monthlySummary.value.total_income),
          expenses: Number(monthlySummary.value.total_expenses),
        });
      });

      setData({
        accounts: accounts.value,
        summary: summary.value,
        transactions: transactions.value,
        insights: insights.value?.insights ?? null,
        cashFlow:
          successfulMonthCount === 0
            ? null
            : monthsWithTransactions > 0
              ? cashFlow
              : [],
      });
      setErrors({
        ...(accounts.error ? { accounts: accounts.error } : {}),
        ...(summary.error ? { summary: summary.error } : {}),
        ...(transactions.error ? { transactions: transactions.error } : {}),
        ...(insights.error ? { insights: insights.error } : {}),
        ...(cashFlowError
          ? {
              cashFlow:
                successfulMonthCount > 0
                  ? "Some monthly periods could not be loaded; the chart shows only periods returned successfully."
                  : cashFlowError,
            }
          : {}),
      });
      setLoading(false);
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <>
      <PageHeading
        eyebrow={today.toUpperCase()}
        title="Overview"
        description="Your financial position and recent activity, based on your recorded data."
        action={
          <button
            className="button button-secondary"
            onClick={() => window.print()}
          >
            <Download size={15} /> Export report
          </button>
        }
      />

      {hasErrors && (
        <div className="empty-state" role="alert">
          Some dashboard data could not be loaded. See the affected panels for
          details.{" "}
          <button
            className="button button-secondary"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            Try again
          </button>
        </div>
      )}

      <DashboardWidgets
        accounts={data.accounts}
        summary={data.summary}
        transactions={data.transactions}
        insights={data.insights}
        cashFlow={data.cashFlow}
        errors={errors}
        loading={loading}
      />
    </>
  );
}
