import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Bot,
  ChevronDown,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";

const navigation = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "Usage", path: "/usage", icon: Activity },
  { label: "Billing", path: "/billing", icon: CreditCard },
  { label: "Financial", path: "/financial", icon: WalletCards },
  { label: "Transactions", path: "/transactions", icon: ArrowDownLeft },
  { label: "AI Insights", path: "/ai-insights", icon: Sparkles },
  { label: "AI Assistant", path: "/ai-assistant", icon: Bot },
  { label: "Settings", path: "/settings", icon: Settings },
];

const pageNames: Record<string, string> = {
  "/dashboard": "Overview",
  "/usage": "Usage",
  "/billing": "Billing",
  "/financial": "Financial",
  "/transactions": "Transactions",
  "/ai-insights": "AI Insights",
  "/ai-assistant": "AI Assistant",
  "/settings": "Settings",
};

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-shell">
      {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><Activity size={19} strokeWidth={2.6} /></div>
          <span>FinSight<span className="brand-ai"> AI</span></span>
          <button className="sidebar-close icon-button" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X size={19} /></button>
        </div>

        <div className="workspace-switch">
          <div className="workspace-avatar">N</div>
          <div className="workspace-copy"><strong>Northstar Studio</strong><span>Free workspace</span></div>
          <ChevronDown size={15} className="muted-icon" />
        </div>

        <div className="nav-caption">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
            >
              <Icon size={18} strokeWidth={1.9} />
              <span>{label}</span>
              {label === "AI Insights" && <span className="nav-new">NEW</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-link"><CircleHelp size={17} /><span>Help & support</span><ArrowUpRight size={13} /></div>
          <div className="investec-status">
            <div className="investec-logo">i</div>
            <div className="investec-copy"><strong>Investec</strong><span><i className="status-dot" /> Not connected</span></div>
            <span className="connect-pill">Connect</span>
          </div>
          <div className="sidebar-profile">
            <div className="profile-avatar">JD</div>
            <div className="profile-copy"><strong>Jordan Davis</strong><span>Admin</span></div>
            <button className="profile-more icon-button" aria-label="Profile menu"><ChevronDown size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{pageNames[location.pathname] ?? "Overview"}</strong></div>
          <div className="topbar-actions">
            <button className="topbar-search"><Search size={16} /><span>Search anything...</span><kbd>⌘ K</kbd></button>
            <button className="avatar-button" aria-label="Jordan Davis account">JD</button>
          </div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
