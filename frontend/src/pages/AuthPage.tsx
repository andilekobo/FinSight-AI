import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";

type Feedback = { kind: "info" | "error"; message: string } | null;

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

    try {
      const response = await fetch(isRegister ? "/auth/register" : "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = result?.detail;
        const message =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((item: { msg?: string }) => item.msg ?? "").filter(Boolean).join(" ")
              : isRegister
                ? "Registration failed. Check your details and try again."
                : "Login failed. Check your email and password.";

        setFeedback({ kind: "error", message });
        return;
      }

      if (isRegister) {
        navigate("/login", { replace: true, state: { registered: true } });
        return;
      }

      if (typeof result?.access_token !== "string" || !result.access_token) {
        setFeedback({
          kind: "error",
          message: "The API did not return an access token. Please try again.",
        });
        return;
      }

      localStorage.setItem("finsight_access_token", result.access_token);
      navigate("/dashboard", { replace: true });
    } catch {
      setFeedback({
        kind: "error",
        message: "Could not reach the API. Check that the backend is running.",
      });
    } finally {
      setLoading(false);
    }
  }

  function showRecoveryMessage() {
    setFeedback({
      kind: "info",
      message: "Password recovery is not enabled in this preview.",
    });
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
              <div className="auth-preview-label"><span className="auth-preview-icon"><WalletCards size={15} /></span><span>Net worth</span></div>
              <span className="auth-preview-period">This year <ArrowUpRight size={12} /></span>
            </div>
            <div className="auth-preview-value">$248,560<span>.40</span></div>
            <div className="auth-preview-growth"><TrendingUp size={12} /> 12.8% <span>vs. last month</span></div>
            <div className="auth-chart">
              <div className="auth-chart-grid"><i /><i /><i /></div>
              <svg viewBox="0 0 520 92" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="auth-chart-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#62e2ad" stopOpacity=".25" />
                    <stop offset="100%" stopColor="#62e2ad" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="auth-chart-area" d="M0,74 C26,70 34,53 62,60 S100,72 126,48 S164,54 190,40 S226,51 254,32 S294,45 324,28 S358,42 387,21 S430,37 458,15 S493,25 520,5 V92 H0Z" />
                <path className="auth-chart-line" d="M0,74 C26,70 34,53 62,60 S100,72 126,48 S164,54 190,40 S226,51 254,32 S294,45 324,28 S358,42 387,21 S430,37 458,15 S493,25 520,5" />
              </svg>
              <div className="auth-chart-months"><span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>NOV</span></div>
            </div>
            <div className="auth-preview-note"><span><i /> Your financial picture is looking healthy</span><ArrowRight size={14} /></div>
          </div>

          <div className="auth-trust-row">
            <span><Check size={13} /> One clear view</span>
            <span><Check size={13} /> Smarter decisions</span>
            <span><Check size={13} /> Built around you</span>
          </div>
        </div>
        <div className="auth-story-footer"><span>© 2025 FinSight AI</span><span className="auth-footer-dot" /> A more thoughtful way to manage money</div>
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
                <button className="auth-text-button" type="button" onClick={showRecoveryMessage}>Forgot password?</button>
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
          <span className="auth-rating"><span>★★★★★</span> Made for clarity</span>
        </div>
      </section>
    </main>
  );
}
