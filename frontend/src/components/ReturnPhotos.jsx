import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, X, ChevronLeft, ChevronRight, ZoomIn, ImageOff } from "lucide-react";
import { MAX_RETURN_PHOTOS } from "@/lib/image";

export function ReturnPhotoGallery({ photos = [], title = "Return Item Photos", emptyText = "No photos uploaded yet." }) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setActive((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, photos.length]);

  if (!photos.length) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-cream border border-border/50 rounded-sm px-3 py-2.5">
        <ImageOff size={14} />
        <span>{emptyText}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</p>
        <span className="text-[10px] text-muted-foreground">{photos.length} photo{photos.length > 1 ? "s" : ""}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {photos.map((photo, idx) => (
          <button
            key={`${photo}-${idx}`}
            type="button"
            onClick={() => setActive(idx)}
            className="group relative w-20 h-20 sm:w-24 sm:h-24 overflow-hidden border border-border/60 rounded-sm bg-cream"
            title="Click to enlarge"
          >
            <img src={photo} alt={`Return photo ${idx + 1}`} className="w-full h-full object-cover" />
            <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 transition-colors flex items-center justify-center">
              <ZoomIn size={16} className="text-cream opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-ink/90 flex items-center justify-center p-4"
            onClick={() => setActive(null)}
          >
            <button
              type="button"
              className="absolute top-4 right-4 p-2 text-cream/70 hover:text-cream transition-colors"
              onClick={() => setActive(null)}
              aria-label="Close"
            >
              <X size={22} />
            </button>
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-3 sm:left-8 p-2 text-cream/70 hover:text-cream transition-colors"
                  onClick={(e) => { e.stopPropagation(); setActive((i) => (i - 1 + photos.length) % photos.length); }}
                  aria-label="Previous"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  type="button"
                  className="absolute right-3 sm:right-8 p-2 text-cream/70 hover:text-cream transition-colors"
                  onClick={(e) => { e.stopPropagation(); setActive((i) => (i + 1) % photos.length); }}
                  aria-label="Next"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
            <motion.img
              key={photos[active]}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={photos[active]}
              alt={`Return photo ${active + 1}`}
              className="max-w-full max-h-[85vh] object-contain border border-cream/10"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="absolute bottom-5 text-[11px] uppercase tracking-widest text-cream/60">
              {active + 1} / {photos.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ReturnPhotoUploader({
  photos = [],
  onFiles,
  onRemove,
  uploading = false,
  disabled = false,
  max = MAX_RETURN_PHOTOS,
  hint = "Add clear photos of the item you are returning (front, back, labels, any damage).",
}) {
  const inputRef = useRef(null);
  const full = photos.length >= max;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Camera size={12} /> Item Photos ({photos.length}/{max})
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {photos.map((photo, idx) => (
          <div key={`${photo}-${idx}`} className="relative w-20 h-20 sm:w-24 sm:h-24 border border-border/60 rounded-sm overflow-hidden bg-cream">
            <img src={photo} alt={`Return photo ${idx + 1}`} className="w-full h-full object-cover" />
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 bg-ink text-cream text-[9px] px-1.5 py-0.5 rounded-sm font-medium">
                Main
              </span>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                disabled={uploading || disabled}
                className="absolute top-1 right-1 w-5 h-5 bg-ink/80 text-cream rounded-sm flex items-center justify-center hover:bg-crimson transition-colors disabled:opacity-50"
                aria-label="Remove photo"
              >
                <X size={11} />
              </button>
            )}
          </div>
        ))}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || disabled}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-cream border-2 border-dashed border-border/60 rounded-sm flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-ink/30 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            <span className="text-[9px] uppercase tracking-wider">{uploading ? "Adding" : "Upload"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />

      <p className="text-[11px] text-muted-foreground mt-2">{hint}</p>
    </div>
  );
}
