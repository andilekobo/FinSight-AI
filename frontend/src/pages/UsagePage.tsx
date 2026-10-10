import { useMemo, useState } from "react";
import { Activity, ArrowDownToLine, Coins, Gauge, Zap } from "lucide-react";
import { UsageAreaChart } from "../components/charts/Charts";
import { MetricCard, PageHeading, Panel, StatusBadge } from "../components/ui/Primitives";
import { getUsage, getUsageTrend } from "../data/mockApi";

export function UsagePage() {
  const [range, setRange] = useState("30 days");
  const [status, setStatus] = useState("All");
  const rows = useMemo(() => getUsage().filter((row) => status === "All" || row.status === status), [status]);
  const usage = getUsage()[0];

  return (
    <>
      <PageHeading eyebrow="METERING & ANALYTICS" title="Usage" description="Monitor your API activity and token consumption." action={<button className="button button-secondary"><ArrowDownToLine size={15} /> Export CSV</button>} />
      <div className="metric-grid metric-grid-three">
        <MetricCard label="API requests" value={usage.apiRequests.toLocaleString()} change="8.4%" detail="vs. previous period" icon={<Activity size={18} />} tone="green" />
        <MetricCard label="Total tokens" value={`${(usage.totalTokens / 1_000_000).toFixed(1)}M`} change="12.6%" detail="this billing period" icon={<Coins size={18} />} tone="blue" />
        <MetricCard label="Quota utilization" value={`${Math.round((usage.totalTokens / usage.quota) * 100)}%`} detail={`${(usage.quota / 1_000_000).toFixed(0)}M monthly limit`} icon={<Gauge size={18} />} tone="amber" direction="down" />
      </div>
      <div className="two-column-grid usage-charts-grid">
        <Panel title="Usage over time" subtitle="Estimated cost by month" action={<select className="select-compact" value={range} onChange={(event) => setRange(event.target.value)}><option>30 days</option><option>90 days</option><option>6 months</option></select>}>
          <UsageAreaChart data={getUsageTrend()} />
        </Panel>
        <Panel title="Token breakdown" subtitle="Volume in the current billing period">
          <div className="token-total"><strong>{(usage.totalTokens / 1_000_000).toFixed(1)}M</strong><span>total tokens</span></div>
          <div className="token-breakdown-bar"><span style={{ width: `${usage.inputTokens / usage.totalTokens * 100}%` }} /><span style={{ width: `${usage.outputTokens / usage.totalTokens * 100}%` }} /></div>
          <div className="token-legend"><div><i className="legend-dot legend-green" /><span>Input tokens</span><strong>{(usage.inputTokens / 1_000_000).toFixed(1)}M</strong></div><div><i className="legend-dot legend-blue" /><span>Output tokens</span><strong>{(usage.outputTokens / 1_000_000).toFixed(1)}M</strong></div></div>
          <div className="quota-note"><Zap size={15} /><span>Your monthly quota resets on November 1, 2026.</span></div>
        </Panel>
      </div>
      <Panel title="Usage history" subtitle="A detailed log of your API activity" className="table-panel" action={<label className="filter-select">Status <select value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option><option>Success</option><option>Rate limited</option><option>Failed</option></select></label>}>
        <div className="table-scroll"><table><thead><tr><th>DATE & TIME</th><th>ENDPOINT</th><th>API REQUESTS</th><th>INPUT TOKENS</th><th>OUTPUT TOKENS</th><th>EST. COST</th><th>STATUS</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.date}><td>{row.date}</td><td><code className="endpoint-code">{row.endpoint}</code></td><td>{row.apiRequests.toLocaleString()}</td><td>{row.inputTokens.toLocaleString()}</td><td>{row.outputTokens.toLocaleString()}</td><td className="table-amount">${row.cost.toFixed(2)}</td><td><StatusBadge status={row.status} /></td></tr>)}</tbody>
        </table></div>
        {rows.length === 0 && <div className="empty-state">No usage records match this filter.</div>}
        <div className="table-footer">Showing <strong>{rows.length}</strong> of 248 records <span>Page 1 of 25</span></div>
      </Panel>
    </>
  );
}
