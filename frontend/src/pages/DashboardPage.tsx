import { Download } from "lucide-react";
import { DashboardWidgets } from "../components/dashboard/DashboardWidgets";
import { PageHeading } from "../components/ui/Primitives";
import { getDashboardSummary } from "../data/mockApi";

export function DashboardPage() {
  return (
    <>
      <PageHeading
        eyebrow="TUESDAY, OCTOBER 6, 2026"
        title="Overview"
        description="Your financial health and AI usage, all in one place."
        action={<button className="button button-secondary"><Download size={15} /> Export report</button>}
      />
      <DashboardWidgets summary={getDashboardSummary()} />
    </>
  );
}
