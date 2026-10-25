import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { DashboardWidgets } from "../components/dashboard/DashboardWidgets";
import { PageHeading } from "../components/ui/Primitives";
import {
  getAccounts,
  getCurrentUserId,
  getFinancialSummary,
  getAIInsights,
  getTransactions,
  type AIInsightsResponse,
  type Account,
  type FinancialSummary,
  type Transaction,
} from "../data/api";
import type { Forecast } from "../types";

type DashboardData = {
  accounts: Account[] | null;
  summary: FinancialSummary | null;
  transactions: Transaction[] | null;
  insights: AIInsightsResponse | null;
  cashFlow: Forecast[] | null;
  cashFlowCurrency: string | null;
};

type DashboardResource = keyof DashboardData;
type DashboardErrors = Partial<Record<DashboardResource, string>> & {
  dashboard?: string;
};

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
  cashFlowCurrency: null,
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
  if (
    !isRecord(value) ||
    typeof value.user_id !== "string" ||
    (typeof value.start_date !== "string" && value.start_date !== null) ||
    (typeof value.end_date !== "string" && value.end_date !== null) ||
    !isRecord(value.summary)
  ) {
    return false;
  }

  return Object.values(value.summary).every(
    (currencyTotals) =>
      isRecord(currencyTotals) &&
      (["income", "expense", "fee"] as const).every((type) => {
        const amount = currencyTotals[type];
        return (
          isRecord(amount) &&
          isAmount(amount.total) &&
          typeof amount.count === "number" &&
          Number.isFinite(amount.count)
        );
      }),
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

function isAIInsightsResponse(value: unknown): value is AIInsightsResponse {
  return (
    isRecord(value) &&
    typeof value.user_id === "string" &&
    typeof value.period_days === "number" &&
    Number.isFinite(value.period_days) &&
    isAmount(value.current_spending) &&
    isAmount(value.previous_spending) &&
    typeof value.change_percent === "number" &&
    Number.isFinite(value.change_percent) &&
    typeof value.message === "string"
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
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const exportInProgress = useRef(false);

  async function handleExportReport() {
    if (exportInProgress.current || loading) return;
    exportInProgress.current = true;
    setExporting(true);
    setExportError("");

    try {
      const { createFinancialReport } = await import(
        "../utils/financialReport"
      );
      const report = createFinancialReport({
        accounts: data.accounts,
        summary: data.summary,
        transactions: data.transactions,
        insights: data.insights,
        cashFlow: data.cashFlow,
        cashFlowCurrency: data.cashFlowCurrency,
      });
      const downloadUrl = URL.createObjectURL(report.blob);
      let downloadStarted = false;
      try {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = report.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        downloadStarted = true;
      } finally {
        if (!downloadStarted) URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error("Could not generate the financial report.", error);
      setExportError("Could not generate the report. Please try again.");
    } finally {
      exportInProgress.current = false;
      setExporting(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setData(emptyData);
      setErrors({});

      try {
        const userId = getCurrentUserId();
        if (!userId) {
          setErrors({
            accounts: "Your session could not identify the signed-in user. Please sign in again.",
            summary: "Your session could not identify the signed-in user. Please sign in again.",
            transactions: "Your session could not identify the signed-in user. Please sign in again.",
            insights: "Your session could not identify the signed-in user. Please sign in again.",
            cashFlow: "Your session could not identify the signed-in user. Please sign in again.",
          });
          return;
        }

        const periods = recentMonths(6);
        const [[accountsResult, summaryResult, transactionsResult, insightsResult], monthlyResults] =
          await Promise.all([
            Promise.allSettled([
              getAccounts(userId),
              getFinancialSummary(userId),
              getTransactions(userId, 4),
              getAIInsights(),
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
          isAIInsightsResponse,
          "Could not load the spending comparison.",
        );
        const monthlySummaries: Array<{ month: string; summary: FinancialSummary }> = [];
        let cashFlowError: string | undefined;
        let successfulMonthCount = 0;

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
          monthlySummaries.push({
            month: periods[index].month,
            summary: monthlySummary.value,
          });
        });

        const cashFlowCurrencies = new Set(
          monthlySummaries.flatMap(({ summary }) => Object.keys(summary.summary)),
        );
        let cashFlow: Forecast[] | null = null;
        let cashFlowCurrency: string | null = null;
        if (successfulMonthCount > 0 && cashFlowCurrencies.size === 0) {
          cashFlow = [];
        } else if (successfulMonthCount > 0 && cashFlowCurrencies.size === 1) {
          const [currency] = Array.from(cashFlowCurrencies);
          cashFlowCurrency = currency;
          cashFlow = monthlySummaries.map(({ month, summary }) => {
            const totals = summary.summary[currency];
            return totals
              ? {
                  month,
                  income: Number(totals.income.total),
                  expenses: Number(totals.expense.total),
                }
              : { month };
          });
        } else if (cashFlowCurrencies.size > 1) {
          cashFlowError =
            "Monthly cash-flow history is not charted because the backend returned multiple currencies.";
        }

        setData({
          accounts: accounts.value,
          summary: summary.value,
          transactions: transactions.value,
          insights: insights.value,
          cashFlow,
          cashFlowCurrency,
        });
        setErrors({
          ...(accounts.error ? { accounts: accounts.error } : {}),
          ...(summary.error ? { summary: summary.error } : {}),
          ...(transactions.error ? { transactions: transactions.error } : {}),
          ...(insights.error ? { insights: insights.error } : {}),
          ...(cashFlowError
            ? {
                cashFlow: cashFlowError,
              }
            : {}),
        });
      } catch (error) {
        if (active) {
          setErrors({
            dashboard:
              error instanceof Error
                ? `Could not load dashboard data: ${error.message}`
                : "Could not load dashboard data.",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
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
          <div className="export-report-action">
            <button
              className="button button-secondary"
              onClick={() => void handleExportReport()}
              disabled={loading || exporting}
              aria-busy={exporting}
            >
              <Download size={15} /> {exporting ? "Preparing report…" : "Export report"}
            </button>
            {exportError && (
              <span className="export-report-error" role="alert">
                {exportError}
              </span>
            )}
          </div>
        }
      />

      {hasErrors && (
        <div className="empty-state" role="alert">
          {errors.dashboard ??
            "Some dashboard data could not be loaded. See the affected panels for details."}{" "}
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
        cashFlowCurrency={data.cashFlowCurrency}
        refreshKey={refreshKey}
        errors={errors}
        loading={loading}
      />
    </>
  );
}
