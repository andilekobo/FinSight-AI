import { useState } from "react";
import { ArrowUpRight, Bell, Building2, Check, ChevronRight, CreditCard, Link2, LockKeyhole, Sparkles, UserRound, WalletCards } from "lucide-react";
import { PageHeading } from "../components/ui/Primitives";

const sections = ["Profile", "Workspace", "Plan & billing", "Integrations", "Notifications"];

export function SettingsPage() {
  const [active, setActive] = useState("Profile");
  return (
    <>
      <PageHeading eyebrow="PREFERENCES & CONNECTIONS" title="Settings" description="Manage your workspace, profile, and integrations." />
      <div className="settings-layout">
        <aside className="settings-nav">{sections.map((section, index) => {
          const Icon = [UserRound, Building2, CreditCard, Link2, Bell][index];
          return <button key={section} className={active === section ? "settings-nav-active" : ""} onClick={() => setActive(section)}><Icon size={16} />{section}{active === section && <ChevronRight size={14} />}</button>;
        })}</aside>
        <div className="settings-content">
          <div className="settings-section-heading"><h2>{active}</h2><p>Manage your {active.toLowerCase()} preferences.</p></div>
          {active === "Profile" && <div className="settings-card"><div className="profile-settings-avatar">JD</div><div className="settings-fields"><label>Full name<input defaultValue="Jordan Davis" /></label><label>Email address<input defaultValue="jordan@northstar.studio" /></label><label>Role<input defaultValue="Workspace administrator" /></label><button className="button button-primary">Save changes</button></div></div>}
          {active === "Workspace" && <div className="settings-card settings-rows"><div><Building2 size={19} /><span><strong>Workspace name</strong><small>Northstar Studio</small></span><button className="text-action">Edit</button></div><div><LockKeyhole size={19} /><span><strong>Workspace ID</strong><small>ws_northstar_studio</small></span><button className="text-action">Copy</button></div></div>}
          {active === "Plan & billing" && <div className="settings-card settings-rows"><div><CreditCard size={19} /><span><strong>Current plan</strong><small>Scale · Monthly billing</small></span><span className="connected-check"><Check size={13} /> Active</span></div><div><WalletCards size={19} /><span><strong>Billing details</strong><small>Manage invoices and payment methods</small></span><button className="text-action">Manage</button></div></div>}
          {active === "Integrations" && <div className="integration-list">
            <div className="integration-card investec-integration"><div className="integration-logo investec-logo">i</div><div className="integration-copy"><strong>Investec</strong><p>Connect your business account for real-time financial insights.</p><span className="integration-state"><i /> Not connected</span></div><button className="button button-secondary">Connect account <ArrowUpRight size={14} /></button></div>
            <div className="integration-card"><div className="integration-logo integration-ai-logo"><Sparkles size={18} /></div><div className="integration-copy"><strong>AI provider</strong><p>AI-powered insights and assistant connections.</p><span className="integration-state integration-placeholder">Coming soon</span></div><button className="button button-secondary" disabled>Configure</button></div>
          </div>}
          {active === "Notifications" && <div className="settings-card notification-settings">{["Usage quota alerts", "Monthly billing summaries", "AI insights and recommendations", "Unusual activity alerts"].map((item, index) => <label key={item}><span><strong>{item}</strong><small>{["Get notified when you approach your monthly quota.", "Receive your usage summary at the start of each month.", "Get actionable recommendations from FinSight AI.", "We'll flag unusual usage or transaction activity."][index]}</small></span><input type="checkbox" defaultChecked={index !== 1} /></label>)}</div>}
          <div className="settings-security"><LockKeyhole size={14} /><span>Your data is encrypted and secure. Manage connected data sources at any time.</span></div>
        </div>
      </div>
    </>
  );
}
