import { parsePrice } from "@/data/products";
import { Clock, MapPin, CreditCard, Package, User } from "lucide-react";

function formatShippingName(shipping) {
  if (!shipping) return "—";
  const name = [shipping.firstName, shipping.lastName].filter(Boolean).join(" ");
  return name || shipping.name || "—";
}

function formatShippingAddress(shipping) {
  if (!shipping) return "—";
  const parts = [shipping.address, shipping.city, shipping.zip, shipping.country].filter(Boolean);
  return parts.join(", ") || "—";
}

function formatPayment(payment) {
  if (!payment) return "—";
  const method = payment.method || "card";
  if (method === "card" && payment.cardNumber) {
    return `Card •••• ${payment.cardNumber.replace(/\s/g, "").slice(-4)}`;
  }
  if (method === "upi" && payment.upiId) return `UPI • ${payment.upiId}`;
  return method.charAt(0).toUpperCase() + method.slice(1);
}

export default function OrderDetailPanel({ order, showCustomer = true }) {
  if (!order) return null;

  const items = order.items || [];

  return (
    <div className="mt-4 pt-4 border-t border-border/60 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {showCustomer && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <User size={12} /> Customer
            </p>
            <p className="text-sm text-foreground">{order.userId || "Guest"}</p>
            {order.shipping?.email && (
              <p className="text-xs text-muted-foreground">{order.shipping.email}</p>
            )}
          </div>
        )}
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <MapPin size={12} /> Shipping
          </p>
          <p className="text-sm text-foreground">{formatShippingName(order.shipping)}</p>
          <p className="text-xs text-muted-foreground">{formatShippingAddress(order.shipping)}</p>
          {order.shipping?.phone && (
            <p className="text-xs text-muted-foreground">{order.shipping.phone}</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <CreditCard size={12} /> Payment
          </p>
          <p className="text-sm text-foreground">{formatPayment(order.payment)}</p>
          {order.estimatedDelivery && (
            <p className="text-xs text-muted-foreground">
              Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
          <Package size={12} /> Items ({items.length})
        </p>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 bg-cream/60 border border-border/40 rounded-sm p-3"
            >
              {item.img && (
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-12 h-14 object-cover rounded-sm flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.qty ?? item.quantity}
                  {(item.selectedSize || item.size) && ` • Size: ${item.selectedSize || item.size}`}
                  {(item.selectedColor || item.color) && ` • ${item.selectedColor || item.color}`}
                </p>
              </div>
              <p className="text-sm font-medium text-foreground flex-shrink-0">
                {parsePrice(typeof item.price === "number" ? item.price * (item.qty ?? item.quantity ?? 1) : item.price)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        {order.subtotal != null && (
          <div>
            <span className="text-muted-foreground">Subtotal: </span>
            <span className="text-foreground">{parsePrice(order.subtotal)}</span>
          </div>
        )}
        {order.discount > 0 && (
          <div>
            <span className="text-muted-foreground">Discount: </span>
            <span className="text-emerald-600">-{parsePrice(order.discount)}</span>
          </div>
        )}
        {order.coupon && (
          <div>
            <span className="text-muted-foreground">Coupon: </span>
            <span className="text-foreground">{order.coupon.code || order.coupon}</span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Total: </span>
          <span className="font-medium text-foreground">{parsePrice(order.total || order.totalAmount)}</span>
        </div>
      </div>

      {order.timeline?.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
            <Clock size={12} /> Timeline
          </p>
          <div className="space-y-1.5">
            {order.timeline.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground font-mono w-36 flex-shrink-0">
                  {new Date(entry.date).toLocaleString()}
                </span>
                <span className="capitalize text-foreground">{entry.status}</span>
                {entry.description && (
                  <span className="text-muted-foreground">— {entry.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
