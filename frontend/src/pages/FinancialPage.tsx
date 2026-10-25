import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Building2, RefreshCw, Wallet } from "lucide-react";
import { Currency, MetricCard, PageHeading, Panel } from "../components/ui/Primitives";
import { formatCurrency } from "../utils/currency";
import {
  getAccounts,
  getCurrentUserId,
  getFinancialSummary,
  type Account,
  type FinancialSummary,
  type FinancialTransactionType,
} from "../data/api";

function formatSummaryTotals(
  summary: FinancialSummary | null,
  type: FinancialTransactionType,
): string {
  if (!summary) return "Unavailable";
  const amounts = Object.entries(summary.summary).map(([currency, totals]) =>
    `${currency} ${formatCurrency(totals[type].total, currency)}`,
  );
  return amounts.length ? amounts.join(" · ") : "No totals";
}

function formatSummaryNetCashFlow(summary: FinancialSummary | null): string {
  if (!summary) return "Unavailable";
  const amounts = Object.entries(summary.summary).map(([currency, totals]) => {
    const income = Number(totals.income.total);
    const expenses = Number(totals.expense.total);
    const fees = Number(totals.fee.total);
    return Number.isFinite(income) && Number.isFinite(expenses) && Number.isFinite(fees)
      ? `${currency} ${formatCurrency(income - expenses - fees, currency)}`
      : `${currency} Unavailable`;
  });
  return amounts.length ? amounts.join(" · ") : "No totals";
}

export function FinancialPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      const userId = getCurrentUserId();
      if (!userId) {
        setError("Please sign in to view your financial information.");
        setAccounts([]);
        setSummary(null);
        setLoading(false);
        return;
      }

      try {
        const [accountData, summaryData] = await Promise.all([
          getAccounts(userId),
          getFinancialSummary(userId),
        ]);

        if (active) {
          setAccounts(accountData);
          setSummary(summaryData);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load financial information.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const currencies = new Set(accounts.map((account) => account.currency));
  const totalBalance = accounts.reduce(
    (total, account) => total + Number(account.balance),
    0,
  );
  const balanceSummary =
    accounts.length === 0
      ? "No accounts"
      : currencies.size === 1
        ? formatCurrency(totalBalance, accounts[0].currency)
        : "Balances in multiple currencies";
  const currencyLabel =
    accounts.length === 0
      ? "No account records"
      : currencies.size === 1
        ? accounts[0].currency || "Currency unavailable"
        : `${currencies.size} currencies`;

  return (
    <>
      <PageHeading
        eyebrow="FINANCIAL OVERVIEW"
        title="Financial"
        description="A clear view of your account data and business cash flow."
        action={
          <button
            className="button button-secondary"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
          >
            <RefreshCw size={14} />
            {loading ? "Refreshing…" : "Refresh data"}
          </button>
        }
      />

      <div className="connection-banner">
        <div className="connection-symbol"><Building2 size={18} /></div>
        <div>
          <strong>Financial data</strong>
          <p>Information is requested from your FinSight AI backend.</p>
        </div>
        <span className="connection-status">
          <i className="status-dot" /> Live API
        </span>
      </div>

      {error && <div className="empty-state" role="alert">{error}</div>}
      {loading && <div className="empty-state">Loading financial data…</div>}

      {!loading && !error && (
        <>
          <div className="account-hero">
            <div>
              <span className="account-eyebrow">
                <Wallet size={14} /> Total account balance
              </span>
              <div className="account-balance">
                {balanceSummary}
              </div>
              <span className="account-meta">
                  {currencyLabel} · {accounts.length} account{accounts.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="account-available">
              <span>Accounts found</span>
              <strong>{accounts.length}</strong>
              <span className="available-tag">Backend records</span>
            </div>
            <div className="account-graphic">
              <div className="graphic-ring ring-a" />
              <div className="graphic-ring ring-b" />
              <div className="graphic-symbol">F</div>
            </div>
          </div>

          <div className="metric-grid metric-grid-three">
            <MetricCard
              label="Total income"
              value={formatSummaryTotals(summary, "income")}
              detail="Totals shown separately by currency"
              icon={<ArrowDownLeft size={18} />}
              tone="green"
            />
            <MetricCard
              label="Total expenses"
              value={formatSummaryTotals(summary, "expense")}
              detail="Totals shown separately by currency"
              icon={<ArrowUpRight size={18} />}
              tone="amber"
            />
            <MetricCard
              label="Net cash flow"
              value={formatSummaryNetCashFlow(summary)}
              detail="Income less expenses and fees"
              icon={<Wallet size={18} />}
              tone="blue"
            />
          </div>

          <Panel
            title="Financial totals by currency"
            subtitle="Backend totals remain grouped by currency"
            className="table-panel"
          >
            {summary && Object.keys(summary.summary).length > 0 ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>CURRENCY</th>
                      <th>INCOME</th>
                      <th>EXPENSES</th>
                      <th>FEES</th>
                      <th>NET CASH FLOW</th>
                      <th>TRANSACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summary.summary).map(([currency, totals]) => {
                      const income = Number(totals.income.total);
                      const expenses = Number(totals.expense.total);
                      const fees = Number(totals.fee.total);
                      const netCashFlow =
                        Number.isFinite(income) &&
                        Number.isFinite(expenses) &&
                        Number.isFinite(fees)
                          ? income - expenses - fees
                          : null;
                      const transactionCount =
                        totals.income.count + totals.expense.count + totals.fee.count;

                      return (
                        <tr key={currency}>
                          <td><strong>{currency}</strong></td>
                          <td className="table-amount">{formatCurrency(totals.income.total, currency)}</td>
                          <td className="table-amount">{formatCurrency(totals.expense.total, currency)}</td>
                          <td className="table-amount">{formatCurrency(totals.fee.total, currency)}</td>
                          <td className="table-amount">
                            {netCashFlow === null
                              ? "Unavailable"
                              : formatCurrency(netCashFlow, currency)}
                          </td>
                          <td>{transactionCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">No financial totals were returned.</div>
            )}
          </Panel>

          <Panel
            title="Your accounts"
            subtitle="Account records returned by the backend"
            className="table-panel"
          >
            {accounts.length === 0 ? (
              <div className="empty-state">
                No accounts were returned for this user yet. Add or connect an
                account to see its balance here.
              </div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>ACCOUNT</th>
                      <th>TYPE</th>
                      <th>CURRENCY</th>
                      <th>BALANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id}>
                        <td><strong>{account.account_name}</strong></td>
                        <td>{account.account_type}</td>
                        <td>{account.currency}</td>
                        <td className="table-amount">
                          <Currency value={Number(account.balance)} currency={account.currency} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

        </>
      )}
    </>
  );
}
