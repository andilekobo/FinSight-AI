import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, MoreHorizontal } from "lucide-react";

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  change,
  detail,
  icon,
  tone = "green",
  direction = "up",
}: {
  label: string;
  value: ReactNode;
  change?: string;
  detail?: string;
  icon: ReactNode;
  tone?: "green" | "blue" | "violet" | "amber";
  direction?: "up" | "down";
}) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon tone-${tone}`}>{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-bottom">
        {change && <span className={`change-pill ${direction === "down" ? "change-good" : "change-positive"}`}>
          {direction === "down" ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}{change}
        </span>}
        <span className="metric-detail">{detail}</span>
      </div>
    </article>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        {action ?? <button className="icon-button panel-more" aria-label={`${title} options`}><MoreHorizontal size={19} /></button>}
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(" ", "-");
  return <span className={`status-badge status-${normalized}`}><i />{status}</span>;
}

export function Currency({
  value,
  compact = false,
  currency = "USD",
}: {
  value: number;
  compact?: boolean;
  currency?: string;
}) {
  return <>{new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 0 : 2,
    minimumFractionDigits: compact ? 0 : 2,
  }).format(value)}</>;
}
