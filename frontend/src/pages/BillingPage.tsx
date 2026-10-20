import { useCallback, useEffect, useState } from "react";
import {
  CreditCard,
  Info,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  getBilling,
  getUsage,
  type BillingResponse,
  type UsageResponse,
} from "../data/api";
import { PageHeading, Panel, StatusBadge } from "../components/ui/Primitives";
import { formatZarCents } from "../utils/currency";

const number = (value: number) => new Intl.NumberFormat("en-ZA").format(value);

export function BillingPage() {
  const [billing, setBilling] = useState<BillingResponse | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [billingData, usageData] = await Promise.all([getBilling(), getUsage()]);
      setBilling(billingData);
      setUsage(usageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load billing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <PageHeading
        eyebrow="PLANS & PAYMENTS"
        title="Billing"
        description="Review your subscription and charges recorded for the current billing period."
      />

      {loading && (
        <div className="data-state billing-state" role="status">
          <span className="data-state-spinner" aria-hidden="true" />
          <div><strong>Loading billing</strong><p>Retrieving your subscription and usage charges.</p></div>
        </div>
      )}
      {error && (
        <div className="data-state data-state-error billing-state" role="alert">
          <div>
            <strong>Billing could not be loaded</strong>
            <p>{error}</p>
          </div>
          <button className="button button-secondary" type="button" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      )}

      {!loading && !error && billing && usage && (
        <div className="billing-page-content">
          <div className="two-column-grid billing-overview-grid">
            <Panel
              title="Subscription overview"
              subtitle="Your current plan and included limits"
              className="billing-plan-panel"
              action={<StatusBadge status={billing.subscription.status} />}
            >
              <div className="billing-plan">
                <div className="billing-plan-icon"><CreditCard size={19} /></div>
                <div>
                  <span>Current plan</span>
                  <h3>{billing.subscription.plan.name}</h3>
                </div>
              </div>
              <div className="billing-limits">
                <div>
                  <span>Monthly API-call limit</span>
                  <strong>{number(billing.subscription.plan.api_call_limit)}</strong>
                </div>
                <div>
                  <span>Monthly token limit</span>
                  <strong>{number(billing.subscription.plan.token_limit)}</strong>
                </div>
              </div>
              <div className="billing-tenant">
                <span>Workspace ID</span>
                <code>{billing.tenant_id}</code>
              </div>
            </Panel>

            <Panel
              title="Current usage charges"
              subtitle="Recorded costs this billing period"
              className="billing-charges-panel"
              action={<span className="billing-period-label">Current period</span>}
            >
              <div className="billing-total">
                <span>Total recorded charges</span>
                <strong className="billing-money">{formatZarCents(usage.cost.total_cost_cents)}</strong>
              </div>
              <div className="billing-charge-list">
                <div><span>API calls</span><strong className="billing-money">{formatZarCents(usage.cost.api_call_cost_cents)}</strong></div>
                <div><span>Input tokens</span><strong className="billing-money">{formatZarCents(usage.cost.input_cost_cents)}</strong></div>
                <div><span>Cached input tokens</span><strong className="billing-money">{formatZarCents(usage.cost.cached_input_cost_cents)}</strong></div>
                <div><span>Output tokens</span><strong className="billing-money">{formatZarCents(usage.cost.output_cost_cents)}</strong></div>
              </div>
              <p className="billing-call-count">{number(usage.usage.api_calls)} API calls recorded</p>
            </Panel>
          </div>

          <Panel
            title="Payments and invoices"
            subtitle="Payment integration information"
            className="billing-integration-panel"
            action={<span className="billing-provider-icon"><ReceiptText size={16} /></span>}
          >
            <div className="billing-integration-message">
              <span className="billing-info-icon"><Info size={17} /></span>
              <div>
                <strong>{billing.message}</strong>
                <p>Payment provider: <span>{billing.payment_provider}</span></p>
              </div>
            </div>
            {billing.checkout_is_simulated && (
              <div className="billing-notice">
                <ShieldCheck size={15} />
                <p>Checkout is simulated. No real payment has been taken, and invoice history is not available from this endpoint.</p>
              </div>
            )}
            {!billing.checkout_is_simulated && (
              <p className="billing-invoice-note">Invoice history is not available from this endpoint.</p>
            )}
          </Panel>
          <p className="billing-footnote">Only charges returned by the metering endpoint are shown. No invoices, payment history or payment methods have been inferred.</p>
        </div>
      )}
    </>
  );
}
