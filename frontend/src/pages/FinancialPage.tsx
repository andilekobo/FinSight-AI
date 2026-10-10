import { ArrowDownLeft, ArrowUpRight, Building2, RefreshCw, Wallet } from "lucide-react";
import { CashFlowChart } from "../components/charts/Charts";
import { Currency, MetricCard, PageHeading, Panel } from "../components/ui/Primitives";
import { getFinancialSummary, getTransactions } from "../data/mockApi";

export function FinancialPage() {
  const { account, cashFlow } = getFinancialSummary();
  const technologySpend = getTransactions().filter((transaction) => transaction.category === "Technology" || transaction.category === "Cloud services").reduce((total, transaction) => total + transaction.amount, 0);
  return (
    <>
      <PageHeading eyebrow="INVESTEC · MOCK OVERVIEW" title="Financial" description="A clear view of your cash position and business flow." action={<button className="button button-secondary"><RefreshCw size={14} /> Synced {account.lastSynced}</button>} />
      <div className="connection-banner"><div className="connection-symbol"><Building2 size={18} /></div><div><strong>Investec account preview</strong><p>Showing sample account data. Connect Investec to securely see your real finances.</p></div><span className="connection-status"><i className="status-dot" /> Mock data</span></div>
      <div className="account-hero">
        <div><span className="account-eyebrow"><Wallet size={14} /> {account.name}</span><div className="account-balance"><Currency value={account.balance} /></div><span className="account-meta">{account.currency} · Account {account.accountNumber}</span></div>
        <div className="account-available"><span>Available balance</span><strong><Currency value={account.availableBalance} /></strong><span className="available-tag">Available to use</span></div>
        <div className="account-graphic"><div className="graphic-ring ring-a" /><div className="graphic-ring ring-b" /><div className="graphic-symbol">N</div></div>
      </div>
      <div className="metric-grid metric-grid-three">
        <MetricCard label="Monthly income" value={<Currency value={account.income} />} change="8.2%" detail="vs. September" icon={<ArrowDownLeft size={18} />} tone="green" />
        <MetricCard label="Monthly expenses" value={<Currency value={account.expenses} />} change="3.1%" detail="vs. September" icon={<ArrowUpRight size={18} />} tone="amber" direction="down" />
        <MetricCard label="Net cash flow" value={<Currency value={account.netCashFlow} />} change="14.6%" detail="healthy cash position" icon={<Wallet size={18} />} tone="blue" />
      </div>
      <div className="two-column-grid financial-grid">
        <Panel title="Cash flow" subtitle="Income vs. expenses · Last 6 months" className="financial-chart-panel" action={<button className="text-action">Last 6 months <span>⌄</span></button>}>
          <div className="mini-legend"><span><i className="legend-dot legend-green" /> Income</span><span><i className="legend-dot legend-pale" /> Expenses</span></div>
          <CashFlowChart data={cashFlow} />
        </Panel>
        <Panel title="Technology spending" subtitle="Software, cloud & AI services" className="tech-spend-panel">
          <div className="tech-spend-total"><strong><Currency value={technologySpend} /></strong><span>this month</span></div>
          <div className="spend-category"><div className="spend-category-top"><span>Cloud services</span><strong>$4,343.20</strong></div><div className="spend-track"><i style={{ width: "62%" }} /></div><small>62% of technology spend</small></div>
          <div className="spend-category"><div className="spend-category-top"><span>AI & API usage</span><strong>$1,248.64</strong></div><div className="spend-track spend-track-blue"><i style={{ width: "24%" }} /></div><small>24% of technology spend</small></div>
          <div className="spend-category"><div className="spend-category-top"><span>Software tools</span><strong>$1,170.00</strong></div><div className="spend-track spend-track-violet"><i style={{ width: "17%" }} /></div><small>17% of technology spend</small></div>
          <div className="tech-note"><span className="note-emoji">✦</span><span>Technology spending is <strong>21% of total expenses</strong> this month.</span></div>
        </Panel>
      </div>
    </>
  );
}
