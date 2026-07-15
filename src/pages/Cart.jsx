import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function Cart() {
  const { cartItems, removeFromCart, updateQty } = useCart();
  const navigate = useNavigate();
  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.price.replace("€", "").replace(",", "")) * item.qty,
    0
  );

  return (
    <section className="max-w-[1600px] mx-auto px-8 py-20 min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-12"
      >
        <p className="eyebrow mb-4">— Shopping Bag</p>
        <h1 className="text-display text-5xl md:text-7xl">
          Your <em className="text-crimson">Cart</em>
        </h1>
      </motion.div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-6">Your cart is empty.</p>
          <Link
            to="/collection"
            className="inline-flex items-center gap-3 btn-ink btn-ink-hover"
          >
            Browse Collection <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Items */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {cartItems.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-6 p-4 border border-border bg-secondary/20"
              >
                <div className="w-28 h-36 bg-secondary overflow-hidden shrink-0">
                  {item.img && (
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-contain p-2"
                    />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-serif text-lg">{item.name}</h3>
                        <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1">
                          {item.tag}
                        </p>
                      </div>
                      <span className="font-serif text-lg">{item.price}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 border border-border">
                      <button
                        onClick={() => updateQty(item.name, item.qty - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.name, item.qty + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.name)}
                      className="text-muted-foreground hover:text-crimson transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="border border-border p-8 h-fit sticky top-32">
            <h2 className="font-serif text-2xl mb-6">Order Summary</h2>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-muted-foreground">Subtotal</span>
              <span>€{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-crimson">Free</span>
            </div>
            <div className="border-t border-border my-4" />
            <div className="flex justify-between font-serif text-xl mb-8">
              <span>Total</span>
              <span>€{subtotal.toLocaleString()}</span>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full bg-ink text-cream py-4 text-[11px] tracking-[0.25em] uppercase hover:bg-crimson transition-colors"
            >
              Proceed to Checkout
            </button>
            <Link
              to="/collection"
              className="block text-center text-[11px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground mt-4 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
