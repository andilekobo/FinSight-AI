import { ArrowDownToLine, ArrowRight, Check, CreditCard, FileText, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { MetricCard, PageHeading, Panel, StatusBadge, Currency } from "../components/ui/Primitives";
import { getBilling } from "../data/mockApi";

export function BillingPage() {
  const bill = getBilling();
  return (
    <>
      <PageHeading eyebrow="PLANS & PAYMENTS" title="Billing" description="Understand your plan, track spend, and manage invoices." action={<button className="button button-secondary"><CreditCard size={15} /> Manage payment method</button>} />
      <div className="metric-grid metric-grid-three">
        <MetricCard label="Current bill" value={<Currency value={bill.currentBill} />} detail="As of October 6" icon={<FileText size={18} />} tone="green" />
        <MetricCard label="Projected bill" value={<Currency value={bill.projectedBill} />} change="18.2%" detail="vs. last month" icon={<Zap size={18} />} tone="violet" />
        <MetricCard label="Current plan" value={bill.plan} detail="Billed monthly" icon={<CreditCard size={18} />} tone="blue" />
      </div>
      <div className="two-column-grid billing-grid">
        <Panel title="Current billing period" subtitle={`${bill.periodStart} — ${bill.periodEnd}`} className="bill-summary">
          <div className="bill-total"><span>Amount due so far</span><strong><Currency value={bill.currentBill} /></strong><span className="bill-cycle">Billing closes in 25 days</span></div>
          <div className="bill-progress"><div style={{ width: "20%" }} /></div>
          <div className="bill-progress-label"><span>Day 6 of 31</span><span>Projected <Currency value={bill.projectedBill} /></span></div>
          <div className="bill-line-items">
            <div><span><i className="line-icon line-api"><Zap size={14} /></i>API requests <small>18,432 requests</small></span><strong><Currency value={bill.apiCost} /></strong></div>
            <div><span><i className="line-icon line-tokens"><FileText size={14} /></i>Token usage <small>41.2M tokens</small></span><strong><Currency value={bill.tokenCost} /></strong></div>
            <div><span><i className="line-icon line-platform"><CreditCard size={14} /></i>Platform fee <small>Scale plan</small></span><strong><Currency value={bill.platformFee} /></strong></div>
          </div>
          <div className="bill-line-total"><span>Total to date</span><strong><Currency value={bill.currentBill} /></strong></div>
        </Panel>
        <div className="billing-side">
          <div className="plan-card">
            <div className="plan-card-top"><div><span className="plan-label">YOUR CURRENT PLAN</span><h3>{bill.plan}<span> / month</span></h3></div><div className="plan-icon"><Zap size={18} /></div></div>
            <p>Built for growing teams with high-volume AI workloads.</p>
            <div className="plan-features"><span><Check size={14} /> 100M tokens / month</span><span><Check size={14} /> 100k API requests</span><span><Check size={14} /> Priority support</span></div>
            <button className="button button-light">Manage plan <ArrowRight size={14} /></button>
          </div>
          <div className="billing-period-card"><div className="period-icon"><CreditCard size={17} /></div><div><span>Next billing date</span><strong>November 1, 2026</strong></div><StatusBadge status="Active" /></div>
          <div className="billing-help">Need a hand with your bill? <Link to="/ai-assistant">Ask FinSight AI <ArrowRight size={13} /></Link></div>
        </div>
      </div>
      <Panel title="Billing history" subtitle="Your past invoices and payments" className="table-panel" action={<button className="text-action">View all <ArrowRight size={13} /></button>}>
        <div className="table-scroll"><table><thead><tr><th>INVOICE</th><th>BILLING PERIOD</th><th>ISSUED</th><th>AMOUNT</th><th>STATUS</th><th /></tr></thead><tbody>
          {bill.invoices.map((invoice) => <tr key={invoice.id}><td><span className="invoice-id">{invoice.id}</span></td><td>{invoice.period}</td><td>{invoice.date}</td><td className="table-amount">${invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td><td><StatusBadge status={invoice.status} /></td><td><button className="row-action" aria-label={`Download ${invoice.id}`}><ArrowDownToLine size={15} /></button></td></tr>)}
        </tbody></table></div>
        <div className="table-footer">Showing <strong>{bill.invoices.length}</strong> recent invoices <span>View billing history <ArrowRight size={12} /></span></div>
      </Panel>
    </>
  );
}
