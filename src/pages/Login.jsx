import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = login(email, password);
    setLoading(false);

    if (result.success) {
      const user = JSON.parse(localStorage.getItem("ef_currentUser"));
      if (user?.role === "vendor") navigate("/vendor");
      else if (user?.role === "admin") navigate("/admin");
      else navigate("/");
    } else {
      setError(result.error);
    }
  };

  const demoAccounts = [
    { role: "Admin", email: "admin@evergreen.com", password: "admin123" },
    { role: "Vendor", email: "vendor@evergreen.com", password: "vendor123" },
    { role: "Customer", email: "customer@evergreen.com", password: "customer123" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-6">
        <Link
          to="/"
          className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Home
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex items-center justify-center px-6 pb-20"
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <p className="eyebrow mb-4">— Welcome Back</p>
            <h1 className="text-display text-4xl md:text-5xl mb-4">
              Sign <em className="text-crimson">in.</em>
            </h1>
            <p className="text-muted-foreground text-sm">
              Access your Evergreen account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-crimson/10 border border-crimson/20 px-4 py-3 text-sm text-crimson">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="eyebrow">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-transparent border border-border px-10 py-3 text-sm focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="eyebrow">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent border border-border px-10 py-3 text-sm focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-crimson cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <button type="button" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-ink btn-ink-hover w-full justify-center group disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </form>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-foreground hover:text-crimson transition-colors underline underline-offset-4">
                Register
              </Link>
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="eyebrow text-center mb-4">— Demo Accounts</p>
            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                  }}
                  className="w-full text-left px-4 py-3 border border-border hover:border-foreground transition-colors text-sm group"
                >
                  <span className="font-serif">{acc.role}</span>
                  <span className="text-muted-foreground mx-2">·</span>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {acc.email} / {acc.password}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
