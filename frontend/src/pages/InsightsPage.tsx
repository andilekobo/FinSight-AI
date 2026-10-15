import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
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
  getSavedInsights,
  type SavedInsight,
  type SavedInsightsResponse,
} from "../data/api";

function isSavedInsightsResponse(value: unknown): value is SavedInsightsResponse {
  if (typeof value !== "object" || value === null) return false;
  const response = value as Record<string, unknown>;
  return (
    typeof response.count === "number" &&
    Number.isFinite(response.count) &&
    Array.isArray(response.insights) &&
    response.count === response.insights.length &&
    response.insights.every((item: unknown) => {
      if (typeof item !== "object" || item === null) return false;
      const insight = item as Record<string, unknown>;
      return (
        typeof insight.id === "string" &&
        (insight.title === undefined || typeof insight.title === "string") &&
        (insight.description === undefined || typeof insight.description === "string") &&
        (insight.insight_type === undefined || typeof insight.insight_type === "string") &&
        (insight.severity === undefined || typeof insight.severity === "string") &&
        (insight.created_at === undefined || typeof insight.created_at === "string")
      );
    })
  );
}

function insightLabel(insight: SavedInsight): string {
  return insight.insight_type
    ? insight.insight_type.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Type not provided";
}

function insightIcon(insight: SavedInsight) {
  const type = insight.insight_type?.toLowerCase() ?? "";
  if (type.includes("increase") || type.includes("anomaly")) return CircleAlert;
  if (type.includes("decrease") || type.includes("trend") || type.includes("forecast")) return TrendingUp;
  if (type.includes("unchanged")) return ArrowUpRight;
  return Lightbulb;
}

function insightTone(insight: SavedInsight): "warning" | "neutral" | "positive" {
  const severity = insight.severity?.toLowerCase();
  if (severity === "warning") return "warning";
  if (severity === "positive" || severity === "success") return "positive";
  return "neutral";
}

function createdDate(value: string | undefined): string {
  if (!value) return "Date not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date not provided"
    : date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export function InsightsPage() {
  const [insights, setInsights] = useState<SavedInsight[]>([]);
  const [filter, setFilter] = useState("All insights");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadInsights() {
      setLoading(true);
      setError(null);
      setInsights([]);

      if (!getCurrentUserId()) {
        setError("Please sign in again to view your saved insights.");
        setLoading(false);
        return;
      }

      try {
        const result: unknown = await getSavedInsights();
        if (!isSavedInsightsResponse(result)) {
          throw new Error("The API returned an unexpected saved insights response.");
        }
        if (active) setInsights(result.insights);
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

  const categories = useMemo(
    () => [...new Set(insights.map((insight) => insight.insight_type).filter((type): type is string => Boolean(type)))].sort(),
    [insights],
  );
  const visibleInsights = useMemo(
    () => insights.filter((insight) => filter === "All insights" || insight.insight_type === filter),
    [insights, filter],
  );

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
          <p>Insights saved for your account by the backend appear here.</p>
        </div>
        <div className="insights-score">
          <span>SAVED INSIGHTS</span>
          <strong>{loading ? "—" : error ? "—" : insights.length}</strong>
          <small>{loading ? "Loading" : error ? "Unavailable" : "returned by backend"}</small>
        </div>
      </div>
      <div className="insights-toolbar">
        <div>
          <h2>Latest insights <span>{loading || error ? "—" : visibleInsights.length}</span></h2>
          <p>{loading ? "Loading saved insights…" : error ? "Saved insights could not be retrieved." : "Saved insights returned for your account."}</p>
        </div>
        <select
          className="select-compact"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          disabled={loading || Boolean(error) || insights.length === 0}
          aria-label="Filter insights by type"
        >
          <option value="All insights">All insights</option>
          {categories.map((category) => (
            <option key={category} value={category}>{insightLabel({ id: "", insight_type: category })}</option>
          ))}
        </select>
      </div>
      {loading && (
        <div className="empty-state" role="status">
          <span className="insights-loading-indicator" />
          Loading saved insights…
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
      {!loading && !error && insights.length === 0 && (
        <div className="empty-state">No saved insights are available for this account yet.</div>
      )}
      {!loading && !error && insights.length > 0 && visibleInsights.length === 0 && (
        <div className="empty-state">No saved insights match this type.</div>
      )}
      {!loading && !error && visibleInsights.length > 0 && (
        <div className="insight-cards">
          {visibleInsights.map((insight, index) => {
            const Icon = insightIcon(insight);
            const tone = insightTone(insight);
            const label = insightLabel(insight);
            return (
              <article className={`insight-card insight-${tone}`} key={insight.id}>
                <div className="insight-card-top">
                  <div className="insight-card-icon insight-icon-recommendation"><Icon size={18} /></div>
                  <span className="insight-category">{label}</span>
                  <span className="insight-number">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3>{insight.title || "Title not provided"}</h3>
                <p>{insight.description || "The backend did not provide a description for this insight."}</p>
                <div className="insight-card-bottom">
                  <span className={`impact-tag impact-${tone}`}>
                    {insight.severity || createdDate(insight.created_at)}
                  </span>
                  <span className="insight-arrow" aria-hidden="true"><ArrowRight size={16} /></span>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div className="insights-bottom-cta">
        <div className="cta-spark"><WandSparkles size={17} /></div>
        <div>
          <strong>Want to dig deeper?</strong>
          <span>Ask FinSight AI to explore what your saved insights mean for your business.</span>
        </div>
        <Link to="/ai-assistant" className="button button-secondary">Talk to AI <ArrowRight size={14} /></Link>
      </div>
    </>
  );
}
