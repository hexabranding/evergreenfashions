import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { parsePrice } from "@/data/products";

export default function MiniCart({ open, onClose }) {
  const { cartItems, cartCount, cartTotal, updateQty, removeFromCart } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[80] w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span className="font-serif text-lg">Your Bag</span>
                <span className="text-[10px] text-muted-foreground tracking-wider">({cartCount} {cartCount === 1 ? "item" : "items"})</span>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-2">Your bag is empty</p>
                  <button
                    onClick={() => { onClose(); navigate("/collection"); }}
                    className="text-[11px] tracking-[0.2em] uppercase border-b border-foreground pb-1 hover:text-crimson hover:border-crimson transition-colors"
                  >
                    Browse Collection
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {cartItems.map((item) => (
                    <div key={`${item.name}-${item.selectedSize || ""}-${item.selectedColor || ""}`} className="flex gap-4">
                      <div className="w-20 h-24 bg-secondary overflow-hidden shrink-0">
                        {item.img && (
                          <img src={item.img} alt={item.name} className="w-full h-full object-contain p-2" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="font-serif text-sm">{item.name}</div>
                          {(item.selectedSize || item.selectedColor) && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {item.selectedColor && `Color: ${item.selectedColor}`}
                              {item.selectedColor && item.selectedSize && " · "}
                              {item.selectedSize && `Size: ${item.selectedSize}`}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 border border-border">
                            <button
                              onClick={() => updateQty(item.name, item.selectedSize, item.selectedColor, item.qty - 1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-secondary transition-colors"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-xs font-medium w-4 text-center">{item.qty}</span>
                            <button
                              onClick={() => updateQty(item.name, item.selectedSize, item.selectedColor, item.qty + 1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-secondary transition-colors"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-serif text-sm">{parsePrice(typeof item.price === "number" ? item.price * item.qty : parseFloat(String(item.price).replace("€", "").replace(",", "")) * item.qty)}</span>
                            <button
                              onClick={() => removeFromCart(item.name, item.selectedSize, item.selectedColor)}
                              className="text-muted-foreground hover:text-crimson transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-border p-6">
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>€{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-4 text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-crimson">Free</span>
                </div>
                <div className="flex justify-between font-serif text-lg mb-6 pt-2 border-t border-border">
                  <span>Total</span>
                  <span>€{cartTotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => { onClose(); navigate("/checkout"); }}
                  className="w-full bg-ink text-cream py-4 text-[11px] tracking-[0.25em] uppercase hover:bg-crimson transition-colors mb-3"
                >
                  Checkout
                </button>
                <button
                  onClick={() => { onClose(); navigate("/cart"); }}
                  className="w-full border border-border py-3 text-[11px] tracking-[0.25em] uppercase hover:bg-secondary transition-colors"
                >
                  View Full Cart
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
