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
  Account,
  FinancialSummary,
  SavedInsight,
  Transaction,
} from "../../data/api";
import type { Forecast } from "../../types";
import { CashFlowChart } from "../charts/Charts";
import { MetricCard, Panel } from "../ui/Primitives";

type DashboardWidgetsProps = {
  accounts: Account[] | null;
  summary: FinancialSummary | null;
  transactions: Transaction[] | null;
  insights: SavedInsight[] | null;
  cashFlow: Forecast[] | null;
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

function formatCurrency(value: number | string, currency: string): string {
  const parsed = numericValue(value);
  if (parsed === null || !/^[A-Z]{3}$/.test(currency)) return "Unavailable";

  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency,
    }).format(parsed);
  } catch (error) {
    if (error instanceof RangeError) return "Unavailable (invalid currency)";
    throw error;
  }
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

function unavailableMessage(loading: boolean, error: string | undefined, empty: string, pending: string): string {
  if (loading) return pending;
  if (error) return error;
  return empty;
}

function insightType(insight: SavedInsight): string {
  const value = insight.insight_type ?? insight.category;
  return value ? value.replace(/_/g, " ") : "Saved insight";
}

export function DashboardWidgets({
  accounts,
  summary,
  transactions,
  insights,
  cashFlow,
  errors,
  loading,
}: DashboardWidgetsProps) {
  const balanceSummary = accountBalanceSummary(accounts, loading, errors.accounts);
  const latestInsight = insights?.[0];
  const insightTitle = latestInsight?.title ?? latestInsight?.message;

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
          value={summary ? formatAmount(summary.total_income) : loading ? "Loading…" : "Unavailable"}
          detail={summary ? `${summary.transaction_count} recorded transactions` : "From financial records"}
          icon={<ArrowDownLeft size={18} />}
          tone="green"
        />
        <MetricCard
          label="Total expenses"
          value={summary ? formatAmount(summary.total_expenses) : loading ? "Loading…" : "Unavailable"}
          detail="Recorded expenses"
          icon={<Coins size={18} />}
          tone="violet"
        />
        <MetricCard
          label="Net cash flow"
          value={summary ? formatAmount(summary.net_cash_flow) : loading ? "Loading…" : "Unavailable"}
          detail="Income less expenses and fees"
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
            <div className="empty-state">
              {unavailableMessage(
                loading,
                undefined,
                "Usage history is unavailable. The backend does not expose a user-addressable cost time series.",
                "Loading dashboard data…",
              )}
            </div>
          </div>
          <div className="chart-footnote"><span className="footnote-dot" /> Usage chart requires backend time-series data</div>
        </Panel>

        <Panel title="Quota overview" subtitle="Monthly token consumption" className="quota-panel">
          <div className="quota-total">Unavailable<small> token usage</small></div>
          <div className="quota-progress" aria-label="Quota usage unavailable" />
          <div className="quota-scale"><span>Unavailable</span><span>Monthly limit not available</span></div>
          <div className="quota-stats">
            <div><span><i className="legend-dot legend-green" /> Input tokens</span><strong>Unavailable</strong></div>
            <div><span><i className="legend-dot legend-blue" /> Output tokens</span><strong>Unavailable</strong></div>
          </div>
          <div className="empty-state">
            {unavailableMessage(
              loading,
              undefined,
              "Usage endpoint requires a tenant ID that the authenticated frontend session does not provide.",
              "Loading dashboard data…",
            )}
          </div>
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
              <span>Net cash flow · currency not supplied</span>
              <strong><CircleDollarSign size={15} /> {summary ? formatAmount(summary.net_cash_flow) : "Unavailable"}</strong>
            </div>
          </div>

          <div className="quota-stats">
            <div><span>Total income · currency not supplied</span><strong>{summary ? formatAmount(summary.total_income) : "Unavailable"}</strong></div>
            <div><span>Total expenses · currency not supplied</span><strong>{summary ? formatAmount(summary.total_expenses) : "Unavailable"}</strong></div>
            <div><span>Total fees · currency not supplied</span><strong>{summary ? formatAmount(summary.total_fees) : "Unavailable"}</strong></div>
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
            <CashFlowChart data={cashFlow} />
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
          subtitle="Saved financial insights returned by the backend"
          className="insight-panel"
          action={<span className="ai-label"><SparkleIcon /> SAVED INSIGHTS</span>}
        >
          {latestInsight ? (
            <>
              <div className="insight-callout">
                <div className="insight-icon"><Bot size={17} /></div>
                <div>
                  <strong>{insightTitle ?? "Saved financial insight"}</strong>
                  <p>{latestInsight.description ?? "The backend did not include a description for this insight."}</p>
                </div>
              </div>
              <div className="insight-quick">
                <span><span className="insight-mini-icon"><Cpu size={14} /></span> {insightType(latestInsight)}</span>
                <span className="insight-savings">{latestInsight.severity ?? dateLabel(latestInsight.created_at)}</span>
              </div>
            </>
          ) : (
            <div className="insight-callout">
              <div className="insight-icon"><Bot size={17} /></div>
              <div>
                <strong>{unavailableMessage(loading, errors.insights, "No saved insights are available yet.", "Loading saved insights…")}</strong>
                <p>{errors.insights ?? "Insights appear here after the backend has saved them for your account."}</p>
              </div>
            </div>
          )}
          <div className="insight-quick">
            <span><span className="insight-mini-icon"><Cpu size={14} /></span> Saved insights</span>
            <span className="insight-savings">{insights?.length ?? "Unavailable"}</span>
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
          <div className="breakdown-row"><span className="breakdown-icon breakdown-api"><Zap size={16} /></span><span className="breakdown-label">API requests</span><strong>Unavailable</strong><small>Not exposed</small></div>
          <div className="breakdown-row"><span className="breakdown-icon breakdown-token"><Coins size={16} /></span><span className="breakdown-label">Token usage</span><strong>Unavailable</strong><small>Not exposed</small></div>
          <div className="breakdown-row"><span className="breakdown-icon breakdown-platform"><CircleDollarSign size={16} /></span><span className="breakdown-label">Platform fee</span><strong>Unavailable</strong><small>Not exposed</small></div>
          <div className="breakdown-total"><span>Billing total</span><strong>Unavailable</strong></div>
          <div className="empty-state">
            {unavailableMessage(
              loading,
              undefined,
              "The backend has no billing-summary endpoint. Its billing route only creates checkout sessions.",
              "Loading dashboard data…",
            )}
          </div>
          <Link className="panel-link" to="/billing">Go to billing <ArrowRight size={14} /></Link>
        </Panel>
      </div>
    </>
  );
}

function SparkleIcon() {
  return <MoreHorizontal size={14} />;
}
