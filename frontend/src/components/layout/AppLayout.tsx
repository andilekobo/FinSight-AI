import { useEffect, useRef, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Bot,
  ChevronDown,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { USER_PROFILE_KEY, getCurrentUserProfile } from "../../data/userProfile";
import { applyPreferences, getPreferences } from "../../data/preferences";

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
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);
  const profile = getCurrentUserProfile();
  const profileName = profile.name || "My Account";
  const profileInitials = profile.name
    ? profile.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
    : profile.email?.[0]?.toUpperCase() ?? null;

  useEffect(() => {
    applyPreferences(getPreferences());
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    }
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileOpen]);

  if (!localStorage.getItem("finsight_access_token")) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  function handleLogout() {
    localStorage.removeItem("finsight_access_token");
    localStorage.removeItem(USER_PROFILE_KEY);
    navigate("/login", { replace: true });
  }

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
          <button className="sidebar-logout" type="button" title="Logout" aria-label="Logout" onClick={handleLogout}>
            <span className="sidebar-logout-icon" aria-hidden="true"><LogOut size={14} /></span>
            <span>Logout</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-link"><CircleHelp size={17} /><span>Help & support</span><ArrowUpRight size={13} /></div>
          <div className="investec-status">
            <div className="investec-logo">i</div>
            <div className="investec-copy"><strong>Investec</strong><span><i className="status-dot" /> Not connected</span></div>
            <span className="connect-pill">Connect</span>
          </div>
          <div className="sidebar-profile">
            <div className="profile-avatar">{profileInitials ?? <UserRound size={15} aria-hidden="true" />}</div>
            <div className="profile-copy"><strong>{profileName}</strong><span>{profile.email || "Signed in"}</span></div>
            <button className="profile-more icon-button" aria-label="Profile menu"><ChevronDown size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{pageNames[location.pathname] ?? "Overview"}</strong></div>
          <div className="topbar-actions">
            <GlobalSearch destinations={navigation} />
            <div className="profile-menu" ref={profileRef}>
              <button
                className="avatar-button"
                type="button"
                aria-label={`Account: ${profileName}`}
                aria-haspopup="dialog"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((open) => !open)}
              >
                {profileInitials ?? <UserRound size={16} aria-hidden="true" />}
              </button>
              {profileOpen && (
                <section className="profile-dropdown" role="dialog" aria-label="Account details">
                  <div className="profile-dropdown-heading">
                    <span className="profile-dropdown-avatar">{profileInitials ?? <UserRound size={16} aria-hidden="true" />}</span>
                    <span><strong>{profileName}</strong><small>{profile.email || "Account details unavailable"}</small></span>
                  </div>
                  <button className="profile-dropdown-logout" type="button" onClick={handleLogout}>
                    <LogOut size={15} /> Logout
                  </button>
                </section>
              )}
            </div>
          </div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
