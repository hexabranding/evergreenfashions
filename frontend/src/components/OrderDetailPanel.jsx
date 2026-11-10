import { parsePrice } from "@/data/products";
import { ReturnPhotoGallery } from "@/components/ReturnPhotos";
import { Clock, MapPin, CreditCard, Package, User, Camera, AlertCircle, Hash, Truck, ExternalLink } from "lucide-react";

function formatShippingName(shipping) {
  if (!shipping) return "—";
  const name = [shipping.firstName, shipping.lastName].filter(Boolean).join(" ");
  return name || shipping.name || "—";
}

function formatCustomerName(order) {
  if (order.customerName) return order.customerName;
  return formatShippingName(order.shipping);
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

export default function OrderDetailPanel({ order, showCustomer = true, showReturnReview }) {
  if (!order) return null;

  const items = order.items || [];
  const shouldShowReturnReview = showReturnReview ?? Boolean(order.rentalDetails);

  return (
    <div className="mt-4 pt-4 border-t border-border/60 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Hash size={12} /> Order ID
          </p>
          <p className="text-sm text-foreground font-mono break-all">{order.id || "—"}</p>
          {(order.createdAt || order.date) && (
            <p className="text-xs text-muted-foreground">
              Placed {new Date(order.createdAt || order.date).toLocaleDateString()}
            </p>
          )}
        </div>
        {showCustomer && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <User size={12} /> Customer
            </p>
            <p className="text-sm text-foreground">{formatCustomerName(order)}</p>
            {(order.customerEmail || order.shipping?.email) && (
              <p className="text-xs text-muted-foreground">{order.customerEmail || order.shipping.email}</p>
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

      {(order.trackingUrl || order.courierName || order.status === "dispatched" || order.status === "shipped") && (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 p-3.5 rounded-sm">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
            <p className="text-[10px] uppercase tracking-widest text-amber-900 dark:text-amber-300 flex items-center gap-1.5 font-medium">
              <Truck size={13} /> Courier & Tracking
            </p>
            {order.status === "dispatched" && (
              <span className="text-[10px] tracking-wider uppercase bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-xs font-medium">
                Dispatched
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {order.courierName || "Courier Service"}
                {order.trackingNumber && (
                  <span className="text-xs text-muted-foreground ml-2 font-mono">
                    #{order.trackingNumber}
                  </span>
                )}
              </p>
              {order.dispatchedAt && (
                <p className="text-[11px] text-muted-foreground">
                  Dispatched on {new Date(order.dispatchedAt).toLocaleString()}
                </p>
              )}
            </div>
            {order.trackingUrl ? (
              <a
                href={order.trackingUrl.startsWith("http") ? order.trackingUrl : `https://${order.trackingUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-ink text-cream hover:bg-crimson text-xs tracking-wider uppercase transition-colors rounded-sm"
              >
                <span>Track Package</span>
                <ExternalLink size={12} />
              </a>
            ) : (
              <span className="text-xs text-muted-foreground italic">Tracking link not provided yet</span>
            )}
          </div>
        </div>
      )}

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

      {shouldShowReturnReview && (order.returnRequested || order.status === "return_requested" || order.status === "returned" || (order.returnPhotos || []).length > 0) && (
        <div className="bg-cream/60 border border-border/50 rounded-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Camera size={12} /> Return Review
            </p>
            {order.returnReason && (
              <span className="text-xs text-muted-foreground max-w-[60%] truncate" title={order.returnReason}>
                Reason: {order.returnReason}
              </span>
            )}
          </div>

          {(order.returnPhotos || []).length > 0 ? (
            <>
              <ReturnPhotoGallery
                photos={order.returnPhotos}
                title={`Customer photos${order.status === "returned" || order.returnPhotosReviewed ? " (reviewed)" : " — review before confirming"}`}
              />
              {order.returnPhotosDate && (
                <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                  Uploaded {new Date(order.returnPhotosDate).toLocaleString()}
                </p>
              )}
              {order.status !== "returned" && !order.returnPhotosReviewed && (
                <p className="text-[11px] text-emerald-700 mt-2 flex items-center gap-1.5">
                  <AlertCircle size={12} /> Zoom in to inspect the item condition, then confirm the return below.
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2.5">
              <AlertCircle size={14} />
              <span>Waiting for the customer to upload return item photos. Return cannot be confirmed until photos are received.</span>
            </div>
          )}
        </div>
      )}

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

      {order.timeline?.length > 0 && (() => {
        const visibleTimeline = order.timeline.filter((entry) => {
          if (!order.rentalDetails && entry.description && entry.description.toLowerCase().includes("rental status")) {
            return false;
          }
          return true;
        });
        if (!visibleTimeline.length) return null;

        return (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
              <Clock size={12} /> Timeline
            </p>
            <div className="space-y-1.5">
              {visibleTimeline.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground font-mono w-36 flex-shrink-0">
                    {new Date(entry.date).toLocaleString()}
                  </span>
                  <span className="capitalize text-foreground">{entry.status}</span>
                  {entry.description && (
                    <span className="text-muted-foreground truncate">— {entry.description}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
