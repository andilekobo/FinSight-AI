import { API_BASE_URL } from "../data/api";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { saveCurrentUserProfile } from "../data/userProfile";

type Feedback = { kind: "error"; message: string } | null;

const AUTH_REQUEST_TIMEOUT_MS = 15_000;

function getApiErrorMessage(result: unknown): string | null {
  if (typeof result !== "object" || result === null || !("detail" in result)) {
    return null;
  }

  const detail = result.detail;
  if (typeof detail === "string") return detail;
  if (!Array.isArray(detail)) return null;

  return detail
    .map((item: unknown) =>
      typeof item === "object" &&
      item !== null &&
      "msg" in item &&
      typeof item.msg === "string"
        ? item.msg
        : "",
    )
    .filter(Boolean)
    .join(" ");
}

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRegister = location.pathname === "/register";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const email = String(formData.get("email") ?? "").trim();

    if (isRegister && password !== String(formData.get("confirm-password") ?? "")) {
      setFeedback({ kind: "error", message: "Those passwords don't match yet." });
      return;
    }

    setFeedback(null);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      AUTH_REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(`${API_BASE_URL}${isRegister ? "/auth/register" : "/auth/login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(
          isRegister
            ? {
                full_name: String(formData.get("full-name") ?? "").trim(),
                email,
                password,
              }
            : { email, password }
        ),
      });

      const result: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          getApiErrorMessage(result) ??
          (isRegister
            ? `Registration failed (HTTP ${response.status}). Check your details and try again.`
            : `Login failed (HTTP ${response.status}). Check your email and password.`);

        setFeedback({ kind: "error", message });
        return;
      }

      if (isRegister) {
        navigate("/login", { replace: true, state: { registered: true } });
        return;
      }

      const accessToken =
        typeof result === "object" &&
        result !== null &&
        "access_token" in result &&
        typeof result.access_token === "string"
          ? result.access_token
          : null;

      if (!accessToken) {
        setFeedback({
          kind: "error",
          message: "The API did not return an access token. Please try again.",
        });
        return;
      }

      localStorage.setItem("finsight_access_token", accessToken);
      saveCurrentUserProfile(result, accessToken, email);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "AbortError";
      setFeedback({
        kind: "error",
        message: timedOut
          ? "The API request timed out. The backend may be unavailable or taking too long; please try again."
          : "Could not reach the API. Check that the backend is running and reachable.",
      });
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-backdrop auth-backdrop-one" />
      <div className="auth-backdrop auth-backdrop-two" />
      <section className="auth-story" aria-label="About FinSight AI">
        <Link to="/login" className="auth-brand" aria-label="FinSight AI home">
          <span className="auth-brand-mark"><Activity size={19} strokeWidth={2.6} /></span>
          <span>FinSight<span> AI</span></span>
        </Link>

        <div className="auth-story-content">
          <div className="auth-kicker"><span /><Sparkles size={13} /> FINANCIAL CLARITY, REIMAGINED</div>
          <h1>Your finances,<br />understood <em>intelligently.</em></h1>
          <p className="auth-story-description">
            Bring every number into focus. Make confident decisions with a clearer view of your financial world.
          </p>

          <div className="auth-preview" aria-hidden="true">
            <div className="auth-preview-top">
              <div className="auth-preview-label"><span className="auth-preview-icon"><WalletCards size={15} /></span><span>Financial overview</span></div>
              <span className="auth-preview-period">Your data</span>
            </div>
            <div className="auth-preview-empty">
              <span className="auth-preview-empty-icon"><WalletCards size={17} /></span>
              <strong>Connect your financial data</strong>
              <span>Your account information will appear here once connected.</span>
            </div>
          </div>

          <div className="auth-trust-row">
            <span><Check size={13} /> One clear view</span>
            <span><Check size={13} /> Smarter decisions</span>
            <span><Check size={13} /> Built around you</span>
          </div>
        </div>
        <div className="auth-story-footer"><span>Â© 2025 FinSight AI</span><span className="auth-footer-dot" /> A more thoughtful way to manage money</div>
      </section>

      <section className="auth-panel" aria-label={isRegister ? "Create your account" : "Sign in"}>
        <div className="auth-panel-top">
          <span className="auth-panel-secure"><LockKeyhole size={13} /> PRIVATE BY DESIGN</span>
          <span className="auth-mobile-brand"><Activity size={15} /> FinSight<span> AI</span></span>
          <span className="auth-panel-switch">
            {isRegister ? "Already have an account?" : "New to FinSight?"}
            <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create account"}</Link>
          </span>
        </div>

        <div className="auth-form-wrap" key={isRegister ? "register" : "login"}>
          <div className="auth-form-heading">
            <div className="auth-heading-icon">{isRegister ? <Sparkles size={18} /> : <Activity size={18} />}</div>
            <div className="auth-form-eyebrow">{isRegister ? "START WITH A CLEARER VIEW" : "WELCOME BACK"}</div>
            <h2>{isRegister ? "Your next chapter starts here." : "Good to see you again."}</h2>
            <p>{isRegister ? "Create your account and bring your financial picture into focus." : "Sign in to pick up right where your financial story left off."}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <label className="auth-field">
                <span>Full name</span>
                <div className="auth-input-wrap">
                  <input name="full-name" type="text" placeholder="e.g. Jordan Davis" autoComplete="name" required />
                </div>
              </label>
            )}
            <label className="auth-field">
              <span>Email address</span>
              <div className="auth-input-wrap">
                <Mail size={17} />
                <input name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
              </div>
            </label>
            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-wrap">
                <LockKeyhole size={17} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isRegister ? "At least 8 characters" : "Enter your password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  minLength={isRegister ? 8 : undefined}
                  required
                />
                <button className="auth-password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {isRegister ? (
              <>
                <label className="auth-field">
                  <span>Confirm password</span>
                  <div className="auth-input-wrap">
                    <LockKeyhole size={17} />
                    <input
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <button className="auth-password-toggle" type="button" aria-label={showConfirmPassword ? "Hide password" : "Show password"} onClick={() => setShowConfirmPassword((visible) => !visible)}>
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>
                <label className="auth-terms">
                  <input type="checkbox" name="terms" required />
                  <span className="auth-checkbox"><Check size={12} /></span>
                  <span>I agree to the <a href="#terms" onClick={(event) => event.preventDefault()}>Terms of Service</a> and <a href="#privacy" onClick={(event) => event.preventDefault()}>Privacy Policy</a>.</span>
                </label>
              </>
            ) : (
              <div className="auth-form-options">
                <label className="auth-remember">
                  <input type="checkbox" name="remember" />
                  <span className="auth-checkbox"><Check size={12} /></span>
                  Remember me
                </label>
                <Link className="auth-text-button" to="/forgot-password">Forgot password?</Link>
              </div>
            )}

            {feedback && (
              <div className={`auth-feedback auth-feedback-${feedback.kind}`} role="status" aria-live="polite">
                {feedback.message}
              </div>
            )}
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? <><span className="auth-spinner" />{isRegister ? "Creating your account..." : "Signing you in..."}</> : <>{isRegister ? "Create your account" : "Sign in"}<ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="auth-divider"><span /> OR <span /></div>
          <p className="auth-demo-note">A calmer, clearer view of your money starts with one small step.</p>
          <div className="auth-privacy-note"><span className="auth-privacy-icon"><LockKeyhole size={14} /></span><span><strong>Your information stays yours.</strong><br />Your account is checked by the FinSight AI API.</span></div>
        </div>

        <div className="auth-panel-footer">
          <span>Thoughtful tools for your financial life</span>
          <span className="auth-rating"><span>â˜…â˜…â˜…â˜…â˜…</span> Made for clarity</span>
        </div>
      </section>
    </main>
  );
}
