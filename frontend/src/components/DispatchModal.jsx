import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, X, ExternalLink, Link2, Hash, Check } from "lucide-react";

const COURIER_PRESETS = [
  "DHL Express",
  "FedEx",
  "Chronopost",
  "UPS",
  "Colissimo",
  "La Poste",
];

export default function DispatchModal({ order, onClose, onConfirm }) {
  const [courierName, setCourierName] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setCourierName(order.courierName || "");
      setTrackingUrl(order.trackingUrl || "");
      setTrackingNumber(order.trackingNumber || "");
    }
  }, [order]);

  if (!order) return null;

  const handleSubmit = async (skipTracking = false) => {
    setLoading(true);
    try {
      await onConfirm({
        status: "dispatched",
        ...(order.rentalDetails || order.rentalStatus ? { rentalStatus: "dispatched" } : {}),
        courierName: skipTracking ? "" : courierName.trim(),
        trackingUrl: skipTracking ? "" : trackingUrl.trim(),
        trackingNumber: skipTracking ? "" : trackingNumber.trim(),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="bg-background border border-border w-full max-w-lg p-6 sm:p-8 shadow-2xl relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center justify-center">
              <Truck size={16} />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
                Order Fulfillment
              </p>
              <h3 className="font-serif text-2xl text-foreground">
                Dispatch Order
              </h3>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-6">
            Mark order <span className="font-mono font-medium text-foreground">#{order.id}</span> as dispatched and provide courier tracking for the customer.
          </p>

          {/* Form */}
          <div className="space-y-4">
            {/* Courier Presets */}
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground block mb-1.5 font-medium">
                Courier Service
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COURIER_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCourierName(preset)}
                    className={`text-[10px] px-2.5 py-1 border transition-colors ${
                      courierName === preset
                        ? "border-foreground bg-foreground text-background font-medium"
                        : "border-border hover:border-foreground/60 text-muted-foreground"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                placeholder="e.g. DHL Express, Chronopost, UPS"
                className="w-full bg-background border border-border px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
              />
            </div>

            {/* Tracking URL */}
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-1.5 mb-1.5 font-medium">
                <Link2 size={12} /> Courier Tracking URL <span className="text-crimson">*</span>
              </label>
              <input
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://www.dhl.com/track?id=..."
                className="w-full bg-background border border-border px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-foreground transition-colors font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Shoppers can click this link directly in their account tracking timeline to see real-time updates.
              </p>
            </div>

            {/* Tracking / Waybill Number */}
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-1.5 mb-1.5 font-medium">
                <Hash size={12} /> Waybill / Tracking Number (Optional)
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. 982348723984"
                className="w-full bg-background border border-border px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-foreground transition-colors font-mono"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs tracking-wider uppercase border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="px-4 py-2.5 text-xs tracking-wider uppercase border border-border hover:border-foreground text-foreground transition-colors"
            >
              Dispatch Without Link
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading || (!trackingUrl.trim() && !courierName.trim())}
              className="px-5 py-2.5 text-xs tracking-wider uppercase bg-ink text-cream hover:bg-crimson transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={14} />
              <span>{loading ? "Saving..." : "Confirm Dispatch"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
