import React from "react";
import { Check, Camera, RotateCcw, Search, ShieldCheck, Wallet, CheckCircle2, AlertCircle, Plus, Clock } from "lucide-react";
import { ReturnPhotoGallery } from "@/components/ReturnPhotos";

/**
 * ReturnStatusTracker
 * Renders the exact luxury signature Return Roadmap (connecting line + black circle checkmarks)
 * [Return Requested] ─── [Return Photos] ─── [Awaiting Inspection] ─── [Inspected] ─── [Refund Processed] ─── [Completed]
 *
 * Flow:
 * 1. Customer requests return -> Return Requested checked
 * 2. Customer uploads photos -> Return Photos checked
 * 3. Waiting for seller/admin review -> Awaiting Inspection
 * 4. Seller confirms inspection -> Inspected checked & Refund Processing active (with 3-4 days message to customer)
 * 5. Seller/system confirms refund -> Refund Processed & Completed checked
 */
export default function ReturnStatusTracker({
  order,
  onConfirmReturn,
  onCompleteRefund,
  onUploadPhotos,
  isVendorOrAdmin = false,
}) {
  if (!order) return null;

  const isRental = Boolean(order.rentalDetails);

  // Completed status check
  const isRefundCompleted = Boolean(
    order.refundStatus === "completed" ||
    (order.status === "returned" && !order.rentalDetails && order.refundStatus !== "processing") ||
    (order.rentalDetails && order.rentalStatus === "completed")
  );

  // Refund processing status check
  const isRefundProcessing = Boolean(
    order.status === "refund_processing" ||
    order.refundStatus === "processing" ||
    (order.rentalDetails && order.rentalStatus === "deposit_refunded")
  );

  // Inspected status check
  const isInspected = Boolean(
    isRefundCompleted ||
    isRefundProcessing ||
    order.inspectionStatus === "passed" ||
    order.returnPhotosReviewed ||
    (order.rentalDetails && ["inspected", "deposit_refunded", "completed"].includes(order.rentalStatus))
  );

  const hasPhotos = (order.returnPhotos || []).length > 0;

  const steps = [
    { id: "requested", label: "Return Requested", icon: RotateCcw },
    { id: "photos", label: "Return Photos", icon: Camera },
    { id: "awaiting_inspection", label: "Awaiting Inspection", icon: Search },
    { id: "inspected", label: "Inspected", icon: ShieldCheck },
    { id: "refunded", label: isRental ? "Deposit Refunded" : "Refund Processed", icon: Wallet },
    { id: "completed", label: "Completed", icon: CheckCircle2 },
  ];

  // Determine completion and current state for each individual step
  const stepStates = [
    // Step 0: Return Requested
    {
      completed: true,
      current: !hasPhotos && !isInspected,
    },
    // Step 1: Return Photos
    {
      completed: hasPhotos || isInspected,
      current: !hasPhotos && !isInspected,
    },
    // Step 2: Awaiting Inspection
    {
      completed: isInspected,
      current: hasPhotos && !isInspected,
    },
    // Step 3: Inspected
    {
      completed: isInspected,
      current: isInspected && !isRefundProcessing && !isRefundCompleted,
    },
    // Step 4: Refund Processed
    {
      completed: isRefundCompleted,
      current: isRefundProcessing && !isRefundCompleted,
    },
    // Step 5: Completed
    {
      completed: isRefundCompleted,
      current: isRefundCompleted,
    },
  ];

  // Connecting line check between step i and step i+1
  const isLineActive = (idx) => {
    if (idx === 0) return hasPhotos || isInspected;
    if (idx === 1) return hasPhotos || isInspected;
    if (idx === 2) return isInspected;
    if (idx === 3) return isRefundProcessing || isRefundCompleted;
    if (idx === 4) return isRefundCompleted;
    return false;
  };

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
            const { completed: isCompleted, current: isCurrent } = stepStates[idx];

            return (
              <div key={step.id} className="relative flex-1 flex flex-col items-center text-center">
                {/* Connecting Line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute top-3.5 left-1/2 w-full h-[2px] -translate-y-1/2 z-0 ${
                      isLineActive(idx) ? "bg-ink" : "bg-border"
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

      {/* Real-time Customer Notification Message in Track Bar */}
      {isRefundProcessing && !isRefundCompleted && (
        <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-sm p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <Clock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold tracking-wide">
              Product reached our hands & inspection passed
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
              Your refund is currently being processed and will be credited to your account within 3 to 4 working days.
            </p>
          </div>
        </div>
      )}

      {/* Completion message */}
      {isRefundCompleted && (
        <div className="mt-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-sm p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
          <span>
            <strong>Refund completed & credited.</strong> The return process is complete and this order is closed.
          </span>
        </div>
      )}

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
            {isRefundCompleted ? (
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Return & refund completed. Forward fulfillment is locked.</span>
              </div>
            ) : isRefundProcessing ? (
              <div className="flex items-center justify-between w-full flex-wrap gap-3">
                <span className="text-xs text-muted-foreground">
                  Inspection complete. Inventory has been restored. Waiting for payout settlement.
                </span>
                {onCompleteRefund && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompleteRefund(order.id);
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-sm transition-colors flex items-center gap-1.5 font-medium shadow-sm"
                  >
                    <CheckCircle2 size={13} />
                    <span>Mark Refund as Completed</span>
                  </button>
                )}
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
                    <span>Review Photos & Confirm Inspection</span>
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
