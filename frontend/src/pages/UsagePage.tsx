import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CircleDollarSign,
  Coins,
  RefreshCw,
  Zap,
} from "lucide-react";
import { getUsage, type UsageResponse } from "../data/api";
import { MetricCard, PageHeading, Panel, StatusBadge } from "../components/ui/Primitives";
import { formatZarCents } from "../utils/currency";

const number = (value: number) => new Intl.NumberFormat("en-ZA").format(value);
const date = (value: string) => new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "short",
  year: "numeric",
}).format(new Date(value));

function usagePercent(used: number, limit: number): number | null {
  return limit > 0 ? Math.min(100, (used / limit) * 100) : null;
}

function remainingCapacity(used: number, limit: number): string {
  return limit > 0 ? `${number(Math.max(0, limit - used))} remaining` : "Limit unavailable";
}

function QuotaMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const percent = usagePercent(used, limit);
  const remaining = Math.max(0, limit - used);

  return (
    <div className="usage-quota">
      <div className="usage-quota-heading">
        <span>{label}</span>
        <strong>{percent === null ? "Limit unavailable" : `${percent.toFixed(1)}% used`}</strong>
      </div>
      <progress
        className="usage-progress"
        value={percent ?? 0}
        max={100}
        aria-label={`${label}: ${number(used)} of ${number(limit)} used`}
      />
      <div className="usage-quota-scale">
        <span>{number(used)} used</span>
        <span>{number(limit)} limit</span>
      </div>
      {percent !== null && (
        <p className="usage-remaining">{number(remaining)} remaining this period</p>
      )}
    </div>
  );
}

export function UsagePage() {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getUsage());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load usage.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const usage = data?.usage;
  const tokens = usage?.tokens;
  const cost = data?.cost;

  return (
    <>
      <PageHeading
        eyebrow="METERING & ANALYTICS"
        title="Usage"
        description="Understand your recorded activity, quota consumption and charges for this billing period."
      />

      {loading && (
        <div className="data-state usage-state" role="status">
          <span className="data-state-spinner" aria-hidden="true" />
          <div><strong>Loading usage</strong><p>Retrieving your latest metering details.</p></div>
        </div>
      )}
      {error && (
        <div className="data-state data-state-error usage-state" role="alert">
          <div>
            <strong>Usage could not be loaded</strong>
            <p>{error}</p>
          </div>
          <button className="button button-secondary" type="button" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      )}

      {!loading && !error && data && usage && tokens && cost && (
        <div className="usage-page-content">
          <div className="metric-grid usage-metrics">
            <MetricCard
              label="API calls"
              value={number(usage.api_calls)}
              detail={remainingCapacity(usage.api_calls, usage.api_call_limit)}
              icon={<Activity size={17} />}
              tone="green"
            />
            <MetricCard
              label="Billable tokens"
              value={number(tokens.total_billable_tokens)}
              detail={remainingCapacity(tokens.total_billable_tokens, usage.token_limit)}
              icon={<Zap size={17} />}
              tone="blue"
            />
            <MetricCard
              label="Recorded charges"
              value={<span className="usage-money">{formatZarCents(cost.total_cost_cents)}</span>}
              detail="Current billing period"
              icon={<CircleDollarSign size={17} />}
              tone="amber"
            />
          </div>

          <div className="two-column-grid usage-content-grid">
            <Panel
              title="Quota overview"
              subtitle={`Plan: ${data.subscription.plan.name}`}
              className="usage-detail-panel"
              action={<StatusBadge status={data.subscription.status} />}
            >
              <div className="usage-period">
                <span>Billing period</span>
                <strong>{date(data.billing_period.start)} – {date(data.billing_period.end)}</strong>
              </div>
              <div className="usage-quota-list">
                <QuotaMeter label="API calls" used={usage.api_calls} limit={usage.api_call_limit} />
                <QuotaMeter
                  label="Billable tokens"
                  used={tokens.total_billable_tokens}
                  limit={usage.token_limit}
                />
              </div>
            </Panel>

            <Panel
              title="Recorded usage costs"
              subtitle="Charges reported for this period"
              className="usage-detail-panel"
              action={<span className="panel-heading-spacer" aria-hidden="true" />}
            >
              <div className="usage-cost-total">
                <span>Total recorded charges</span>
                <strong className="usage-money">{formatZarCents(cost.total_cost_cents)}</strong>
              </div>
              <div className="usage-cost-list">
                <div><span><i className="usage-cost-dot usage-cost-api" />API calls</span><strong className="usage-money">{formatZarCents(cost.api_call_cost_cents)}</strong></div>
                <div><span><i className="usage-cost-dot usage-cost-input" />Input tokens</span><strong className="usage-money">{formatZarCents(cost.input_cost_cents)}</strong></div>
                <div><span><i className="usage-cost-dot usage-cost-cached" />Cached input tokens</span><strong className="usage-money">{formatZarCents(cost.cached_input_cost_cents)}</strong></div>
                <div><span><i className="usage-cost-dot usage-cost-output" />Output tokens</span><strong className="usage-money">{formatZarCents(cost.output_cost_cents)}</strong></div>
              </div>
            </Panel>
          </div>

          <Panel
            title="Token breakdown"
            subtitle="Token totals recorded by the metering system"
            className="usage-token-panel"
            action={<span className="usage-token-total"><Coins size={14} />{number(tokens.total_billable_tokens)} billable</span>}
          >
            <div className="usage-token-grid">
              <div><span>Input tokens</span><strong>{number(tokens.input_tokens)}</strong></div>
              <div><span>Cached input tokens</span><strong>{number(tokens.cached_input_tokens)}</strong></div>
              <div><span>Reasoning tokens</span><strong>{number(tokens.reasoning_tokens)}</strong></div>
              <div><span>Output tokens</span><strong>{number(tokens.output_tokens)}</strong></div>
            </div>
            {data.metering_note && <p className="usage-note">{data.metering_note}</p>}
          </Panel>
          <p className="usage-footnote">Only activity recorded by the metering system is included. No sample history is shown.</p>
        </div>
      )}
    </>
  );
}
