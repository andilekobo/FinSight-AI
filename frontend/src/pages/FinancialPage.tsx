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
} from "../data/api";

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

  const formatAmount = (value: number | string | undefined) => {
    if (value === undefined || (typeof value === "string" && !value.trim())) {
      return "Unavailable";
    }
    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? new Intl.NumberFormat("en-ZA").format(parsed)
      : "Unavailable";
  };
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
              value={summary ? formatAmount(summary.total_income) : "Unavailable"}
              detail="Currency not supplied by summary"
              icon={<ArrowDownLeft size={18} />}
              tone="green"
            />
            <MetricCard
              label="Total expenses"
              value={summary ? formatAmount(summary.total_expenses) : "Unavailable"}
              detail="Currency not supplied by summary"
              icon={<ArrowUpRight size={18} />}
              tone="amber"
            />
            <MetricCard
              label="Net cash flow"
              value={summary ? formatAmount(summary.net_cash_flow) : "Unavailable"}
              detail={`Currency not supplied · ${summary?.transaction_count ?? 0} transactions counted`}
              icon={<Wallet size={18} />}
              tone="blue"
            />
          </div>

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

          <Panel
            title="Cash flow reporting"
            subtitle="Based on transactions available to the API"
          >
            <p>
              {summary?.period?.start_date && summary?.period?.end_date
                ? `Reporting period: ${summary.period.start_date} to ${summary.period.end_date}.`
                : "The backend has not supplied a reporting date range."}
            </p>
            {(summary?.transaction_count ?? 0) === 0 && (
              <div className="empty-state">
                No transactions are included in this summary yet. No sample
                financial records have been added.
              </div>
            )}
          </Panel>
        </>
      )}
    </>
  );
}
