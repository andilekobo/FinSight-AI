import { useState } from "react";
import { ArrowRight, ArrowUpRight, Bot, CircleAlert, Lightbulb, TrendingUp, WandSparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeading } from "../components/ui/Primitives";
import { getAIInsights } from "../data/mockApi";

const categoryIcons = {
  Forecast: TrendingUp,
  Trend: ArrowUpRight,
  Anomaly: CircleAlert,
  Recommendation: Lightbulb,
};

export function InsightsPage() {
  const [filter, setFilter] = useState("All insights");
  const insights = getAIInsights().filter((insight) => filter === "All insights" || insight.category === filter);
  return (
    <>
      <PageHeading eyebrow="INTELLIGENCE CENTER" title="AI Insights" description="Proactive signals to help you make smarter financial decisions." action={<button className="button button-secondary"><WandSparkles size={15} /> Refresh insights</button>} />
      <div className="insights-hero"><div className="insights-hero-orb" /><div className="insights-ai-icon"><Bot size={22} /></div><div className="insights-hero-copy"><span className="ai-label"><i className="sparkle-dot" /> FIN SIGHT INTELLIGENCE</span><h2>Your business, understood.</h2><p>We analyzed your usage and financial activity to find <strong>4 things worth your attention</strong>.</p></div><div className="insights-score"><span>WORKSPACE HEALTH</span><strong>86<small>/100</small></strong><div><i /></div><small>Looking good</small></div></div>
      <div className="insights-toolbar"><div><h2>Latest insights <span>04</span></h2><p>Updated just now · Based on your October activity</p></div><select className="select-compact" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All insights</option><option>Forecast</option><option>Trend</option><option>Anomaly</option><option>Recommendation</option></select></div>
      <div className="insight-cards">
        {insights.map((insight, index) => {
          const Icon = categoryIcons[insight.category];
          return <article className={`insight-card insight-${insight.tone}`} key={insight.id}>
            <div className="insight-card-top"><div className={`insight-card-icon insight-icon-${insight.category.toLowerCase()}`}><Icon size={18} /></div><span className="insight-category">{insight.category}</span><span className="insight-number">0{index + 1}</span></div>
            <h3>{insight.title}</h3><p>{insight.description}</p>
            <div className="insight-card-bottom"><span className={`impact-tag impact-${insight.tone}`}>{insight.impact}</span><button className="insight-arrow" aria-label={`View ${insight.title}`}><ArrowRight size={16} /></button></div>
          </article>;
        })}
      </div>
      <div className="insights-bottom-cta"><div className="cta-spark"><WandSparkles size={17} /></div><div><strong>Want to dig deeper?</strong><span>Ask FinSight AI to explore what these insights mean for your business.</span></div><Link to="/ai-assistant" className="button button-secondary">Talk to AI <ArrowRight size={14} /></Link></div>
    </>
  );
}
