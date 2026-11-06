import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Package, Truck, MapPin, ArrowRight, Smartphone, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ordersApi } from "@/api/orders";
import { parsePrice } from "@/data/products";

export default function Confirmation() {
  const { order, updateOrder } = useCart();
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [verified, setVerified] = useState(!!order?.phoneVerified);

  if (!order) {
    return (
      <section className="max-w-[1600px] mx-auto px-8 py-20 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-6">No order found. Please place an order first.</p>
          <Link to="/collection" className="btn-ink btn-ink-hover">
            Browse Collection
          </Link>
        </div>
      </section>
    );
  }

  const canVerifyOtp =
    typeof order.id === "string" &&
    order.id.startsWith("order-") &&
    (order.shipping?.phone || "").replace(/\D/g, "").length >= 7;

  const sendOtp = async () => {
    setOtpError("");
    setOtpLoading(true);
    try {
      const res = await ordersApi.requestConfirmOtp(order.id);
      setDevOtp(res.developmentOtp || "");
      setOtpSent(true);
    } catch (err) {
      setOtpError(err?.message || "Could not send the OTP. Please try again.");
    }
    setOtpLoading(false);
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (otp.length !== 6) return setOtpError("Enter the 6-digit code");
    setOtpError("");
    setOtpLoading(true);
    try {
      await ordersApi.verifyConfirmOtp(order.id, otp);
      setVerified(true);
      updateOrder({ phoneVerified: true });
    } catch (err) {
      setOtpError(err?.message || "The OTP is invalid.");
    }
    setOtpLoading(false);
  };

  const paymentDescription = () => {
    const method = order.payment?.method || "card";
    if (method === "card") return `Card ending in ${order.payment?.cardNumber?.replace(/\s/g, "").slice(-4) || "****"}`;
    if (method === "upi") return `UPI: ${order.payment?.upiId || "Verified"}`;
    if (method === "paypal") return "PayPal";
    if (method === "klarna") return "Klarna";
    return "Payment confirmed";
  };

  const formatOrderDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDeliveryDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="max-w-[1600px] mx-auto px-8 py-16 min-h-[70vh]">
      {/* Success header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 rounded-full bg-ink text-cream flex items-center justify-center mx-auto mb-6"
        >
          <Check className="w-7 h-7" />
        </motion.div>
        <h1 className="text-display text-4xl md:text-5xl mb-4">
          Order <em className="text-crimson">Confirmed</em>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Thank you for your purchase. Your order has been placed and is being
          prepared with care in our atelier.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-10 max-w-4xl mx-auto">
        {/* Order details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          {/* Order ID */}
          <div className="border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                  Order Number
                </div>
                <div className="font-serif text-xl">{order.id}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                  Date
                </div>
                <div className="text-sm">{formatOrderDate(order.date)}</div>
              </div>
            </div>
          </div>

          {/* Phone verification */}
          {canVerifyOtp && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="border border-border p-6 mb-6"
            >
              {verified ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-ink text-cream flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Phone Verified</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {order.shipping.phone} has been confirmed for this order.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3 mb-4">
                    <Smartphone className="w-4 h-4 text-crimson mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium">Verify Your Phone</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Confirm the booking by entering the 6-digit code sent to {order.shipping.phone}.
                      </div>
                    </div>
                  </div>

                  {otpSent ? (
                    <form onSubmit={verifyOtp} className="flex flex-col gap-3">
                      <input
                        autoFocus
                        inputMode="numeric"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        className="w-full border border-border px-4 py-3 text-sm text-center tracking-[0.4em] focus:outline-none focus:border-foreground transition-colors"
                      />
                      {devOtp && (
                        <p className="text-[10px] text-muted-foreground">Development OTP: <strong>{devOtp}</strong></p>
                      )}
                      {otpError && <p className="text-[11px] text-crimson">{otpError}</p>}
                      <div className="flex items-center gap-4">
                        <button
                          type="submit"
                          disabled={otpLoading}
                          className="bg-ink text-cream px-6 py-3 text-[11px] tracking-[0.2em] uppercase hover:bg-crimson transition-colors disabled:opacity-60"
                        >
                          {otpLoading ? "Verifying…" : "Verify OTP"}
                        </button>
                        <button
                          type="button"
                          onClick={() => sendOtp()}
                          disabled={otpLoading}
                          className="text-[11px] tracking-wider uppercase text-muted-foreground hover:text-foreground underline"
                        >
                          Resend code
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {otpError && <p className="text-[11px] text-crimson mb-3">{otpError}</p>}
                      <button
                        onClick={sendOtp}
                        disabled={otpLoading}
                        className="w-full border border-foreground py-3 text-[11px] tracking-[0.25em] uppercase hover:bg-ink hover:text-cream transition-colors disabled:opacity-60"
                      >
                        {otpLoading ? "Sending…" : "Send OTP"}
                      </button>
                    </>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Timeline */}
          <div className="border border-border p-6 mb-6">
            <div className="text-[10px] tracking-[0.2em] uppercase font-medium mb-6">
              Order Timeline
            </div>
            <div className="flex flex-col gap-6">
              {[
                { icon: Check, label: "Order Confirmed", sub: "Your order has been received", done: true },
                { icon: Package, label: "Preparing", sub: "Being handcrafted in our atelier", done: false },
                { icon: Truck, label: "Shipped", sub: "Estimated 2-3 business days", done: false },
                { icon: MapPin, label: "Delivered", sub: formatDeliveryDate(order.estimatedDelivery), done: false },
              ].map((step, i) => (
                <div key={step.label} className="flex items-start gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      step.done
                        ? "bg-ink text-cream"
                        : "border border-border text-muted-foreground"
                    }`}
                  >
                    <step.icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${step.done ? "" : "text-muted-foreground"}`}>
                      {step.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {step.sub}
                    </div>
                  </div>
                  {i < 3 && (
                    <div
                      className={`w-px h-6 ml-[-1px] ${
                        step.done ? "bg-ink" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="border border-border p-6">
            <div className="text-[10px] tracking-[0.2em] uppercase font-medium mb-4">
              Items Ordered
            </div>
            <div className="flex flex-col gap-4">
              {order.items.map((item) => (
                <div key={item.name} className="flex items-center gap-4">
                  <div className="w-16 h-20 bg-secondary overflow-hidden shrink-0">
                    {item.img && (
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-contain p-1"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-serif text-sm">{item.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Qty: {item.qty}{item.selectedSize && ` · Size: ${item.selectedSize}`}{item.selectedColor && ` · ${item.selectedColor}`}
                    </div>
                  </div>
                  <span className="font-serif text-sm">
                    {parsePrice(typeof item.price === "number" ? item.price * item.qty : parseFloat(String(item.price).replace("€", "").replace(",", "")) * item.qty)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col gap-6"
        >
          {/* Total */}
          <div className="border border-border p-6">
            <div className="text-[10px] tracking-[0.2em] uppercase font-medium mb-4">
              Total Paid
            </div>
            <div className="font-serif text-3xl mb-2">{parsePrice(order.total)}</div>
            <div className="text-[10px] text-muted-foreground">{paymentDescription()}</div>
          </div>

          {/* Shipping */}
          <div className="border border-border p-6">
            <div className="text-[10px] tracking-[0.2em] uppercase font-medium mb-4">
              Shipping To
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              {order.shipping.firstName} {order.shipping.lastName}<br />
              {order.shipping.address}<br />
              {order.shipping.city}, {order.shipping.zip}<br />
              {order.shipping.country}
              {order.shipping.phone && (
                <>
                  <br />
                  {order.shipping.phone}
                </>
              )}
            </div>
          </div>

          {/* Estimated delivery */}
          <div className="border border-border p-6">
            <div className="text-[10px] tracking-[0.2em] uppercase font-medium mb-4">
              Estimated Delivery
            </div>
            <div className="font-serif text-lg text-crimson">{formatDeliveryDate(order.estimatedDelivery)}</div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Free express shipping
            </div>
          </div>

          {/* Continue */}
          <Link
            to="/collection"
            className="flex items-center justify-center gap-2 bg-ink text-cream py-4 text-[11px] tracking-[0.25em] uppercase hover:bg-crimson transition-colors"
          >
            Continue Shopping <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
