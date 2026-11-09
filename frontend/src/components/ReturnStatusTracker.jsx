import React from "react";
import { Check, Camera, RotateCcw, Search, ShieldCheck, Wallet, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { ReturnPhotoGallery } from "@/components/ReturnPhotos";

/**
 * ReturnStatusTracker
 * Renders the exact luxury signature Return Roadmap (connecting line + black circle checkmarks)
 * including the dedicated "Return Photos" step requested by the user:
 * [Return Requested] ─── [Return Photos] ─── [Awaiting Inspection] ─── [Inspected] ─── [Refunded] ─── [Completed]
 */
export default function ReturnStatusTracker({
  order,
  onConfirmReturn,
  onUploadPhotos,
  isVendorOrAdmin = false,
}) {
  if (!order) return null;

  const isRental = Boolean(order.rentalDetails);
  const isReturned = order.status === "returned" || order.rentalStatus === "completed";
  const hasPhotos = (order.returnPhotos || []).length > 0;
  const isReviewed = Boolean(order.returnPhotosReviewed || order.rentalStatus === "inspected" || isReturned);
  const isRefunded = Boolean(order.depositRefunded || isReturned);

  const steps = [
    { id: "requested", label: "Return Requested", icon: RotateCcw },
    { id: "photos", label: "Return Photos", icon: Camera },
    { id: "awaiting_inspection", label: "Awaiting Inspection", icon: Search },
    { id: "inspected", label: "Inspected", icon: ShieldCheck },
    { id: "refunded", label: isRental ? "Deposit Refunded" : "Refund Processed", icon: Wallet },
    { id: "completed", label: "Completed", icon: CheckCircle2 },
  ];

  // Determine current active step index (0 to 5)
  // When an order is fully returned/completed, ALL steps are completed.
  let currentStepIdx = 0;
  if (isReturned) {
    currentStepIdx = 5;
  } else if (isRefunded) {
    currentStepIdx = 4;
  } else if (isReviewed) {
    currentStepIdx = 3;
  } else if (hasPhotos) {
    currentStepIdx = 2; // Photos uploaded, awaiting inspection
  } else {
    currentStepIdx = 1; // Return requested, awaiting photos
  }

  return (
    <div className="bg-background rounded-sm p-4 mb-4 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Return Roadmap
        </p>
        {order.returnReason && (
          <span className="text-xs text-muted-foreground max-w-[60%] truncate" title={order.returnReason}>
            Reason: {order.returnReason}
          </span>
        )}
      </div>

      {/* Stepper (Line and Circles) */}
      <div className="overflow-x-auto pb-3">
        <div className="flex items-start min-w-[560px] relative">
          {steps.map((step, idx) => {
            const isCompleted = isReturned ? true : idx <= currentStepIdx;
            const isCurrent = isReturned ? idx === 5 : idx === currentStepIdx;

            return (
              <div key={step.id} className="relative flex-1 flex flex-col items-center text-center">
                {/* Connecting Line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute top-3.5 left-1/2 w-full h-[2px] -translate-y-1/2 z-0 ${
                      isReturned || idx < currentStepIdx ? "bg-ink" : "bg-border"
                    }`}
                  />
                )}

                {/* Circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors z-10 relative ring-4 ring-background ${
                    isCompleted
                      ? "bg-ink text-cream"
                      : isCurrent
                      ? "bg-ink/20 text-ink border-2 border-ink"
                      : "bg-secondary text-muted-foreground border border-border"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.2]" />
                  ) : typeof step.icon === "function" || typeof step.icon === "object" ? (
                    <step.icon className="w-3.5 h-3.5 stroke-[1.8]" />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] sm:text-xs mt-2 text-center leading-tight line-clamp-2 max-w-[85px] ${
                    isCurrent
                      ? "text-foreground font-semibold"
                      : isCompleted
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Photos Preview & Return Action Area */}
      <div className="mt-4 pt-3 border-t border-border/60">
        {hasPhotos ? (
          <div className="space-y-3">
            <ReturnPhotoGallery
              photos={order.returnPhotos}
              title={`Return photos submitted by customer (${order.returnPhotos.length})`}
            />
            {order.returnPhotosDate && (
              <p className="text-[10px] text-muted-foreground font-mono">
                Uploaded {new Date(order.returnPhotosDate).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-3 py-1">
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>Awaiting item photos from the customer before return can be confirmed.</span>
            </div>
            {!isVendorOrAdmin && onUploadPhotos && (
              <button
                type="button"
                onClick={() => onUploadPhotos(order.id)}
                className="btn-ink px-3 py-1.5 text-xs flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>Upload Photos</span>
              </button>
            )}
          </div>
        )}

        {/* Vendor & Admin Action Controls */}
        {isVendorOrAdmin && (
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between flex-wrap gap-3">
            {isReturned ? (
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Return completed & inventory restocked. Forward fulfillment is locked.</span>
              </div>
            ) : order.status === "return_requested" ? (
              <div className="flex items-center gap-3">
                {hasPhotos ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onConfirmReturn) onConfirmReturn(order.id);
                    }}
                    className="text-xs bg-emerald-600 text-white px-4 py-2 rounded-sm hover:bg-emerald-700 transition-colors flex items-center gap-1.5 font-medium shadow-sm"
                  >
                    <CheckCircle2 size={13} />
                    <span>Review Photos & Confirm Return</span>
                  </button>
                ) : (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-sm">
                    Awaiting customer return photos
                  </span>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
