

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CircleHelp,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MailOpen,
} from "lucide-react";
import {
  requestPasswordReset,
  resendPasswordResetCode,
  verifyPasswordResetCode,
  resetPassword,
} from "../data/api";

type PasswordRecoveryContextValue = {
  email: string;
  setEmail: (email: string) => void;
  resetToken: string;
  setResetToken: (token: string) => void;
};

const PasswordRecoveryContext =
  createContext<PasswordRecoveryContextValue | null>(null);

export function PasswordRecoveryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  return (
    <PasswordRecoveryContext.Provider
      value={{ email, setEmail, resetToken, setResetToken }}
    >
      {children}
    </PasswordRecoveryContext.Provider>
  );
}

function usePasswordRecovery() {
  const context = useContext(PasswordRecoveryContext);

  if (!context) {
    throw new Error(
      "Password recovery pages must be rendered inside PasswordRecoveryProvider.",
    );
  }

  return context;
}

function RecoveryShell({ children }: { children: ReactNode }) {
  return (
    <main className="recovery-page">
      <div className="recovery-glow recovery-glow-one" />
      <div className="recovery-glow recovery-glow-two" />

      <section className="recovery-card">
        <Link
          to="/login"
          className="recovery-brand"
          aria-label="FinSight AI sign in"
        >
          <span className="recovery-brand-mark">
            <Activity size={19} strokeWidth={2.6} />
          </span>
          <span>
            FinSight<span> AI</span>
          </span>
        </Link>

        {children}

        <p className="recovery-footer">
          <LockKeyhole size={13} />
          Your information stays private and secure.
        </p>
      </section>
    </main>
  );
}

function RecoveryIllustration({
  kind,
}: {
  kind: "forgot" | "verify" | "reset";
}) {
  const MainIcon = kind === "verify" ? MailOpen : LockKeyhole;

  return (
    <div
      className={`recovery-illustration recovery-illustration-${kind}`}
      aria-hidden="true"
    >
      <span className="recovery-illustration-orbit">
        <MainIcon
          size={kind === "verify" ? 52 : 48}
          strokeWidth={1.5}
        />
      </span>

      <span className="recovery-illustration-badge">
        {kind === "forgot" ? (
          <CircleHelp size={19} />
        ) : kind === "reset" ? (
          <BadgeCheck size={19} />
        ) : (
          <Mail size={19} />
        )}
      </span>
    </div>
  );
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { email, setEmail, setResetToken } = usePasswordRecovery();

  const [enteredEmail, setEnteredEmail] = useState(email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = enteredEmail.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email address to continue.");
      setSuccess(false);
      return;
    }

    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await requestPasswordReset(normalizedEmail);

      setEmail(normalizedEmail);
      setResetToken("");
      setSuccess(true);

      window.setTimeout(() => {
        navigate("/verification-code");
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not request a verification code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <RecoveryShell>
      <Link
        to="/login"
        className="recovery-back-control"
        aria-label="Back to sign in"
      >
        <ArrowLeft size={17} />
      </Link>

      <div className="recovery-heading">
        <RecoveryIllustration kind="forgot" />
        <p className="recovery-eyebrow">ACCOUNT RECOVERY</p>
        <h1>Forgot Password</h1>
        <p className="recovery-description">
          Enter your email address and we’ll guide you through secure
          verification to reset your password.
        </p>
      </div>

      <form className="recovery-form" onSubmit={handleSubmit} noValidate>
        <label className="recovery-label" htmlFor="recovery-email">
          Email Address
        </label>

        <div className="recovery-input-wrap">
          <Mail size={17} aria-hidden="true" />
          <input
            id="recovery-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={enteredEmail}
            onChange={(event) => {
              setEnteredEmail(event.target.value);
              setError("");
              setSuccess(false);
            }}
            required
          />
        </div>

        {error && (
          <p className="recovery-message recovery-message-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p
            className="recovery-message recovery-message-info"
            role="status"
            aria-live="polite"
          >
            If the account exists, a verification code has been requested.
            Check your email.
          </p>
        )}

        <Link to="/login" className="recovery-alternate-link">
          Try another way
        </Link>

        <button
          className="recovery-submit"
          type="submit"
          disabled={loading || success}
        >
          {loading ? (
            <>
              <span className="recovery-spinner" /> Sending...
            </>
          ) : success ? (
            <>
              Code Requested <Check size={16} />
            </>
          ) : (
            <>
              Send <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <Link to="/login" className="recovery-back-link">
        <ArrowLeft size={15} /> Back to login
      </Link>
    </RecoveryShell>
  );
}

export function VerificationCodePage() {
  const navigate = useNavigate();
  const { email, setResetToken } = usePasswordRecovery();

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [resendNotice, setResendNotice] = useState("");

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  function updateDigit(index: number, value: string) {
    setDigits((current) =>
      current.map((digit, position) =>
        position === index ? value : digit,
      ),
    );
    setError("");
  }

  function handleChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length > 1) {
      const nextDigits = [...digits];
      const available = 6 - index;
      const inserted = cleaned.slice(0, available);

      inserted.split("").forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });

      setDigits(nextDigits);
      setError("");
      inputRefs.current[Math.min(index + inserted.length, 5)]?.focus();
      return;
    }

    const digit = cleaned.slice(-1);
    updateDigit(index, digit);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    setDigits(
      Array.from({ length: 6 }, (_, index) => pasted[index] ?? ""),
    );
    setError("");

    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      updateDigit(index - 1, "");
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email) {
      navigate("/forgot-password");
      return;
    }

    if (digits.some((digit) => !digit)) {
      setError("Enter all six digits to continue.");
      const firstEmpty = digits.findIndex((digit) => !digit);
      inputRefs.current[firstEmpty]?.focus();
      return;
    }

    setError("");
    setResendNotice("");
    setLoading(true);

    try {
      const result = await verifyPasswordResetCode(email, digits.join(""));

      if (!result.reset_token) {
        throw new Error("The server did not return a reset token. Try again.");
      }

      setResetToken(result.reset_token);
      navigate("/reset-password");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Code verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      navigate("/forgot-password");
      return;
    }

    setError("");
    setResendNotice("");
    setResending(true);

    try {
      await resendPasswordResetCode(email);
      setDigits(["", "", "", "", "", ""]);
      setSecondsLeft(30);
      setResendNotice(
        "If the account exists, a new verification code has been requested.",
      );
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not resend the code. Please try again.",
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <RecoveryShell>
      <Link
        to="/forgot-password"
        className="recovery-back-control"
        aria-label="Back to forgot password"
      >
        <ArrowLeft size={17} />
      </Link>

      <div className="recovery-heading">
        <RecoveryIllustration kind="verify" />
        <p className="recovery-eyebrow">ACCOUNT RECOVERY</p>
        <h1>Verify Your Email</h1>
        <p className="recovery-description">
          Enter the six-digit code for{" "}
          <strong>{email || "your email address"}</strong>.
        </p>
      </div>

      <form className="recovery-form" onSubmit={handleVerify}>
        <fieldset className="code-fieldset">
          <legend className="recovery-label">Verification Code</legend>

          <div
            className="code-inputs"
            role="group"
            aria-label="Six-digit verification code"
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                aria-label={`Digit ${index + 1}`}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                onChange={(event) =>
                  handleChange(index, event.target.value)
                }
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
                required
              />
            ))}
          </div>
        </fieldset>

        {error && (
          <p className="recovery-message recovery-message-error" role="alert">
            {error}
          </p>
        )}

        {resendNotice && (
          <p
            className="recovery-message recovery-message-info"
            role="status"
            aria-live="polite"
          >
            {resendNotice}
          </p>
        )}

        <button
          className="recovery-submit"
          type="submit"
          disabled={loading || resending}
        >
          {loading ? (
            <>
              <span className="recovery-spinner" /> Verifying...
            </>
          ) : (
            <>
              Verify <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="resend-row">
        <span>Didn’t receive a code?</span>
        <button
          type="button"
          className="recovery-text-button"
          onClick={handleResend}
          disabled={secondsLeft > 0 || resending || loading}
        >
          {resending
            ? "Resending..."
            : secondsLeft > 0
              ? `Resend in 0:${String(secondsLeft).padStart(2, "0")}`
              : "Resend Code"}
        </button>
      </div>

      <Link to="/forgot-password" className="recovery-back-link">
        <ArrowLeft size={15} /> Back to email
      </Link>
    </RecoveryShell>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { resetToken, setResetToken } = usePasswordRecovery();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const strengthLabels = [
    "Enter a password",
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      setError("Use at least 8 characters, including a letter and a number.");
      return;
    }

    if (password.length > 128) {
      setError("Your password must not exceed 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords don’t match yet.");
      return;
    }

    if (!resetToken) {
      setError(
        "Your reset session is missing or expired. Please verify your email again.",
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      await resetPassword(resetToken, password);

      setPassword("");
      setConfirmPassword("");
      setResetToken("");
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <RecoveryShell>
      <Link
        to="/verification-code"
        className="recovery-back-control"
        aria-label="Back to email verification"
      >
        <ArrowLeft size={17} />
      </Link>

      <div className="recovery-heading">
        <RecoveryIllustration kind="reset" />
        <p className="recovery-eyebrow">ACCOUNT RECOVERY</p>
        <h1>Create New Password</h1>
        <p className="recovery-description">
          Use at least 8 characters, including a letter and a number.
        </p>
      </div>

      {success ? (
        <div className="reset-success" role="status" aria-live="polite">
          <div className="reset-success-icon">
            <Check size={20} />
          </div>
          <h2>Password updated</h2>
          <p>
            Your password has been changed successfully. You can now sign in
            with your new password.
          </p>
          <button
            type="button"
            className="recovery-submit"
            onClick={() => navigate("/login", { replace: true })}
          >
            Return to Login <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <form className="recovery-form" onSubmit={handleSubmit}>
          <label className="recovery-label" htmlFor="new-password">
            New Password
          </label>

          <div className="recovery-input-wrap">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              required
            />
            <button
              className="recovery-visibility"
              type="button"
              aria-label={
                showPassword ? "Hide new password" : "Show new password"
              }
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <div className="password-strength" aria-live="polite">
            <div
              className="password-strength-bars"
              aria-label={`Password strength: ${strengthLabels[strength]}`}
            >
              {[1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className={
                    strength >= level ? `strength-level-${strength}` : ""
                  }
                />
              ))}
            </div>
            <span>{strengthLabels[strength]}</span>
          </div>

          <p className="password-requirement">
            At least 8 characters, including a letter and a number.
          </p>

          <label className="recovery-label" htmlFor="confirm-password">
            Confirm Password
          </label>

          <div className="recovery-input-wrap">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError("");
              }}
              required
            />
            <button
              className="recovery-visibility"
              type="button"
              aria-label={
                showConfirmPassword
                  ? "Hide confirmation password"
                  : "Show confirmation password"
              }
              onClick={() =>
                setShowConfirmPassword((visible) => !visible)
              }
            >
              {showConfirmPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>
          </div>

          {confirmPassword && (
            <p
              className={`password-match ${
                password === confirmPassword ? "password-match-valid" : ""
              }`}
              aria-live="polite"
            >
              {password === confirmPassword ? (
                <>
                  <Check size={13} /> Passwords match
                </>
              ) : (
                "Passwords do not match"
              )}
            </p>
          )}

          {error && (
            <p className="recovery-message recovery-message-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="recovery-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="recovery-spinner" /> Saving...
              </>
            ) : (
              <>
                Save <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {!success && (
        <Link to="/login" className="recovery-back-link">
          <ArrowLeft size={15} /> Return to login
        </Link>
      )}
    </RecoveryShell>
  );
}
