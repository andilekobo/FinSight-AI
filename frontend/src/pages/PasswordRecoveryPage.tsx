import { createContext, useContext, useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";

type PasswordRecoveryContextValue = {
  email: string;
  setEmail: (email: string) => void;
};

const PasswordRecoveryContext = createContext<PasswordRecoveryContextValue | null>(null);

export function PasswordRecoveryProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");

  return (
    <PasswordRecoveryContext.Provider value={{ email, setEmail }}>
      {children}
    </PasswordRecoveryContext.Provider>
  );
}

function usePasswordRecovery() {
  const context = useContext(PasswordRecoveryContext);
  if (!context) throw new Error("Password recovery pages must be rendered inside PasswordRecoveryProvider.");
  return context;
}

function RecoveryShell({ children }: { children: ReactNode }) {
  return (
    <main className="recovery-page">
      <div className="recovery-glow recovery-glow-one" />
      <div className="recovery-glow recovery-glow-two" />
      <section className="recovery-card">
        <Link to="/login" className="recovery-brand" aria-label="FinSight AI sign in">
          <span className="recovery-brand-mark"><Activity size={19} strokeWidth={2.6} /></span>
          <span>FinSight<span> AI</span></span>
        </Link>
        {children}
        <p className="recovery-footer"><LockKeyhole size={13} /> Your information stays private and secure.</p>
      </section>
    </main>
  );
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { email, setEmail } = usePasswordRecovery();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((timerId) => window.clearTimeout(timerId)), []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const enteredEmail = String(formData.get("email") ?? "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enteredEmail)) {
      setError("Enter a valid email address to continue.");
      setSuccess(false);
      return;
    }

    setError("");
    setEmail(enteredEmail);
    setLoading(true);
    timers.current.push(window.setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      timers.current.push(window.setTimeout(() => navigate("/verification-code"), 900));
    }, 450));
  }

  return (
    <RecoveryShell>
      <div className="recovery-heading-icon"><Mail size={19} /></div>
      <p className="recovery-eyebrow">ACCOUNT RECOVERY</p>
      <h1>Forgot your password?</h1>
      <p className="recovery-description">Enter the email address associated with your account. We’ll guide you through the next steps.</p>

      <form className="recovery-form" onSubmit={handleSubmit} noValidate>
        <label className="recovery-label" htmlFor="recovery-email">Email address</label>
        <div className="recovery-input-wrap">
          <Mail size={17} aria-hidden="true" />
          <input
            id="recovery-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={email}
            onChange={() => {
              setError("");
              setSuccess(false);
            }}
            required
          />
        </div>
        {error && <p className="recovery-message recovery-message-error" role="alert">{error}</p>}
        {success && (
          <p className="recovery-message recovery-message-success" role="status" aria-live="polite">
            <Check size={15} /> Email looks good. Backend email delivery will be connected later.
          </p>
        )}
        <p className="recovery-note">This frontend prototype does not send an email. Backend email delivery will be connected later.</p>
        <button className="recovery-submit" type="submit" disabled={loading || success}>
          {loading ? <><span className="recovery-spinner" /> Checking email...</> : <>Send Verification Code <ArrowRight size={16} /></>}
        </button>
      </form>

      <Link to="/login" className="recovery-back-link"><ArrowLeft size={15} /> Back to login</Link>
    </RecoveryShell>
  );
}

export function VerificationCodePage() {
  const navigate = useNavigate();
  const { email } = usePasswordRecovery();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendNotice, setResendNotice] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [secondsLeft]);

  useEffect(() => () => {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
  }, []);

  function setDigit(index: number, value: string) {
    setDigits((current) => current.map((digit, position) => position === index ? value : digit));
    setError("");
  }

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < inputRefs.current.length - 1) inputRefs.current[index + 1]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const nextDigits = Array.from({ length: 6 }, (_, index) => pasted[index] ?? "");
    setDigits(nextDigits);
    setError("");
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      setDigit(index - 1, "");
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (digits.some((digit) => !digit)) {
      setError("That code is incomplete. Enter all six digits to continue.");
      inputRefs.current[digits.findIndex((digit) => !digit)]?.focus();
      return;
    }

    setError("");
    setLoading(true);
    timer.current = window.setTimeout(() => navigate("/reset-password"), 500);
  }

  function handleResend() {
    setSecondsLeft(30);
    setResendNotice("No email was sent. Backend email delivery will be connected later.");
    setError("");
  }

  return (
    <RecoveryShell>
      <div className="recovery-heading-icon"><ShieldCheck size={19} /></div>
      <p className="recovery-eyebrow">VERIFY YOUR EMAIL</p>
      <h1>Enter your code</h1>
      <p className="recovery-description">
        Enter the six-digit verification code for <strong>{email || "your email address"}</strong>.
      </p>

      <form className="recovery-form" onSubmit={handleVerify}>
        <fieldset className="code-fieldset">
          <legend className="recovery-label">Verification code</legend>
          <div className="code-inputs" role="group" aria-label="Six-digit verification code">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { inputRefs.current[index] = element; }}
                aria-label={`Digit ${index + 1}`}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(event) => handleChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
              />
            ))}
          </div>
        </fieldset>
        {error && <p className="recovery-message recovery-message-error" role="alert">{error}</p>}
        {resendNotice && <p className="recovery-message recovery-message-info" role="status" aria-live="polite">{resendNotice}</p>}
        <p className="recovery-note">Prototype only: this code is not checked against a server, and no email has been sent.</p>
        <button className="recovery-submit" type="submit" disabled={loading}>
          {loading ? <><span className="recovery-spinner" /> Continuing...</> : <>Continue <ArrowRight size={16} /></>}
        </button>
      </form>

      <div className="resend-row">
        <span>Didn’t receive a code?</span>
        <button type="button" className="recovery-text-button" onClick={handleResend} disabled={secondsLeft > 0}>
          {secondsLeft > 0 ? `Resend in 0:${String(secondsLeft).padStart(2, "0")}` : "Resend code"}
        </button>
      </div>
      <Link to="/forgot-password" className="recovery-back-link"><ArrowLeft size={15} /> Back to email</Link>
    </RecoveryShell>
  );
}

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
  }, []);

  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const strengthLabels = ["Enter a password", "Weak", "Fair", "Good", "Strong"];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Use at least 8 characters, including a letter and a number.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Your passwords don’t match yet.");
      return;
    }

    setError("");
    setLoading(true);
    timer.current = window.setTimeout(() => {
      setPassword("");
      setConfirmPassword("");
      setLoading(false);
      setSuccess(true);
    }, 550);
  }

  return (
    <RecoveryShell>
      <div className="recovery-heading-icon"><Sparkles size={19} /></div>
      <p className="recovery-eyebrow">CREATE A NEW PASSWORD</p>
      <h1>Make it a strong one.</h1>
      <p className="recovery-description">Choose a new password to finish this frontend recovery prototype.</p>

      {success ? (
        <div className="reset-success" role="status" aria-live="polite">
          <div className="reset-success-icon"><Check size={20} /></div>
          <h2>Password reset successfully.</h2>
          <p>Password reset successfully. Backend password reset integration will be connected later.</p>
          <Link to="/login" className="recovery-submit">Return to Login <ArrowRight size={16} /></Link>
        </div>
      ) : (
        <form className="recovery-form" onSubmit={handleSubmit}>
          <label className="recovery-label" htmlFor="new-password">New password</label>
          <div className="recovery-input-wrap">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => { setPassword(event.target.value); setError(""); }}
              required
            />
            <button className="recovery-visibility" type="button" aria-label={showPassword ? "Hide new password" : "Show new password"} onClick={() => setShowPassword((visible) => !visible)}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <div className="password-strength" aria-live="polite">
            <div className="password-strength-bars" aria-label={`Password strength: ${strengthLabels[strength]}`}>
              {[1, 2, 3, 4].map((level) => <span key={level} className={strength >= level ? `strength-level-${strength}` : ""} />)}
            </div>
            <span>{strengthLabels[strength]}</span>
          </div>
          <p className="password-requirement">At least 8 characters, including a letter and a number.</p>

          <label className="recovery-label" htmlFor="confirm-password">Confirm new password</label>
          <div className="recovery-input-wrap">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => { setConfirmPassword(event.target.value); setError(""); }}
              required
            />
            <button className="recovery-visibility" type="button" aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} onClick={() => setShowConfirmPassword((visible) => !visible)}>
              {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {confirmPassword && (
            <p className={`password-match ${password === confirmPassword ? "password-match-valid" : ""}`} aria-live="polite">
              {password === confirmPassword ? <><Check size={13} /> Passwords match</> : "Passwords do not match"}
            </p>
          )}
          {error && <p className="recovery-message recovery-message-error" role="alert">{error}</p>}
          <p className="recovery-note">Your password is used for local validation only. It is not sent or saved.</p>
          <button className="recovery-submit" type="submit" disabled={loading}>
            {loading ? <><span className="recovery-spinner" /> Updating...</> : <>Reset password <ArrowRight size={16} /></>}
          </button>
        </form>
      )}

      {!success && <Link to="/login" className="recovery-back-link"><ArrowLeft size={15} /> Return to login</Link>}
    </RecoveryShell>
  );
}
