import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowDownToLine, ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { MetricCard, PageHeading, Panel, StatusBadge, Currency } from "../components/ui/Primitives";
import { getTransactions } from "../data/mockApi";

export function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"All" | "Income" | "Expense">("All");
  const [category, setCategory] = useState("All");
  const transactions = useMemo(() => getTransactions({ search, type, category }), [search, type, category]);
  return (
    <>
      <PageHeading eyebrow="ACCOUNT ACTIVITY" title="Transactions" description="Search and review your business account activity." action={<button className="button button-secondary"><ArrowDownToLine size={15} /> Export transactions</button>} />
      <div className="metric-grid metric-grid-three">
        <MetricCard label="Total income" value="$48,320.00" change="8.2%" detail="this month" icon={<ArrowDownLeft size={18} />} tone="green" />
        <MetricCard label="Total expenses" value="$32,184.50" change="3.1%" detail="this month" icon={<ArrowUpRight size={18} />} tone="amber" direction="down" />
        <MetricCard label="Transactions" value="124" detail="in October" icon={<SlidersHorizontal size={18} />} tone="blue" />
      </div>
      <Panel title="All transactions" subtitle={`${transactions.length} transactions found`} className="table-panel transactions-table-panel">
        <div className="transaction-filters">
          <label className="table-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions..." /></label>
          <div className="filter-group"><span>Type</span><select value={type} onChange={(event) => setType(event.target.value as typeof type)}><option>All</option><option>Income</option><option>Expense</option></select></div>
          <div className="filter-group category-filter"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="All">All categories</option><option>Cloud services</option><option>Technology</option><option>Client revenue</option><option>Payroll</option><option>Software</option><option>Travel</option></select></div>
          <button className="filter-button"><SlidersHorizontal size={15} /> More filters</button>
        </div>
        <div className="table-scroll"><table><thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th>TYPE</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>
          {transactions.map((transaction) => <tr key={transaction.id}>
            <td><div className="transaction-cell"><span className={`transaction-icon ${transaction.type === "Income" ? "transaction-income" : ""}`}>{transaction.type === "Income" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><span><strong>{transaction.description}</strong><small>{transaction.id}</small></span></div></td>
            <td><span className="category-chip">{transaction.category}</span></td><td>{transaction.date}</td><td><span className={`type-label ${transaction.type === "Income" ? "type-income" : ""}`}>{transaction.type}</span></td>
            <td className={`table-amount ${transaction.type === "Income" ? "amount-income" : ""}`}>{transaction.type === "Income" ? "+" : "−"}<Currency value={transaction.amount} /></td><td><StatusBadge status={transaction.status} /></td>
          </tr>)}
        </tbody></table></div>
        {transactions.length === 0 && <div className="empty-state">No transactions found. Try another search or filter.</div>}
        <div className="table-footer">Showing <strong>{transactions.length}</strong> transactions <span>Page 1 of 12</span></div>
      </Panel>
    </>
  );
}
