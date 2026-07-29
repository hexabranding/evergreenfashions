import { useState, useRef, useEffect, useCallback } from "react";

export default function ImageZoom({ images, mainImage }) {
  const [isHovering, setIsHovering] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [dims, setDims] = useState({ w: 300, h: 400 });
  const containerRef = useRef(null);

  const ZOOM = 3;
  const LENS = 130;
  const PANEL_W = 400;
  const PANEL_H = 480;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setDims({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleMove = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();
    setMouse({
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    });
  }, []);

  const currentImg = images[mainImage] || images[0];

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseMove={handleMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="aspect-[3/4] bg-secondary overflow-hidden">
        <img
          src={currentImg}
          alt=""
          className="w-full h-full object-contain p-8"
          style={{ cursor: isHovering ? "crosshair" : "default" }}
        />

        {isHovering && (
          <div
            className="absolute pointer-events-none rounded-full border-2 border-white/40"
            style={{
              left: Math.max(0, Math.min(dims.w - LENS, mouse.x * dims.w - LENS / 2)),
              top: Math.max(0, Math.min(dims.h - LENS, mouse.y * dims.h - LENS / 2)),
              width: LENS,
              height: LENS,
              backgroundImage: `url(${currentImg})`,
              backgroundSize: `${dims.w * ZOOM}px ${dims.h * ZOOM}px`,
              backgroundPosition: `${(mouse.x * dims.w) * ZOOM - LENS / 2}px ${(mouse.y * dims.h) * ZOOM - LENS / 2}px`,
              backgroundRepeat: "no-repeat",
              boxShadow: "0 0 20px rgba(0,0,0,0.2), inset 0 0 15px rgba(0,0,0,0.07)",
              zIndex: 20,
            }}
          />
        )}
      </div>

      {isHovering && (
        <div
          className="absolute overflow-hidden bg-white border border-border shadow-xl"
          style={{
            width: PANEL_W,
            height: PANEL_H,
            left: `calc(100% + 16px)`,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 30,
          }}
        >
          <img
            src={currentImg}
            alt=""
            className="absolute block"
            style={{
              width: `${PANEL_W}px`,
              height: `${PANEL_H}px`,
              objectFit: "cover",
              transformOrigin: `${mouse.x * 100}% ${mouse.y * 100}%`,
              transform: `scale(${ZOOM})`,
              pointerEvents: "none",
            }}
          />
        </div>
      )}
    </div>
  );
}