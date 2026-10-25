import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  CircleAlert,
  Lightbulb,
  RefreshCw,
  TrendingUp,
  WandSparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeading } from "../components/ui/Primitives";
import {
  getCurrentUserId,
  getAIInsights,
  type AIInsightsResponse,
} from "../data/api";

function isAIInsightsResponse(value: unknown): value is AIInsightsResponse {
  if (typeof value !== "object" || value === null) return false;
  const response = value as Record<string, unknown>;
  return (
    typeof response.user_id === "string" &&
    typeof response.period_days === "number" &&
    Number.isFinite(response.period_days) &&
    (typeof response.current_spending === "number" ||
      (typeof response.current_spending === "string" &&
        response.current_spending.trim() !== "" &&
        Number.isFinite(Number(response.current_spending)))) &&
    (typeof response.previous_spending === "number" ||
      (typeof response.previous_spending === "string" &&
        response.previous_spending.trim() !== "" &&
        Number.isFinite(Number(response.previous_spending)))) &&
    typeof response.change_percent === "number" &&
    Number.isFinite(response.change_percent) &&
    typeof response.message === "string"
  );
}

function formatAmount(value: number | string): string {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-ZA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    : "Unavailable";
}

function percentageLabel(value: number): string {
  const formatted = new Intl.NumberFormat("en-ZA", {
    maximumFractionDigits: 2,
  }).format(value);
  return `${value > 0 ? "+" : ""}${formatted}%`;
}

function insightTone(change: number): "warning" | "neutral" | "positive" {
  if (change > 10) return "warning";
  if (change < -10) return "positive";
  return "neutral";
}

function insightIcon(change: number) {
  if (change > 10) return CircleAlert;
  if (change < -10) return TrendingUp;
  return Lightbulb;
}

export function InsightsPage() {
  const [insights, setInsights] = useState<AIInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadInsights() {
      setLoading(true);
      setError(null);
      setInsights(null);

      if (!getCurrentUserId()) {
        setError("Please sign in again to view your saved insights.");
        setLoading(false);
        return;
      }

      try {
        const result: unknown = await getAIInsights();
        if (!isAIInsightsResponse(result)) {
          throw new Error("The API returned an unexpected spending comparison response.");
        }
        if (active) setInsights(result);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load saved insights.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadInsights();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <>
      <PageHeading
        eyebrow="INTELLIGENCE CENTER"
        title="AI Insights"
        description="Review financial insights saved for your account."
        action={
          <button
            className="button button-secondary"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
          >
            <RefreshCw size={15} />
            {loading ? "Loading insights…" : "Refresh insights"}
          </button>
        }
      />
      <div className="insights-hero">
        <div className="insights-hero-orb" />
        <div className="insights-ai-icon"><Bot size={22} /></div>
        <div className="insights-hero-copy">
          <span className="ai-label"><i className="sparkle-dot" /> FIN SIGHT INTELLIGENCE</span>
          <h2>Your business, understood.</h2>
          <p>Review the backend's current and previous spending comparison.</p>
        </div>
        <div className="insights-score">
          <span>SPENDING CHANGE</span>
          <strong>{loading || error || !insights ? "—" : percentageLabel(insights.change_percent)}</strong>
          <small>{loading ? "Loading" : error ? "Unavailable" : `over ${insights?.period_days} days`}</small>
        </div>
      </div>
      <div className="insights-toolbar">
        <div>
          <h2>Spending comparison</h2>
          <p>
            {loading
              ? "Loading the spending comparison…"
              : error
                ? "The spending comparison could not be retrieved."
                : insights?.message ?? "No spending comparison was returned."}
          </p>
        </div>
      </div>
      {loading && (
        <div className="empty-state" role="status">
          <span className="insights-loading-indicator" />
          Loading the spending comparison…
        </div>
      )}
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
      {!loading && !error && !insights && (
        <div className="empty-state">No spending comparison was returned.</div>
      )}
      {!loading && !error && insights && (
        <div className="insight-cards">
          {(() => {
            const tone = insightTone(insights.change_percent);
            const Icon = insightIcon(insights.change_percent);
            return (
              <article className={`insight-card insight-${tone}`}>
                <div className="insight-card-top">
                  <div className="insight-card-icon insight-icon-recommendation"><Icon size={18} /></div>
                  <span className="insight-category">{insights.period_days}-day comparison</span>
                  <span className="insight-number">{percentageLabel(insights.change_percent)}</span>
                </div>
                <h3>{insights.message}</h3>
                <p>
                  Current spending: {formatAmount(insights.current_spending)} ·
                  Previous period: {formatAmount(insights.previous_spending)}.
                  The backend response does not include a currency.
                </p>
                <div className="insight-card-bottom">
                  <span className={`impact-tag impact-${tone}`}>
                    Change {percentageLabel(insights.change_percent)}
                  </span>
                  <span className="insight-arrow" aria-hidden="true"><ArrowRight size={16} /></span>
                </div>
              </article>
            );
          })()}
        </div>
      )}
      <div className="insights-bottom-cta">
        <div className="cta-spark"><WandSparkles size={17} /></div>
        <div>
          <strong>Want to dig deeper?</strong>
          <span>Ask FinSight AI to explore your recorded financial activity.</span>
        </div>
        <Link to="/ai-assistant" className="button button-secondary">Talk to AI <ArrowRight size={14} /></Link>
      </div>
    </>
  );
}
