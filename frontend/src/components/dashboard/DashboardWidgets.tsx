import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CircleDollarSign,
  Coins,
  Cpu,
  CreditCard,
  Gauge,
  MoreHorizontal,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { DashboardSummary } from "../../types";
import { Currency, MetricCard, Panel } from "../ui/Primitives";
import { CashFlowChart, UsageAreaChart } from "../charts/Charts";

export function DashboardWidgets({ summary }: { summary: DashboardSummary }) {
  const quotaPercent = Math.round((summary.usage.totalTokens / summary.usage.quota) * 100);
  const recentInsight = {
    title: "Your October usage bill is trending 18% above last month",
    body: "Output tokens are the biggest driver. Prompt caching could save an estimated $186/month.",
  };

  return (
    <>
      <div className="welcome-banner">
        <div className="welcome-copy">
          <div className="welcome-eyebrow"><span className="live-pulse" /> FINANCIAL PULSE <span>·</span> OCTOBER 6, 2026</div>
          <h2>Good morning, Jordan <span>✦</span></h2>
          <p>Here’s what’s happening across your finances and AI usage today.</p>
        </div>
        <div className="banner-orbit orbit-one" /><div className="banner-orbit orbit-two" /><div className="banner-orbit orbit-three" />
        <div className="banner-sparkle"><Zap size={16} fill="currentColor" /></div>
      </div>

      <div className="metric-grid">
        <MetricCard label="Current billing" value={<Currency value={summary.billing.currentBill} />} change="12.8%" detail="vs. last month" icon={<CircleDollarSign size={18} />} tone="green" />
        <MetricCard label="Projected monthly cost" value={<Currency value={summary.billing.projectedBill} />} change="18.2%" detail="vs. last month" icon={<ArrowUpRight size={18} />} tone="violet" />
        <MetricCard label="Account balance" value={<Currency value={summary.account.balance} />} detail="Investec · •••• 4821" icon={<WalletIcon />} tone="blue" />
        <MetricCard label="Quota used" value={`${quotaPercent}%`} change={`${(summary.usage.totalTokens / 1_000_000).toFixed(1)}M tokens`} detail={`of ${(summary.usage.quota / 1_000_000).toFixed(0)}M monthly`} icon={<Gauge size={18} />} tone="amber" direction="down" />
      </div>

      <div className="dashboard-grid">
        <Panel title="Usage & cost" subtitle="Your monthly spend against the current billing period" className="usage-panel" action={<button className="text-action">This year <span>⌄</span></button>}>
          <div className="chart-legend"><span><i className="legend-dot legend-green" /> Actual cost</span><span><i className="legend-dash" /> Projected</span></div>
          <UsageAreaChart data={summary.usageTrend} />
          <div className="chart-footnote"><span className="footnote-dot" /> Usage data updates in real-time</div>
        </Panel>

        <Panel title="Quota overview" subtitle="Monthly token consumption" className="quota-panel">
          <div className="quota-total">{(summary.usage.totalTokens / 1_000_000).toFixed(1)}<span>M</span><small> tokens used</small></div>
          <div className="quota-progress"><div style={{ width: `${quotaPercent}%` }} /></div>
          <div className="quota-scale"><span>0</span><span>{(summary.usage.quota / 1_000_000).toFixed(0)}M tokens</span></div>
          <div className="quota-stats">
            <div><span><i className="legend-dot legend-green" /> Input tokens</span><strong>{(summary.usage.inputTokens / 1_000_000).toFixed(1)}M</strong></div>
            <div><span><i className="legend-dot legend-blue" /> Output tokens</span><strong>{(summary.usage.outputTokens / 1_000_000).toFixed(1)}M</strong></div>
          </div>
          <Link className="panel-link" to="/usage">View usage details <ArrowRight size={14} /></Link>
        </Panel>

        <Panel title="Financial overview" subtitle="Investec · Business Current Account" className="cashflow-panel" action={<span className="account-tag"><i className="status-dot" /> Mock data</span>}>
          <div className="financial-totals">
            <div><span>Available balance</span><strong><Currency value={summary.account.availableBalance} /></strong></div>
            <div className="net-cash"><span>Net cash flow</span><strong><ArrowUpRight size={16} /> <Currency value={summary.account.netCashFlow} /></strong></div>
          </div>
          <div className="mini-legend"><span><i className="legend-dot legend-green" /> Income</span><span><i className="legend-dot legend-pale" /> Expenses</span></div>
          <CashFlowChart data={summary.cashFlow} />
        </Panel>

        <Panel title="AI insights" subtitle="Personalized intelligence for your workspace" className="insight-panel" action={<span className="ai-label"><SparkleIcon /> AI POWERED</span>}>
          <div className="insight-callout"><div className="insight-icon"><Bot size={17} /></div><div><strong>{recentInsight.title}</strong><p>{recentInsight.body}</p></div></div>
          <div className="insight-quick"><span><span className="insight-mini-icon"><Cpu size={14} /></span> Output tokens drive 68% of your bill</span><span className="insight-savings">+$186/mo saved</span></div>
          <Link className="panel-link" to="/ai-insights">Explore all insights <ArrowRight size={14} /></Link>
        </Panel>

        <Panel title="Recent transactions" subtitle="Latest activity across your account" className="transactions-panel" action={<Link className="text-action" to="/transactions">View all <ArrowRight size={13} /></Link>}>
          <div className="transaction-list compact-list">
            {summary.recentTransactions.slice(0, 4).map((transaction) => (
              <div className="transaction-row" key={transaction.id}>
                <div className={`transaction-icon ${transaction.type === "Income" ? "transaction-income" : ""}`}>{transaction.type === "Income" ? <ArrowDownLeft size={16} /> : <CreditCard size={15} />}</div>
                <div className="transaction-description"><strong>{transaction.description}</strong><span>{transaction.date} · {transaction.category}</span></div>
                <div className={`transaction-amount ${transaction.type === "Income" ? "amount-income" : ""}`}>{transaction.type === "Income" ? "+" : "−"}<Currency value={transaction.amount} /></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Usage breakdown" subtitle="This billing period by service" className="breakdown-panel">
          <div className="breakdown-row"><span className="breakdown-icon breakdown-api"><Zap size={16} /></span><span className="breakdown-label">API requests</span><strong>{summary.usage.apiRequests.toLocaleString()}</strong><small><Currency value={summary.billing.apiCost} /></small></div>
          <div className="breakdown-row"><span className="breakdown-icon breakdown-token"><Coins size={16} /></span><span className="breakdown-label">Token usage</span><strong>{(summary.usage.totalTokens / 1_000_000).toFixed(1)}M</strong><small><Currency value={summary.billing.tokenCost} /></small></div>
          <div className="breakdown-row"><span className="breakdown-icon breakdown-platform"><CircleDollarSign size={16} /></span><span className="breakdown-label">Platform fee</span><strong>Monthly</strong><small><Currency value={summary.billing.platformFee} /></small></div>
          <div className="breakdown-total"><span>Total this month</span><strong><Currency value={summary.billing.currentBill} /></strong></div>
          <Link className="panel-link" to="/billing">Go to billing <ArrowRight size={14} /></Link>
        </Panel>
      </div>
    </>
  );
}

function WalletIcon() {
  return <CreditCard size={18} />;
}

function SparkleIcon() {
  return <MoreHorizontal size={14} />;
}
