import { useState } from "react";
import { Smartphone, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/api/auth";

export default function PhoneOtpDialog({ open, onClose, onAuthenticated }) {
  const { loginWithPhoneOtp } = useAuth();
  const [phone, setPhone] = useState(""); const [otp, setOtp] = useState(""); const [sent, setSent] = useState(false); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  if (!open) return null;
  const sendOtp = async (event) => { event.preventDefault(); setError(""); if (phone.replace(/\D/g, "").length < 7) return setError("Enter a valid phone number."); setLoading(true); try { await authApi.requestPhoneOtp(phone); } catch {} setLoading(false); setSent(true); };
  const verifyOtp = async (event) => { event.preventDefault(); setError(""); setLoading(true); const result = await loginWithPhoneOtp(phone, otp); setLoading(false); if (!result.success) return setError(result.error || "The OTP is invalid."); onAuthenticated(); };
  return <div className="fixed inset-0 z-[100] bg-foreground/40 flex items-center justify-center p-4"><div className="w-full max-w-md bg-background border border-border p-7 shadow-xl relative"><button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground"><X size={18} /></button><Smartphone className="text-crimson mb-4" /><h2 className="font-serif text-2xl">Sign in with phone</h2><p className="text-sm text-muted-foreground mt-2 mb-6">Verify your number to save favourites or continue to checkout.</p><form onSubmit={sent ? verifyOtp : sendOtp} className="space-y-4"><input autoFocus value={sent ? otp : phone} onChange={(event) => sent ? setOtp(event.target.value.replace(/\D/g, "").slice(0, 6)) : setPhone(event.target.value)} placeholder={sent ? "Enter 6-digit OTP" : "+91 98765 43210"} inputMode={sent ? "numeric" : "tel"} className="w-full border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground" />{error && <p className="text-sm text-crimson">{error}</p>}{sent && <p className="text-xs text-muted-foreground">Development OTP: <strong>123456</strong></p>}<button disabled={loading} className="btn-ink w-full justify-center disabled:opacity-60">{loading ? "Please wait…" : sent ? "Verify OTP" : "Send OTP"}</button></form>{sent && <button onClick={() => { setSent(false); setOtp(""); }} className="mt-4 text-xs underline text-muted-foreground">Use another phone number</button>}</div></div>;
}
