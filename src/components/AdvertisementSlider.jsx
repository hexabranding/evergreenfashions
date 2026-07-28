import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { adsApi } from "@/api/ads";

export default function AdvertisementSlider() {
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => { adsApi.getActive().then((data) => setAds(data.filter((ad) => ad.type === "slide" || ad.position?.startsWith("homepage")))).catch(() => setAds([])).finally(() => setIsLoading(false)); }, []);
  const visibleAds = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return ads.filter((ad) => (!ad.startDate || ad.startDate <= today) && (!ad.endDate || ad.endDate >= today));
  }, [ads]);
  const slides = visibleAds;
  if (!isLoading && slides.length === 0) return null;
  if (slides.length === 0) return null;
  const current = slides[activeIndex % slides.length];
  useEffect(() => { setActiveIndex(0); }, [slides.length]);
  useEffect(() => { if (slides.length < 2) return undefined; const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % slides.length), 5500); return () => window.clearInterval(timer); }, [slides.length]);
  const changeSlide = (direction) => setActiveIndex((index) => (index + direction + slides.length) % slides.length);

  return <section className="relative w-full overflow-hidden" aria-label="Featured advertisements">
    <div className="relative h-[360px] md:h-[430px] bg-ink">
      <AnimatePresence mode="wait"><motion.div key={current._id || current.id || current.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55 }} className="absolute inset-0">
        <img src={current.image} alt={current.title} className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/45 to-transparent" />
        <div className="absolute inset-0 flex items-center"><div className="max-w-[1600px] mx-auto px-8 w-full"><div className="max-w-lg">
          <p className="eyebrow mb-3 text-blush/80">— Featured promotion</p>
          <h2 className="text-display text-4xl md:text-6xl text-cream leading-tight">{current.title}<br />{current.subtitle && <em className="text-blush">{current.subtitle}</em>}</h2>
          <Link to={current.link || "/collection"} className="inline-flex items-center gap-3 bg-cream text-ink px-8 py-3 mt-8 text-[10px] tracking-[0.25em] uppercase hover:bg-blush transition-colors">{current.buttonText || "Shop Now"} <ArrowRight className="w-4 h-4" /></Link>
        </div></div></div>
      </motion.div></AnimatePresence>
      {slides.length > 1 && <><button onClick={() => changeSlide(-1)} aria-label="Previous advertisement" className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-cream/50 text-cream grid place-items-center hover:bg-cream hover:text-ink transition-colors"><ChevronLeft size={20} /></button><button onClick={() => changeSlide(1)} aria-label="Next advertisement" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-cream/50 text-cream grid place-items-center hover:bg-cream hover:text-ink transition-colors"><ChevronRight size={20} /></button><div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">{slides.map((slide, index) => <button key={slide._id || slide.id || index} onClick={() => setActiveIndex(index)} aria-label={`Show advertisement ${index + 1}`} className={`h-1.5 transition-all ${index === activeIndex ? "w-8 bg-cream" : "w-3 bg-cream/50"}`} />)}</div></>}
    </div>
  </section>;
}
