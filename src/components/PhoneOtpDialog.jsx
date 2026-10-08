import { useState } from "react";
import { Smartphone, X, Mail, Lock, User, Phone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/api/auth";

export default function PhoneOtpDialog({ open, onClose, onAuthenticated }) {
  const { loginWithPhoneOtp, login } = useAuth();
  const [mode, setMode] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Email sign-in
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Details for a newly created phone account
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");

  if (!open) return null;

  const sendOtp = async (event) => {
    event.preventDefault();
    setError("");
    if (phone.replace(/\D/g, "").length < 7) return setError("Enter a valid phone number.");
    setLoading(true);
    try {
      await authApi.requestPhoneOtp(phone);
    } catch (err) {
      setLoading(false);
      setError(err?.message || "Could not send the OTP. Please try again.");
      return;
    }
    setLoading(false);
    setSent(true);
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await loginWithPhoneOtp(phone, otp, { firstName, lastName, email: accountEmail });
    setLoading(false);
    if (!result.success) return setError(result.error || "The OTP is invalid.");
    setSent(false);
    setOtp("");
    setFirstName("");
    setLastName("");
    setAccountEmail("");
    onAuthenticated();
  };

  const signInWithEmail = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) return setError(result.error || "Invalid email or password.");
    onAuthenticated();
  };

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setSent(false);
    setOtp("");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-foreground/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background border border-border p-7 shadow-xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>

        <Smartphone className="text-crimson mb-4" />
        <h2 className="font-serif text-2xl">Sign in</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          Verify to save favourites or continue to checkout.
        </p>

        {/* Mode tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            type="button"
            onClick={() => switchMode("phone")}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs tracking-wider uppercase border transition-colors ${
              mode === "phone" ? "bg-ink text-cream border-ink" : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone size={13} /> Phone OTP
          </button>
          <button
            type="button"
            onClick={() => switchMode("email")}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs tracking-wider uppercase border transition-colors ${
              mode === "email" ? "bg-ink text-cream border-ink" : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail size={13} /> Email
          </button>
        </div>

        {mode === "email" ? (
          <form onSubmit={signInWithEmail} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-border pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-border pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-crimson">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-ink w-full justify-center disabled:opacity-60"
            >
              {loading ? "Please wait…" : "Sign In"}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              New here? Use Phone OTP to create an account instantly.
            </p>
          </form>
        ) : (
          <form onSubmit={sent ? verifyOtp : sendOtp} className="space-y-4">
            <input
              autoFocus
              value={sent ? otp : phone}
              onChange={(e) => (sent ? setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)) : setPhone(e.target.value))}
              placeholder={sent ? "Enter 6-digit OTP" : "+91 98765 43210"}
              inputMode={sent ? "numeric" : "tel"}
              className="w-full border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
            />

            {sent && (
              <>
                <p className="text-xs text-muted-foreground">Development OTP: <strong>123456</strong></p>
                <div className="border-t border-border/40 pt-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                    New customer? Add your details (used when creating your account)
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="w-full border border-border/60 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full border border-border/60 px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                    />
                  </div>
                  <input
                    type="email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full border border-border/60 px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                  />
                </div>
              </>
            )}

            {error && <p className="text-sm text-crimson">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-ink w-full justify-center disabled:opacity-60"
            >
              {loading ? "Please wait…" : sent ? "Verify OTP" : "Send OTP"}
            </button>
            {sent && (
              <button
                type="button"
                onClick={() => { setSent(false); setOtp(""); }}
                className="mt-4 text-xs underline text-muted-foreground"
              >
                Use another phone number
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
