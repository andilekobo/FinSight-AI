import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CreditCard, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { getAccounts, getFinancialSummary, getTransactions } from "../data/api";
import type { Account, FinancialSummary, Transaction } from "../data/api";
import { PageHeading, Panel } from "../components/ui/Primitives";

function getUserIdFromToken(): string | null {
  const token = localStorage.getItem("finsight_access_token");
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(base64)) as { sub?: unknown };

    return typeof decoded.sub === "string" ? decoded.sub : null;
  } catch {
    return null;
  }
}

function money(value: number | string, currency = "ZAR"): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
  }).format(Number(value) || 0);
}

function dateLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const userId = getUserIdFromToken();

      if (!userId) {
        if (active) {
          setError("Your session could not be identified. Please log in again.");
          setLoading(false);
        }
        return;
      }

      try {
        const [accountData, summaryData, transactionData] = await Promise.all([
          getAccounts(userId),
          getFinancialSummary(userId),
          getTransactions(userId),
        ]);

        if (active) {
          setAccounts(accountData);
          setSummary(summaryData);
          setTransactions(transactionData);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load dashboard data."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const totalBalance = accounts.reduce(
    (total, account) => total + Number(account.balance || 0),
    0
  );

  return (
    <>
      <PageHeading
        eyebrow={new Date().toLocaleDateString("en-ZA", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).toUpperCase()}
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

      {loading && <p role="status">Loading your financial data…</p>}

      {!loading && error && (
        <Panel title="Unable to load dashboard" subtitle="Check your session and API connection.">
          <p role="alert">{error}</p>
          <button className="button button-secondary" onClick={() => window.location.reload()}>
            Try again
          </button>
        </Panel>
      )}

      {!loading && !error && (
        <>
          <div className="metric-grid">
            <div className="metric-card">
              <span>Total account balances</span>
              <strong>{money(totalBalance)}</strong>
              <small>{accounts.length} account(s) recorded</small>
            </div>
            <div className="metric-card">
              <span>Total income</span>
              <strong>{money(summary?.total_income ?? 0)}</strong>
              <small>Recorded transactions</small>
            </div>
            <div className="metric-card">
              <span>Total expenses</span>
              <strong>{money(summary?.total_expenses ?? 0)}</strong>
              <small>Recorded transactions</small>
            </div>
            <div className="metric-card">
              <span>Net cash flow</span>
              <strong>{money(summary?.net_cash_flow ?? 0)}</strong>
              <small>{summary?.transaction_count ?? 0} transaction(s) recorded</small>
            </div>
          </div>

          <div className="dashboard-grid">
            <Panel
              title="Financial overview"
              subtitle="Balances from your database accounts"
              className="cashflow-panel"
            >
              {accounts.length === 0 ? (
                <p>No accounts recorded yet. Add an account to begin tracking your finances.</p>
              ) : (
                <div className="transaction-list">
                  {accounts.map((account) => (
                    <div className="transaction-row" key={account.id}>
                      <div className="transaction-icon"><CreditCard size={16} /></div>
                      <div className="transaction-description">
                        <strong>{account.account_name}</strong>
                        <span>{account.account_type} · {account.currency}</span>
                      </div>
                      <strong>{money(account.balance, account.currency)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              title="Recent transactions"
              subtitle="Latest transactions stored in your database"
              className="transactions-panel"
              action={<Link className="text-action" to="/transactions">View all <ArrowRight size={13} /></Link>}
            >
              {transactions.length === 0 ? (
                <p>No transactions recorded yet. Your recent activity will appear here.</p>
              ) : (
                <div className="transaction-list compact-list">
                  {transactions.map((transaction) => {
                    const income = transaction.transaction_type === "income";

                    return (
                      <div className="transaction-row" key={transaction.id}>
                        <div className={`transaction-icon ${income ? "transaction-income" : ""}`}>
                          {income ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div className="transaction-description">
                          <strong>{transaction.description}</strong>
                          <span>{dateLabel(transaction.transaction_date)} · {transaction.category}</span>
                        </div>
                        <div className={`transaction-amount ${income ? "amount-income" : ""}`}>
                          {income ? "+" : "−"}
                          {money(transaction.amount, transaction.currency)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>

            <Panel
              title="AI insights"
              subtitle="Insights will appear when generated and saved by the backend"
              className="insight-panel"
            >
              <p>No saved insights to display yet.</p>
              <Link className="panel-link" to="/ai-insights">
                Explore AI insights <ArrowRight size={14} />
              </Link>
            </Panel>

            <Panel
              title="Usage and billing"
              subtitle="API usage and billing records"
              className="breakdown-panel"
            >
              <p>Usage and billing figures are not displayed until actual records are available.</p>
              <Link className="panel-link" to="/usage">
                View usage <ArrowRight size={14} />
              </Link>
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
