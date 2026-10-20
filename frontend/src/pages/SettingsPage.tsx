import { useEffect, useState } from "react";
import {
  Bot,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  Moon,
  RefreshCw,
  Sun,
  UserRound,
  WalletCards,
} from "lucide-react";
import { PageHeading } from "../components/ui/Primitives";
import { getCurrentUserProfile } from "../data/userProfile";
import { getInvestecSandboxAccounts, syncInvestecSandbox, type InvestecAccountsResponse, type InvestecSyncResponse } from "../data/api";
import { getPreferences, savePreferences, type UserPreferences } from "../data/preferences";

const preferenceOptions = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "ZAR", label: "South African Rand (ZAR)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
];

export function SettingsPage() {
  const profile = getCurrentUserProfile();
  const [preferences, setPreferences] = useState<UserPreferences>(() => getPreferences());
  const [investec, setInvestec] = useState<InvestecAccountsResponse | null>(null);
  const [investecLoading, setInvestecLoading] = useState(true);
  const [investecSyncing, setInvestecSyncing] = useState(false);
  const [investecError, setInvestecError] = useState("");
  const [investecResult, setInvestecResult] = useState<InvestecSyncResponse | null>(null);

  async function loadInvestec() {
    setInvestecLoading(true);
    setInvestecError("");
    try {
      setInvestec(await getInvestecSandboxAccounts());
    } catch (error) {
      setInvestecError(error instanceof Error ? error.message : "Could not load Investec accounts.");
    } finally {
      setInvestecLoading(false);
    }
  }

  useEffect(() => {
    void loadInvestec();
  }, []);

  async function handleInvestecSync() {
    setInvestecSyncing(true);
    setInvestecError("");
    setInvestecResult(null);
    try {
      const result = await syncInvestecSandbox();
      setInvestecResult(result);
    } catch (error) {
      setInvestecError(error instanceof Error ? error.message : "Investec sync failed.");
    } finally {
      setInvestecSyncing(false);
    }
  }


  function updatePreferences(update: Partial<UserPreferences>) {
    const nextPreferences = { ...preferences, ...update };
    setPreferences(nextPreferences);
    savePreferences(nextPreferences);
  }

  return (
    <>
      <PageHeading
        eyebrow="PREFERENCES"
        title="Settings"
        description="Manage your profile and personalize your FinSight AI experience."
      />

      <div className="settings-simple-list">
        <section className="settings-preference-card">
          <div className="settings-preference-heading">
            <span className="settings-preference-icon"><UserRound size={17} /></span>
            <span><h2>Profile</h2><p>Your registered account details.</p></span>
          </div>
          <div className="settings-profile-details">
            <div className="settings-profile-avatar" aria-hidden="true">
              {profile.name
                ? profile.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
                : profile.email?.[0]?.toUpperCase() ?? <UserRound size={17} />}
            </div>
            <div className="settings-profile-copy">
              <strong>{profile.name || "My Account"}</strong>
              <span>{profile.email || "Email address unavailable"}</span>
            </div>
          </div>
          <p className="settings-preference-note">Profile details are read from the information already available in your signed-in frontend session.</p>
        </section>

        <section className="settings-preference-card">
          <div className="settings-preference-heading">
            <span className="settings-preference-icon">{preferences.theme === "dark" ? <Moon size={17} /> : <Sun size={17} />}</span>
            <span><h2>Appearance</h2><p>Choose the look of your FinSight AI workspace.</p></span>
          </div>
          <div className="settings-control-row">
            <label htmlFor="settings-theme">Color theme</label>
            <select id="settings-theme" value={preferences.theme} onChange={(event) => updatePreferences({ theme: event.target.value as UserPreferences["theme"] })}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </section>

        <section className="settings-preference-card">
          <div className="settings-preference-heading">
            <span className="settings-preference-icon"><WalletCards size={17} /></span>
            <span><h2>Preferences</h2><p>Set your preferred currency and date display.</p></span>
          </div>
          <div className="settings-control-row">
            <label htmlFor="settings-currency">Preferred currency</label>
            <select id="settings-currency" value={preferences.currency} onChange={(event) => updatePreferences({ currency: event.target.value })}>
              {preferenceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="settings-control-row">
            <label htmlFor="settings-date-format"><CalendarDays size={14} /> Date format</label>
            <select id="settings-date-format" value={preferences.dateFormat} onChange={(event) => updatePreferences({ dateFormat: event.target.value as UserPreferences["dateFormat"] })}>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <p className="settings-preference-note">These preferences are saved locally. Currency conversion is not available; financial records keep the currency provided with each record.</p>
        </section>

        <section className="settings-preference-card">
          <div className="settings-preference-heading">
            <span className="settings-preference-icon">{preferences.hideFinancialAmounts ? <EyeOff size={17} /> : <Eye size={17} />}</span>
            <span><h2>Privacy &amp; Security</h2><p>Control whether financial amounts are visible on this device.</p></span>
          </div>
          <label className="settings-switch-row" htmlFor="settings-hide-amounts">
            <span><strong>Hide financial amounts</strong><small>Blur financial figures throughout the app. This is a visual privacy setting only.</small></span>
            <input
              id="settings-hide-amounts"
              type="checkbox"
              checked={preferences.hideFinancialAmounts}
              onChange={(event) => updatePreferences({ hideFinancialAmounts: event.target.checked })}
            />
          </label>
        </section>

        <section className="settings-preference-card">
          <div className="settings-preference-heading">
            <span className="settings-preference-icon"><Bot size={17} /></span>
            <span><h2>AI Preferences</h2><p>Choose a preferred response style for future AI interactions.</p></span>
          </div>
          <div className="settings-control-row">
            <label htmlFor="settings-ai-style">Response style</label>
            <select id="settings-ai-style" value={preferences.aiResponseStyle} onChange={(event) => updatePreferences({ aiResponseStyle: event.target.value as UserPreferences["aiResponseStyle"] })}>
              <option value="balanced">Balanced</option>
              <option value="concise">Concise</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
          <p className="settings-preference-note">Saved locally as a preference. The current AI service does not accept response-style settings, so this selection does not change AI responses.</p>
        </section>

        <section className="settings-preference-card">
          <div className="settings-preference-heading">
            <span className="settings-preference-icon"><WalletCards size={17} /></span>
            <span>
              <h2>Investec Sandbox</h2>
              <p>Import sandbox accounts and available transactions into your signed-in FinSight account.</p>
            </span>
          </div>

          {investecLoading && <p className="settings-preference-note">Loading Investec sandbox accounts…</p>}

          {!investecLoading && investec && (
            <>
              <p className="settings-preference-note">
                {investec.accounts.length} sandbox account(s) available.
                {investec.simulated_data ? " This is simulated sandbox data, not live banking data." : ""}
              </p>
              {investec.accounts.map((account) => (
                <div className="settings-control-row" key={account.accountId}>
                  <span>
                    <strong>{account.referenceName || account.accountName || "Investec account"}</strong>
                    <small>{account.productName || "Account"} · {account.accountNumber || account.accountId}</small>
                  </span>
                </div>
              ))}
            </>
          )}

          {investecError && <p className="settings-preference-note" role="alert">{investecError}</p>}

          {investecResult && (
            <p className="settings-preference-note" role="status">
              {investecResult.message} Accounts synced: {investecResult.accounts_synced};
              transactions imported: {investecResult.transactions_imported};
              duplicates/unsupported records skipped: {investecResult.transactions_skipped}.
              {investecResult.simulated_data ? " Sandbox data only." : ""}
            </p>
          )}

          <div className="settings-control-row">
            <button type="button" onClick={() => void loadInvestec()} disabled={investecLoading || investecSyncing}>
              <RefreshCw size={14} /> Refresh accounts
            </button>
            <button type="button" onClick={() => void handleInvestecSync()} disabled={investecSyncing || investecLoading}>
              <RefreshCw size={14} /> {investecSyncing ? "Syncing…" : "Sync transactions"}
            </button>
          </div>
          <p className="settings-preference-note">
            After a successful sync, revisit Dashboard, Financial, Transactions, Insights and AI Assistant to reload their data.
            Account balances are not recalculated by the current historical transaction import.
          </p>
        </section>

        <div className="settings-saved-message" role="status"><Check size={14} /> Changes are saved automatically on this device.</div>
      </div>
    </>
  );
}
