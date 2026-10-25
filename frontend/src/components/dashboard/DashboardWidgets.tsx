import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  Bot,
  CircleDollarSign,
  Coins,
  Cpu,
  CreditCard,
  MoreHorizontal,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import type {
  AIInsightsResponse,
  Account,
  FinancialSummary,
  FinancialTransactionType,
  Transaction,
  UsageResponse,
  UsageHistoryResponse,
} from "../../data/api";
import { getUsage, getUsageHistory } from "../../data/api";
import type { Forecast } from "../../types";
import { formatCurrency } from "../../utils/currency";
import { CashFlowChart } from "../charts/Charts";
import { MetricCard, Panel } from "../ui/Primitives";

type DashboardWidgetsProps = {
  accounts: Account[] | null;
  summary: FinancialSummary | null;
  transactions: Transaction[] | null;
  insights: AIInsightsResponse | null;
  cashFlow: Forecast[] | null;
  cashFlowCurrency: string | null;
  refreshKey: number;
  errors: Partial<Record<"accounts" | "summary" | "transactions" | "insights" | "cashFlow", string>>;
  loading: boolean;
};

function numericValue(value: number | string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatAmount(value: number | string): string {
  const parsed = numericValue(value);
  return parsed === null ? "Unavailable" : new Intl.NumberFormat("en-ZA").format(parsed);
}

function accountBalanceSummary(accounts: Account[] | null, loading: boolean, error?: string): string {
  if (loading && accounts === null) return "Loading…";
  if (error) return "Unavailable";
  if (!accounts?.length) return "No accounts";

  const totals = new Map<string, number>();
  for (const account of accounts) {
    const balance = numericValue(account.balance);
    if (balance === null) return "Unavailable";
    totals.set(account.currency, (totals.get(account.currency) ?? 0) + balance);
  }

  if (totals.size !== 1) return `${totals.size} currencies`;
  const [currency, total] = [...totals.entries()][0];
  return formatCurrency(total, currency);
}

function dateLabel(value: string | undefined): string {
  if (!value) return "Timestamp not supplied";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function unavailableMessage(loading: boolean, error: string | undefined, empty: string, pending: string): string {
  if (loading) return pending;
  if (error) return error;
  return empty;
}

function financialSummaryAmounts(
  summary: FinancialSummary | null,
  type: FinancialTransactionType,
): string {
  if (!summary) return "Unavailable";
  const values = Object.entries(summary.summary).map(([currency, totals]) =>
    formatCurrency(totals[type].total, currency),
  );
  return values.length ? values.join(" · ") : "No totals";
}

function financialSummaryNetCashFlow(summary: FinancialSummary | null): string {
  if (!summary) return "Unavailable";
  const values = Object.entries(summary.summary).map(([currency, totals]) => {
    const income = numericValue(totals.income.total);
    const expenses = numericValue(totals.expense.total);
    const fees = numericValue(totals.fee.total);
    return income === null || expenses === null || fees === null
      ? "Unavailable"
      : formatCurrency(income - expenses - fees, currency);
  });
  return values.length ? values.join(" · ") : "No totals";
}

function financialTransactionCount(summary: FinancialSummary | null): number {
  if (!summary) return 0;
  return Object.values(summary.summary).reduce(
    (count, totals) =>
      count + totals.income.count + totals.expense.count + totals.fee.count,
    0,
  );
}

function percentageLabel(value: number): string {
  const formatted = new Intl.NumberFormat("en-ZA", {
    maximumFractionDigits: 2,
  }).format(value);
  return `${value > 0 ? "+" : ""}${formatted}%`;
}

function formatZarCents(cents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(cents / 100);
}

function formatTokens(tokens: number): string {
  return new Intl.NumberFormat("en-ZA").format(tokens);
}

function quotaPercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.max(0, (used / limit) * 100));
}

export function DashboardWidgets({
  accounts,
  summary,
  transactions,
  insights,
  cashFlow,
  cashFlowCurrency,
  refreshKey,
  errors,
  loading,
}: DashboardWidgetsProps) {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageError, setUsageError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setUsageLoading(true);
    setUsageError(null);

    getUsage()
      .then((result) => {
        if (!active) return;
        setUsage(result);
        setUsageError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setUsage(null);
        setUsageError(
          error instanceof Error
            ? error.message
            : "Could not load usage and billing data.",
        );
      })
      .finally(() => {
        if (active) setUsageLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const [usageHistory, setUsageHistory] = useState<UsageHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setHistoryLoading(true);
    setHistoryError(null);

    getUsageHistory(new Date().getFullYear())
      .then((result) => {
        if (!active) return;
        setUsageHistory(result);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setUsageHistory(null);
        setHistoryError(
          error instanceof Error ? error.message : "Could not load usage history.",
        );
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const balanceSummary = accountBalanceSummary(accounts, loading, errors.accounts);

  return (
    <>
      <div className="welcome-banner">
        <div className="welcome-copy">
          <div className="welcome-eyebrow"><span className="live-pulse" /> FINANCIAL PULSE <span>·</span> ACCOUNT OVERVIEW</div>
          <h2>Your financial overview <span>✦</span></h2>
          <p>A clear view of your recorded finances and account activity.</p>
        </div>
        <div className="banner-orbit orbit-one" /><div className="banner-orbit orbit-two" /><div className="banner-orbit orbit-three" />
        <div className="banner-sparkle"><Zap size={16} fill="currentColor" /></div>
      </div>

      <div className="metric-grid">
        <MetricCard
          label="Total income"
          value={summary ? financialSummaryAmounts(summary, "income") : loading ? "Loading…" : "Unavailable"}
          detail={summary ? `${financialTransactionCount(summary)} transactions · shown by currency` : "From financial records"}
          icon={<ArrowDownLeft size={18} />}
          tone="green"
        />
        <MetricCard
          label="Total expenses"
          value={summary ? financialSummaryAmounts(summary, "expense") : loading ? "Loading…" : "Unavailable"}
          detail="Totals shown separately by currency"
          icon={<Coins size={18} />}
          tone="violet"
        />
        <MetricCard
          label="Net cash flow"
          value={summary ? financialSummaryNetCashFlow(summary) : loading ? "Loading…" : "Unavailable"}
          detail="Income less expenses and fees, by currency"
          icon={<CircleDollarSign size={18} />}
          tone="blue"
        />
        <MetricCard
          label="Account balance"
          value={balanceSummary}
          detail={accounts?.length ? `${accounts.length} backend accounts` : "From backend account records"}
          icon={<CreditCard size={18} />}
          tone="amber"
        />
      </div><div className="dashboard-grid">
        <Panel
          title="Usage & cost"
          subtitle="Your monthly spend against the current billing period"
          className="usage-panel"
          action={<button className="text-action" type="button">This year <span>⌄</span></button>}
        >
          <div className="chart-legend"><span><i className="legend-dot legend-green" /> Actual cost</span><span><i className="legend-dash" /> Projected</span></div>
          <div className="chart-wrap">
            {historyLoading ? (
              <div className="empty-state">Loading usage history?</div>
            ) : historyError ? (
              <div className="empty-state" role="alert">{historyError}</div>
            ) : !usageHistory || !usageHistory.has_data ||
                !usageHistory.monthly.some((m) => Number(m.actual_cost_zar) > 0 || Number(m.projected_cost_zar) > 0) ? (
              <div className="empty-state">
                No recorded usage costs for {usageHistory?.year ?? new Date().getFullYear()} yet.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: "8px", height: "190px", alignItems: "end", paddingTop: "12px" }}>
                {usageHistory.monthly.map((month) => {
                  const actual = Number(month.actual_cost_zar) || 0;
                  const projected = month.projected_cost_zar == null
                    ? 0
                    : Number(month.projected_cost_zar) || 0;
                  const max = Math.max(
                    1,
                    ...usageHistory.monthly.flatMap((m) => [
                      Number(m.actual_cost_zar) || 0,
                      m.projected_cost_zar == null ? 0 : Number(m.projected_cost_zar) || 0,
                    ]),
                  );
                  return (
                    <div key={month.month} title={`${month.label}: actual R${actual.toFixed(2)}; projected ${month.projected_cost_zar == null ? "not available" : `R${projected.toFixed(2)}`}`} style={{ minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "end", alignItems: "center", gap: "5px" }}>
                      <div style={{ height: "155px", width: "100%", display: "flex", alignItems: "end", justifyContent: "center", gap: "2px" }}>
                        <div style={{ width: "40%", minHeight: actual > 0 ? "2px" : "0", height: `${actual / max * 100}%`, background: "#18a879", borderRadius: "3px 3px 0 0" }} />
                        <div style={{ width: "40%", minHeight: projected > 0 ? "2px" : "0", height: `${projected / max * 100}%`, background: "#78a5d2", borderRadius: "3px 3px 0 0", opacity: 0.8 }} />
                      </div>
                      <span style={{ fontSize: "10px" }}>{month.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="chart-footnote"><span className="footnote-dot" /> Usage chart requires backend time-series data</div>
        </Panel>

        <Panel title="Quota overview" subtitle="Monthly token consumption" className="quota-panel">
          <div className="quota-total">
            {usage
              ? formatTokens(usage.usage.tokens.total_billable_tokens)
              : usageLoading ? "Loading?" : "Unavailable"}
            <small> billable tokens</small>
          </div>
          <div
            className="quota-progress"
            role="progressbar"
            aria-label="Monthly token quota"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={usage
              ? quotaPercent(
                  usage.usage.tokens.total_billable_tokens,
                  usage.usage.token_limit,
                )
              : 0}
          >
            <div
              className="quota-progress-fill"
              style={{
                width: usage
                  ? `${quotaPercent(
                      usage.usage.tokens.total_billable_tokens,
                      usage.usage.token_limit,
                    )}%`
                  : "0%",
              }}
            />
          </div>
          <div className="quota-scale">
            <span>
              {usage
                ? `${formatTokens(usage.usage.tokens.total_billable_tokens)} used`
                : usageLoading ? "Loading?" : "Unavailable"}
            </span>
            <span>
              {usage
                ? `${formatTokens(usage.usage.token_limit)} token limit`
                : "Monthly limit unavailable"}
            </span>
          </div>
          <div className="quota-stats">
            <div>
              <span><i className="legend-dot legend-green" /> Input tokens</span>
              <strong>
                {usage
                  ? formatTokens(usage.usage.tokens.input_tokens)
                  : usageLoading ? "Loading?" : "Unavailable"}
              </strong>
            </div>
            <div>
              <span><i className="legend-dot legend-blue" /> Output tokens</span>
              <strong>
                {usage
                  ? formatTokens(
                      usage.usage.tokens.reasoning_tokens +
                      usage.usage.tokens.output_tokens,
                    )
                  : usageLoading ? "Loading?" : "Unavailable"}
              </strong>
            </div>
          </div>
          {usageError && (
            <div className="empty-state" role="alert">{usageError}</div>
          )}
          <Link className="panel-link" to="/usage">View usage details <ArrowRight size={14} /></Link>
        </Panel>

        <Panel
          title="Financial overview"
          subtitle="Account balances and financial totals from your records"
          className="cashflow-panel"
          action={<span className="account-tag">{errors.accounts ? "Unavailable" : loading ? "Loading" : "Backend data"}</span>}
        >
          <div className="financial-totals">
            <div><span>Account balance</span><strong>{balanceSummary}</strong></div>
            <div className="net-cash">
              <span>Net cash flow · by currency</span>
              <strong><CircleDollarSign size={15} /> {financialSummaryNetCashFlow(summary)}</strong>
            </div>
          </div>

          <div className="quota-stats">
            <div><span>Total income · by currency</span><strong>{financialSummaryAmounts(summary, "income")}</strong></div>
            <div><span>Total expenses · by currency</span><strong>{financialSummaryAmounts(summary, "expense")}</strong></div>
            <div><span>Total fees · by currency</span><strong>{financialSummaryAmounts(summary, "fee")}</strong></div>
          </div>

          {accounts === null || accounts.length === 0 ? (
            <div className="empty-state">
              {unavailableMessage(
                loading,
                errors.accounts,
                "No account records were returned for this user.",
                "Loading account balances…",
              )}
            </div>
          ) : (
            <div className="transaction-list compact-list">
              {accounts.map((account) => (
                <div className="transaction-row" key={account.id}>
                  <div className="transaction-icon"><CreditCard size={15} /></div>
                  <div className="transaction-description">
                    <strong>{account.account_name}</strong>
                    <span>{account.account_type} · {account.currency}</span>
                  </div>
                  <div className="transaction-amount">{formatCurrency(account.balance, account.currency)}</div>
                </div>
              ))}
            </div>
          )}
          <div className="mini-legend"><span><i className="legend-dot legend-green" /> Income totals</span><span><i className="legend-dot legend-pale" /> Expense totals</span></div>
          {cashFlow?.length ? (
            <CashFlowChart data={cashFlow} currency={cashFlowCurrency ?? undefined} />
          ) : (
            <div className="chart-wrap">
              <div className="empty-state">
                {cashFlow && cashFlow.length === 0 && !errors.cashFlow
                  ? "No financial transactions were recorded in the last six months."
                  : unavailableMessage(
                      loading,
                      errors.cashFlow,
                      "Monthly cash-flow history is unavailable.",
                      "Loading financial history…",
                    )}
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="AI insights"
          subtitle="Spending comparison returned by the backend"
          className="insight-panel"
          action={<span className="ai-label"><SparkleIcon /> SPENDING TRENDS</span>}
        >
          {insights ? (
            <>
              <div className="insight-callout">
                <div className="insight-icon"><Bot size={17} /></div>
                <div>
                  <strong>{insights.message}</strong>
                  <p>
                    Current spending: {formatAmount(insights.current_spending)} ·
                    Previous {insights.period_days} days: {formatAmount(insights.previous_spending)}.
                    Currency is not supplied by this response.
                  </p>
                </div>
              </div>
              <div className="insight-quick">
                <span><span className="insight-mini-icon"><Cpu size={14} /></span> Spending change</span>
                <span className="insight-savings">{percentageLabel(insights.change_percent)}</span>
              </div>
            </>
          ) : (
            <div className="insight-callout">
              <div className="insight-icon"><Bot size={17} /></div>
              <div>
                <strong>{unavailableMessage(loading, errors.insights, "No spending comparison is available.", "Loading spending comparison…")}</strong>
                <p>{errors.insights ?? "The backend did not return a spending comparison."}</p>
              </div>
            </div>
          )}
          <div className="insight-quick">
            <span><span className="insight-mini-icon"><Cpu size={14} /></span> Comparison period</span>
            <span className="insight-savings">{insights ? `${insights.period_days} days` : "Unavailable"}</span>
          </div>
          <Link className="panel-link" to="/ai-insights">Explore all insights <ArrowRight size={14} /></Link>
        </Panel>

        <Panel
          title="Recent transactions"
          subtitle="Latest activity returned by your account"
          className="transactions-panel"
          action={<Link className="text-action" to="/transactions">View all <ArrowRight size={13} /></Link>}
        >
          {transactions === null || transactions.length === 0 ? (
            <div className="empty-state">
              {unavailableMessage(
                loading,
                errors.transactions,
                "No transactions were returned for this user yet.",
                "Loading recent transactions…",
              )}
            </div>
          ) : (
            <div className="transaction-list compact-list">
              {transactions.slice(0, 4).map((transaction) => {
                const income = transaction.transaction_type === "income";
                return (
                  <div className="transaction-row" key={transaction.id}>
                    <div className={`transaction-icon ${income ? "transaction-income" : ""}`}>
                      {income ? <ArrowDownLeft size={16} /> : <CreditCard size={15} />}
                    </div>
                    <div className="transaction-description">
                      <strong>{transaction.description}</strong>
                      <span>{dateLabel(transaction.transaction_date)} · {transaction.category}</span>
                    </div>
                    <div className={`transaction-amount ${income ? "amount-income" : ""}`}>
                      {income ? "+" : "−"}{formatCurrency(transaction.amount, transaction.currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Usage breakdown" subtitle="This billing period by service" className="breakdown-panel">
          <div className="breakdown-row">
            <span className="breakdown-icon breakdown-api"><Zap size={16} /></span>
            <span className="breakdown-label">API requests</span>
            <strong>
              {usage ? formatTokens(usage.usage.api_calls) : usageLoading ? "Loading?" : "Unavailable"}
            </strong>
            <small>
              {usage
                ? `${formatTokens(usage.usage.api_call_limit)} monthly limit`
                : usageError ?? "Usage data unavailable"}
            </small>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-icon breakdown-token"><Coins size={16} /></span>
            <span className="breakdown-label">Token cost</span>
            <strong>
              {usage
                ? formatZarCents(
                    usage.cost.input_cost_cents +
                    usage.cost.cached_input_cost_cents +
                    usage.cost.output_cost_cents
                  )
                : usageLoading ? "Loading?" : "Unavailable"}
            </strong>
            <small>Calculated from recorded token usage</small>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-icon breakdown-platform"><CircleDollarSign size={16} /></span>
            <span className="breakdown-label">API request cost</span>
            <strong>
              {usage
                ? formatZarCents(usage.cost.api_call_cost_cents)
                : usageLoading ? "Loading?" : "Unavailable"}
            </strong>
            <small>Calculated by backend</small>
          </div>
          <div className="breakdown-total">
            <span>Billing total</span>
            <strong>
              {usage
                ? formatZarCents(usage.cost.total_cost_cents)
                : usageLoading ? "Loading?" : "Unavailable"}
            </strong>
          </div>
          {usageError && (
            <div className="empty-state" role="alert">{usageError}</div>
          )}
          <Link className="panel-link" to="/billing">Go to billing <ArrowRight size={14} /></Link>
        </Panel>
      </div>
    </>
  );
}

function SparkleIcon() {
  return <MoreHorizontal size={14} />;
}
