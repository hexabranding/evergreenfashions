import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CreditCard, Lock, ArrowLeft, Check, AlertCircle, Smartphone } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { parsePrice } from "@/data/products";

const steps = ["Shipping", "Payment", "Review"];

function formatPrice(val) {
  if (typeof val === "number") return parsePrice(val);
  return val;
}

export default function Checkout() {
  const { cartItems, cartSubtotal, cartTotal, placeOrder, coupon, discount, freeShipping } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [shipping, setShipping] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    country: "France",
  });
  const [payment, setPayment] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    method: "card",
    upiId: "",
  });

  if (cartItems.length === 0 && step === 0) {
    return (
      <section className="max-w-[1600px] mx-auto px-8 py-20 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-6">Your cart is empty.</p>
          <Link to="/collection" className="btn-ink btn-ink-hover">
            Browse Collection
          </Link>
        </div>
      </section>
    );
  }

  const validateShipping = () => {
    const e = {};
    if (!shipping.firstName.trim()) e.firstName = "Required";
    if (!shipping.lastName.trim()) e.lastName = "Required";
    if (!shipping.email.trim() || !shipping.email.includes("@")) e.email = "Valid email required";
    if (!shipping.address.trim()) e.address = "Required";
    if (!shipping.city.trim()) e.city = "Required";
    if (!shipping.zip.trim()) e.zip = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePayment = () => {
    const e = {};
    if (payment.method === "card") {
      if (!payment.cardName.trim()) e.cardName = "Required";
      if (!payment.cardNumber.trim() || payment.cardNumber.replace(/\s/g, "").length < 16) e.cardNumber = "Valid card number required";
      if (!payment.expiry.trim() || payment.expiry.length < 5) e.expiry = "Required";
      if (!payment.cvv.trim() || payment.cvv.length < 3) e.cvv = "Required";
    }
    if (payment.method === "upi") {
      if (!payment.upiId.trim() || !payment.upiId.includes("@")) e.upiId = "Valid UPI ID required (e.g. name@upi)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goToPayment = () => {
    if (validateShipping()) {
      setErrors({});
      setStep(1);
    }
  };

  const goToReview = () => {
    if (validatePayment()) {
      setErrors({});
      setStep(2);
    }
  };

  const handlePlaceOrder = () => {
    placeOrder(shipping, payment);
    navigate("/confirmation");
  };

  const inputClass = (field) =>
    `w-full border px-4 py-3 text-sm focus:outline-none transition-colors ${
      errors[field] ? "border-crimson focus:border-crimson" : "border-border focus:border-foreground"
    }`;

  const paymentLabel = () => {
    if (payment.method === "card") return `Credit Card •••• ${payment.cardNumber.replace(/\s/g, "").slice(-4) || "****"}`;
    if (payment.method === "upi") return `UPI • ${payment.upiId || "****"}`;
    return payment.method.charAt(0).toUpperCase() + payment.method.slice(1);
  };

  return (
    <section className="max-w-[1600px] mx-auto px-8 py-12 min-h-[70vh]">
      <button
        onClick={() => (step > 0 ? setStep(step - 1) : navigate(-1))}
        className="flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors mb-10"
      >
        <ArrowLeft className="w-3 h-3" />
        {step > 0 ? "Back" : "Return"}
      </button>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-4 mb-12">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-4">
                <button
                  onClick={() => { if (i < step) setStep(i); }}
                  className={`flex items-center gap-2 ${i < step ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium border transition-colors ${
                    i < step ? "bg-ink text-cream border-ink" : i === step ? "border-foreground text-foreground bg-foreground/5" : "border-border text-muted-foreground"
                  }`}>
                    {i < step ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className={`text-xs tracking-wider uppercase ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
                </button>
                {i < steps.length - 1 && <div className={`w-12 h-px transition-colors ${i < step ? "bg-ink" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="shipping" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                <h2 className="font-serif text-2xl mb-2">Shipping Details</h2>
                <p className="text-[11px] text-muted-foreground mb-8">Fill in all fields to continue</p>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">First Name <span className="text-crimson">*</span></label>
                    <input type="text" value={shipping.firstName} onChange={(e) => setShipping({ ...shipping, firstName: e.target.value })} className={inputClass("firstName")} />
                    {errors.firstName && <p className="text-[10px] text-crimson mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Last Name <span className="text-crimson">*</span></label>
                    <input type="text" value={shipping.lastName} onChange={(e) => setShipping({ ...shipping, lastName: e.target.value })} className={inputClass("lastName")} />
                    {errors.lastName && <p className="text-[10px] text-crimson mt-1">{errors.lastName}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Email <span className="text-crimson">*</span></label>
                    <input type="email" value={shipping.email} onChange={(e) => setShipping({ ...shipping, email: e.target.value })} className={inputClass("email")} />
                    {errors.email && <p className="text-[10px] text-crimson mt-1">{errors.email}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Address <span className="text-crimson">*</span></label>
                    <input type="text" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} className={inputClass("address")} />
                    {errors.address && <p className="text-[10px] text-crimson mt-1">{errors.address}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">City <span className="text-crimson">*</span></label>
                    <input type="text" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} className={inputClass("city")} />
                    {errors.city && <p className="text-[10px] text-crimson mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Postal Code <span className="text-crimson">*</span></label>
                    <input type="text" value={shipping.zip} onChange={(e) => setShipping({ ...shipping, zip: e.target.value })} className={inputClass("zip")} />
                    {errors.zip && <p className="text-[10px] text-crimson mt-1">{errors.zip}</p>}
                  </div>
                </div>
                {Object.keys(errors).length > 0 && (
                  <div className="flex items-center gap-2 mt-4 text-[11px] text-crimson"><AlertCircle className="w-3.5 h-3.5" /> Please fill in all required fields</div>
                )}
                <button onClick={goToPayment} className="mt-8 bg-ink text-cream px-10 py-4 text-[11px] tracking-[0.25em] uppercase hover:bg-crimson transition-colors">Continue to Payment</button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="payment" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                <h2 className="font-serif text-2xl mb-2">Payment Method</h2>
                <p className="text-[11px] text-muted-foreground mb-8">Select and fill in your payment details</p>

                <div className="flex gap-3 mb-8 flex-wrap">
                  {[
                    { id: "card", label: "Credit Card" },
                    { id: "paypal", label: "PayPal" },
                    { id: "klarna", label: "Klarna" },
                    { id: "upi", label: "UPI" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setPayment({ ...payment, method: m.id }); setErrors({}); }}
                      className={`px-5 py-3 text-[11px] tracking-wider uppercase border transition-colors flex items-center gap-2 ${
                        payment.method === m.id ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
                      }`}
                    >
                      {m.id === "upi" && <Smartphone className="w-3.5 h-3.5" />}
                      {m.label}
                    </button>
                  ))}
                </div>

                {payment.method === "card" && (
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Name on Card <span className="text-crimson">*</span></label>
                      <input type="text" value={payment.cardName} onChange={(e) => setPayment({ ...payment, cardName: e.target.value })} className={inputClass("cardName")} />
                      {errors.cardName && <p className="text-[10px] text-crimson mt-1">{errors.cardName}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Card Number <span className="text-crimson">*</span></label>
                      <div className="relative">
                        <input type="text" value={payment.cardNumber} onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })} placeholder="1234 5678 9012 3456" maxLength={19} className={`${inputClass("cardNumber")} pr-12`} />
                        <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                      {errors.cardNumber && <p className="text-[10px] text-crimson mt-1">{errors.cardNumber}</p>}
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Expiry <span className="text-crimson">*</span></label>
                      <input type="text" value={payment.expiry} onChange={(e) => setPayment({ ...payment, expiry: e.target.value })} placeholder="MM / YY" maxLength={7} className={inputClass("expiry")} />
                      {errors.expiry && <p className="text-[10px] text-crimson mt-1">{errors.expiry}</p>}
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">CVV <span className="text-crimson">*</span></label>
                      <div className="relative">
                        <input type="text" value={payment.cvv} onChange={(e) => setPayment({ ...payment, cvv: e.target.value })} placeholder="123" maxLength={4} className={`${inputClass("cvv")} pr-10`} />
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      {errors.cvv && <p className="text-[10px] text-crimson mt-1">{errors.cvv}</p>}
                    </div>
                  </div>
                )}

                {payment.method === "paypal" && (
                  <div className="border border-border p-8 text-center text-muted-foreground text-sm">
                    You will be redirected to PayPal to complete your payment.
                  </div>
                )}

                {payment.method === "klarna" && (
                  <div className="border border-border p-8 text-center text-muted-foreground text-sm">
                    Pay in 4 interest-free installments. You will be redirected to Klarna.
                  </div>
                )}

                {payment.method === "upi" && (
                  <div className="border border-border p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-foreground/5 rounded-full flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-foreground" />
                      </div>
                      <div>
                        <div className="font-serif text-lg">Pay via UPI</div>
                        <div className="text-[11px] text-muted-foreground">Instant bank transfer via UPI apps</div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">
                        UPI ID <span className="text-crimson">*</span>
                      </label>
                      <input
                        type="text"
                        value={payment.upiId}
                        onChange={(e) => setPayment({ ...payment, upiId: e.target.value })}
                        placeholder="yourname@upi"
                        className={inputClass("upiId")}
                      />
                      {errors.upiId && <p className="text-[10px] text-crimson mt-1">{errors.upiId}</p>}
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Supported: Google Pay, PhonePe, Paytm, BHIM, Amazon Pay
                      </p>
                    </div>
                    <div className="bg-secondary/50 border border-border p-6 text-center">
                      <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Or scan QR code</div>
                      <div className="w-40 h-40 mx-auto bg-background border border-border flex items-center justify-center">
                        <div className="text-center">
                          <div className="grid grid-cols-5 gap-1 mb-2">
                            {Array.from({ length: 25 }).map((_, i) => (
                              <div key={i} className={`w-3 h-3 ${Math.random() > 0.4 ? "bg-foreground" : "bg-background border border-border"}`} />
                            ))}
                          </div>
                          <div className="text-[8px] text-muted-foreground tracking-wider">SCAN TO PAY</div>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3">
                        Open any UPI app and scan this code to pay {formatPrice(cartTotal)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-6 text-[10px] text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Your payment is encrypted and secure.</span>
                </div>

                {Object.keys(errors).length > 0 && (
                  <div className="flex items-center gap-2 mt-4 text-[11px] text-crimson"><AlertCircle className="w-3.5 h-3.5" /> Please fill in all required fields</div>
                )}

                <button onClick={goToReview} className="mt-8 bg-ink text-cream px-10 py-4 text-[11px] tracking-[0.25em] uppercase hover:bg-crimson transition-colors">Review Order</button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="review" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                <h2 className="font-serif text-2xl mb-2">Review Your Order</h2>
                <p className="text-[11px] text-muted-foreground mb-8">Check everything before placing your order</p>

                <div className="border border-border p-6 mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] tracking-[0.2em] uppercase font-medium">Shipping</span>
                    <button onClick={() => setStep(0)} className="text-[10px] tracking-wider uppercase text-crimson hover:underline">Edit</button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {shipping.firstName} {shipping.lastName}<br />
                    {shipping.address}<br />
                    {shipping.city}, {shipping.zip}<br />
                    {shipping.email}
                  </p>
                </div>

                <div className="border border-border p-6 mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] tracking-[0.2em] uppercase font-medium">Payment</span>
                    <button onClick={() => setStep(1)} className="text-[10px] tracking-wider uppercase text-crimson hover:underline">Edit</button>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">{paymentLabel()}</p>
                </div>

                <div className="border border-border p-6 mb-8">
                  <span className="text-[10px] tracking-[0.2em] uppercase font-medium block mb-4">Items</span>
                  <div className="flex flex-col gap-4">
                    {cartItems.map((item) => (
                      <div key={item.name} className="flex items-center gap-4">
                        <div className="w-16 h-20 bg-secondary overflow-hidden shrink-0">
                          {item.img && <img src={item.img} alt={item.name} className="w-full h-full object-contain p-1" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-serif text-sm">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground">Qty: {item.qty}</div>
                          {item.isRental && item.rentalDetails && (
                            <div className="text-[10px] text-crimson">
                              Rental · {item.rentalDetails.rentalDays} days
                            </div>
                          )}
                          {(item.selectedSize || item.selectedColor) && (
                            <div className="text-[10px] text-muted-foreground">
                              {item.selectedColor && `Color: ${item.selectedColor}`}
                              {item.selectedColor && item.selectedSize && " · "}
                              {item.selectedSize && `Size: ${item.selectedSize}`}
                            </div>
                          )}
                        </div>
                        <span className="font-serif text-sm">
                          {item.isRental && item.rentalDetails
                            ? formatPrice(item.rentalDetails.rentalPricePerDay * item.rentalDetails.rentalDays * item.qty)
                            : formatPrice((typeof item.price === "number" ? item.price : parseFloat(String(item.price).replace("€", "").replace(",", ""))) * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handlePlaceOrder} className="w-full bg-crimson text-cream py-4 text-[11px] tracking-[0.25em] uppercase hover:bg-crimson/80 transition-colors">
                  Place Order — {formatPrice(cartTotal)}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="border border-border p-8 h-fit sticky top-32">
          <h3 className="font-serif text-xl mb-6">Order Summary</h3>
          <div className="flex flex-col gap-3 mb-6">
            {cartItems.map((item) => (
              <div key={`${item.name}-${item.selectedSize || ""}-${item.selectedColor || ""}`} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate mr-3">{item.name} × {item.qty}</span>
                <span>
                  {item.isRental && item.rentalDetails
                    ? formatPrice(item.rentalDetails.rentalPricePerDay * item.rentalDetails.rentalDays * item.qty)
                    : formatPrice((typeof item.price === "number" ? item.price : parseFloat(String(item.price).replace("€", "").replace(",", ""))) * item.qty)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-crimson">{freeShipping ? "Free (Coupon)" : "Free"}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-crimson">
                <span>Discount ({coupon?.code})</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-serif text-lg mt-2 pt-2 border-t border-border">
              <span>Total</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
