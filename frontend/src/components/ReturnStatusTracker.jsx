import React from "react";
import { RotateCcw, Camera, ShieldCheck, CheckCircle2, Check, Clock, AlertCircle, ArrowRight } from "lucide-react";

/**
 * ReturnStatusTracker
 * Renders an industry-standard 4-step reverse logistics lifecycle:
 * 1. Return Requested -> 2. Proof Photos -> 3. Quality Review -> 4. Restocked & Closed
 */
export default function ReturnStatusTracker({ order, onConfirmReturn, isVendorOrAdmin = false }) {
  if (!order) return null;

  const isReturned = order.status === "returned";
  const hasPhotos = (order.returnPhotos || []).length > 0;
  const isReviewed = Boolean(order.returnPhotosReviewed || isReturned);

  // Determine current active step index (0 to 3)
  // Step 0: Requested
  // Step 1: Photos uploaded
  // Step 2: Quality review & inspection
  // Step 3: Restocked & closed
  let activeStepIdx = 0;
  if (isReturned) {
    activeStepIdx = 3;
  } else if (isReviewed) {
    activeStepIdx = 2;
  } else if (hasPhotos) {
    activeStepIdx = 2; // Photos are in, waiting for review
  } else {
    activeStepIdx = 1; // Return requested, waiting for photos
  }

  const steps = [
    {
      id: "requested",
      label: "Return Requested",
      sublabel: order.returnReason ? `"${order.returnReason}"` : "Customer initiated",
      icon: RotateCcw,
      completed: true,
      current: activeStepIdx === 0,
      date: order.returnRequestedDate || (order.timeline?.find((t) => t.status === "return_requested")?.date),
    },
    {
      id: "photos",
      label: "Proof Photos",
      sublabel: hasPhotos ? `${order.returnPhotos.length} photo(s) submitted` : "Awaiting customer photos",
      icon: Camera,
      completed: hasPhotos,
      current: activeStepIdx === 1,
      date: order.returnPhotosDate,
    },
    {
      id: "inspection",
      label: "Quality Review",
      sublabel: isReviewed ? "Photos verified" : hasPhotos ? "Awaiting seller review" : "Pending photos",
      icon: ShieldCheck,
      completed: isReviewed,
      current: activeStepIdx === 2,
    },
    {
      id: "restocked",
      label: "Restocked & Closed",
      sublabel: isReturned ? "Inventory restored" : "Final step",
      icon: CheckCircle2,
      completed: isReturned,
      current: activeStepIdx === 3,
    },
  ];

  return (
    <div className="w-full bg-cream/70 dark:bg-card border border-border/80 rounded-sm p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
            <RotateCcw size={14} />
          </div>
          <div>
            <h4 className="text-xs font-serif uppercase tracking-widest text-foreground font-semibold">
              Reverse Logistics / Return Flow
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {isReturned
                ? "Return completed. Item restocked in inventory and order closed."
                : "Active return process. Forward order fulfillment is locked."}
            </p>
          </div>
        </div>

        <div>
          {isReturned ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-emerald-100 text-emerald-800 rounded-sm border border-emerald-200">
              <CheckCircle2 size={13} />
              Return Completed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-amber-100 text-amber-900 rounded-sm border border-amber-300">
              <Clock size={13} />
              Return In Progress
            </span>
          )}
        </div>
      </div>

      {/* 4-Step Stepper */}
      <div className="relative pt-2 pb-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = step.completed;
            const isCurrent = step.current;

            return (
              <div
                key={step.id}
                className={`relative flex flex-col p-3 rounded-sm border transition-all ${
                  isCompleted
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300"
                    : isCurrent
                    ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/40 text-amber-900 dark:text-amber-300 ring-1 ring-amber-300"
                    : "bg-background/40 border-border/50 text-muted-foreground opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-amber-500 text-white animate-pulse"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check size={12} strokeWidth={2.5} /> : idx + 1}
                  </div>
                  <Icon size={14} className={isCompleted ? "text-emerald-700" : isCurrent ? "text-amber-700" : "text-muted-foreground"} />
                </div>

                <p className="text-xs font-semibold capitalize tracking-wide">{step.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate" title={step.sublabel}>
                  {step.sublabel}
                </p>

                {step.date && (
                  <p className="text-[10px] text-muted-foreground/80 mt-1 font-mono">
                    {new Date(step.date).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action / Information Bar for Vendor & Admin */}
      {isVendorOrAdmin && (
        <div className="pt-2 border-t border-border/60 flex items-center justify-between flex-wrap gap-3">
          {isReturned ? (
            <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-sm px-3.5 py-2 w-full">
              <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-600" />
              <span>
                <strong>Inventory Restored & Order Closed:</strong> Forward delivery buttons (Preparing, Dispatched, Shipped) are locked to protect the return lifecycle.
              </span>
            </div>
          ) : order.status === "return_requested" ? (
            <div className="flex items-center justify-between flex-wrap gap-3 w-full">
              {hasPhotos ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-foreground flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-emerald-600" />
                    Customer has uploaded <strong>{order.returnPhotos.length} photo(s)</strong>.
                  </span>
                  {onConfirmReturn && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onConfirmReturn(order.id);
                      }}
                      className="text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-sm shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={13} />
                      <span>Review Photos & Confirm Return</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2 w-full">
                  <AlertCircle size={14} className="flex-shrink-0 text-amber-600" />
                  <span>
                    Waiting for customer to upload photos of the item before return can be confirmed and inventory restocked.
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
