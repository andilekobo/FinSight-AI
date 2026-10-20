import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { MetricCard, PageHeading, Panel } from "../components/ui/Primitives";
import {
  getCurrentUserId,
  getTransactions,
  type Transaction,
} from "../data/api";
import { formatCurrency } from "../utils/currency";

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"All" | "income" | "expense" | "fee">("All");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    let active = true;

    async function loadTransactions() {
      setLoading(true);
      setError(null);
      setTransactions([]);

      const userId = getCurrentUserId();
      if (!userId) {
        setError("Please sign in again to view your transactions.");
        setLoading(false);
        return;
      }

      try {
        const result = await getTransactions(userId, 500);
        if (!Array.isArray(result)) {
          throw new Error("The API returned an unexpected transactions response.");
        }
        if (active) setTransactions(result);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load transactions.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTransactions();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const categories = useMemo(
    () =>
      [...new Set(transactions.map((transaction) => transaction.category).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right)),
    [transactions],
  );

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const searchable = [
        transaction.id,
        transaction.description,
        transaction.category,
        transaction.account_id,
        transaction.transaction_date,
        transaction.transaction_type,
        transaction.currency,
      ].join(" ").toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesType = type === "All" || transaction.transaction_type === type;
      const matchesCategory = category === "All" || transaction.category === category;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, search, type, category]);

  const counts = useMemo(
    () => ({
      income: transactions.filter((transaction) => transaction.transaction_type === "income").length,
      expenses: transactions.filter((transaction) => transaction.transaction_type === "expense").length,
      fees: transactions.filter((transaction) => transaction.transaction_type === "fee").length,
    }),
    [transactions],
  );

  const formatDate = (value: string | undefined) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const formatAmount = (value: number | string | undefined, currency: string | undefined) => {
    if (value === undefined || (typeof value === "string" && !value.trim())) return "—";
    const amount = Number(value);
    if (!Number.isFinite(amount) || !currency || !/^[A-Z]{3}$/.test(currency)) return "—";
    const formatted = formatCurrency(amount, currency);
    return formatted.startsWith("Unavailable") ? "—" : formatted;
  };

  const metricValue = (value: number) =>
    loading || error ? "—" : value.toLocaleString("en-US");

  return (
    <>
      <PageHeading
        eyebrow="ACCOUNT ACTIVITY"
        title="Transactions"
        description="Search and review your business account activity."
        action={
          <button
            className="button button-secondary"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
          >
            <RefreshCw size={14} />
            {loading ? "Loading…" : "Refresh transactions"}
          </button>
        }
      />
      <div className="metric-grid metric-grid-three">
        <MetricCard label="Income transactions" value={metricValue(counts.income)} detail="records returned" icon={<ArrowDownLeft size={18} />} tone="green" />
        <MetricCard label="Expense transactions" value={metricValue(counts.expenses)} detail="records returned" icon={<ArrowUpRight size={18} />} tone="amber" />
        <MetricCard label="Fee transactions" value={metricValue(counts.fees)} detail="records returned" icon={<SlidersHorizontal size={18} />} tone="blue" />
      </div>
      <Panel
        title="All transactions"
        subtitle={
          loading
            ? "Loading transactions…"
            : error
              ? "Transactions unavailable"
              : `${filteredTransactions.length} matching · ${transactions.length} returned (up to 500)`
        }
        className="table-panel transactions-table-panel"
      >
        <div className="transaction-filters">
          <label className="table-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions..." /></label>
          <div className="filter-group"><span>Type</span><select value={type} onChange={(event) => setType(event.target.value as typeof type)}><option value="All">All</option><option value="income">Income</option><option value="expense">Expense</option><option value="fee">Fee</option></select></div>
          <div className="filter-group category-filter"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="All">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
        </div>
        {loading && <div className="empty-state" role="status"><span className="transaction-loading-indicator" />Loading transactions…</div>}
        {!loading && error && (
          <div className="empty-state" role="alert">
            <p>{error}</p>
            <button
              className="button button-secondary"
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}
        {!loading && !error && transactions.length === 0 && (
          <div className="empty-state">No transactions have been returned for this account yet.</div>
        )}
        {!loading && !error && transactions.length > 0 && filteredTransactions.length === 0 && (
          <div className="empty-state">No transactions match this search or filter.</div>
        )}
        {!loading && !error && filteredTransactions.length > 0 && (
          <div className="table-scroll"><table><thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th>TYPE</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>
            {filteredTransactions.map((transaction) => {
              const income = transaction.transaction_type === "income";
              const transactionType = transaction.transaction_type
                ? transaction.transaction_type[0].toUpperCase() + transaction.transaction_type.slice(1)
                : "—";
              const amount = formatAmount(transaction.amount, transaction.currency);
              return (
                <tr key={transaction.id}>
                  <td><div className="transaction-cell"><span className={`transaction-icon ${income ? "transaction-income" : ""}`}>{income ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><span><strong>{transaction.description || "—"}</strong><small>{transaction.id || "—"} · Account {transaction.account_id || "—"}</small></span></div></td>
                  <td><span className="category-chip">{transaction.category || "—"}</span></td>
                  <td>{formatDate(transaction.transaction_date)}</td>
                  <td><span className={`type-label ${income ? "type-income" : ""}`}>{transactionType}</span></td>
                  <td className={`table-amount ${income ? "amount-income" : ""}`}>{amount === "—" ? amount : `${income ? "+" : "−"}${amount}`}</td>
                  <td>—</td>
                </tr>
              );
            })}
          </tbody></table></div>
        )}
        {!loading && !error && transactions.length > 0 && (
          <div className="table-footer">
            Showing <strong>{filteredTransactions.length}</strong> matching of {transactions.length} returned
            <span>Latest 500 maximum · no server pagination</span>
          </div>
        )}
      </Panel>
    </>
  );
}
