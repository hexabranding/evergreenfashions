import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import dressHero from "@/assets/dress-hero.png";
import dress2 from "@/assets/dress-2.png";
import dress3 from "@/assets/dress-3.png";
import dress4 from "@/assets/dress-4.png";

const heroSlides = [
  { img: dressHero, name: "Écarlate Gown", price: "€1,290", tag: "Signature" },
  { img: dress2, name: "Noir Silhouette", price: "€890", tag: "New" },
  { img: dress3, name: "Camel Trench", price: "€1,150", tag: "Icon" },
  { img: dress4, name: "Émeraude Satin", price: "€1,420", tag: "Couture" },
];

const products = [
  { name: "Écarlate Gown", price: "€1,290", tag: "Signature", img: dressHero },
  { name: "Noir Silhouette", price: "€890", tag: "New", img: dress2 },
  { name: "Camel Trench", price: "€1,150", tag: "Icon", img: dress3 },
  { name: "Émeraude Satin", price: "€1,420", tag: "Couture", img: dress4 },
];

const newArrivals = [
  { name: "Noir Silhouette", price: "€890", tag: "New", img: dress2 },
  { name: "Ivoire Draped", price: "€980", tag: "New", img: dressHero },
  { name: "Perle Chiffon", price: "€1,100", tag: "New", img: dress3 },
  { name: "Sable Wrap", price: "€1,340", tag: "New", img: dress4 },
];

export default function Home() {
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const dressY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const dressRotate = useTransform(scrollYProgress, [0, 1], [0, -8]);
  const dressScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.6, 0]);
  const bgBlushY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const bgCrimsonY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const priceX = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const noteX = useTransform(scrollYProgress, [0, 1], [0, -40]);

  const { scrollY } = useScroll();
  const marqueeX = useTransform(scrollY, [0, 3000], [0, -400]);

  return (
    <>
      {/* Hero */}
      <section
        ref={heroRef}
        className="relative min-h-[92vh] overflow-hidden flex items-center"
      >
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            style={{ y: bgBlushY }}
            className="absolute top-1/4 -left-32 w-[400px] h-[400px] rounded-full bg-blush/40 blur-[140px]"
          />
          <motion.div
            style={{ y: bgCrimsonY }}
            className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-crimson/15 blur-[160px]"
          />
        </div>

        <div className="max-w-[1600px] mx-auto px-6 lg:px-20 relative z-10 w-full">
          <div className="relative grid grid-cols-12 gap-6 items-center min-h-[78vh]">
            {/* LEFT — Text with more padding */}
            <motion.div
              style={{ y: titleY, opacity: titleOpacity }}
              className="col-span-12 lg:col-span-6 relative z-30 lg:pl-20"
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="eyebrow mb-6 flex items-center gap-3"
              >
                <span className="w-10 h-px bg-foreground/60" />
                Evergreen Fashion — Fall / Winter 2026
              </motion.p>

              <h1 className="text-display text-left text-[clamp(3rem,7.5vw,7rem)] leading-[0.88] tracking-[-0.04em]">
                <motion.span
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="block"
                >
                  Evergreen
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="block italic pl-[10%] text-crimson font-light"
                >
                  fashion
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.54, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="block"
                >
                  that lasts<span className="text-crimson">.</span>
                </motion.span>
              </h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                className="mt-10 max-w-lg"
              >
                <p className="text-muted-foreground leading-relaxed text-[15px]">
                  Silhouettes cut in silk and shadow. Each piece is sewn by
                  hand in our Parisian atelier — moving with you, breathing
                  with the room. Unisex couture for every body.
                </p>
                <div className="mt-7 flex items-center gap-5">
                  <button className="btn-ink btn-ink-hover group justify-between">
                    Shop Collection
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <a
                    href="#collection"
                    className="text-[11px] tracking-[0.25em] uppercase border-b border-foreground pb-1 hover:text-crimson hover:border-crimson transition-colors"
                  >
                    View Lookbook
                  </a>
                </div>
              </motion.div>

              {/* Trust row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.8 }}
                className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[10px] text-muted-foreground tracking-wide uppercase"
              >
                <span className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-crimson" /> Handcrafted
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-crimson" /> Free Shipping
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-crimson" /> Secure Payment
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-crimson" /> 30-Day Returns
                </span>
              </motion.div>
            </motion.div>

            {/* RIGHT — Dress image */}
            <motion.div
              style={{ y: dressY, rotate: dressRotate, scale: dressScale }}
              className="col-span-12 lg:col-span-6 lg:col-start-7 row-start-1 relative h-[55vh] lg:h-[80vh] flex items-center justify-center pointer-events-none lg:pointer-events-auto z-20"
            >
              {/* Rotating rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[10%] border border-crimson/20 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[18%] border border-foreground/10 rounded-full"
              />

              {/* Floating tag */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroIndex}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.6 }}
                  style={{ x: priceX }}
                  className="absolute top-10 right-0 lg:right-4 z-20 bg-background/95 backdrop-blur px-5 py-4 shadow-2xl border border-border"
                >
                  <div className="eyebrow">Look 0{heroIndex + 1} · {heroSlides[heroIndex].name.split(" ")[0]}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 tracking-widest">
                    {heroSlides[heroIndex].tag.toUpperCase()} · UNISEX
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Dress — auto-rotating carousel */}
              <div className="relative z-10 h-[90%] w-auto">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={heroIndex}
                    src={heroSlides[heroIndex].img}
                    alt={heroSlides[heroIndex].name}
                    width={1024}
                    height={1536}
                    initial={{ opacity: 0, scale: 0.92, rotate: -3 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.05, rotate: 3 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full w-auto object-contain animate-sway origin-top"
                    style={{ filter: "drop-shadow(0 40px 60px rgba(180, 30, 40, 0.35))" }}
                  />
                </AnimatePresence>
              </div>

              {/* Carousel dots */}
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex gap-2.5">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIndex(i)}
                    className={`transition-all duration-300 rounded-full ${
                      i === heroIndex
                        ? "w-6 h-1.5 bg-crimson"
                        : "w-1.5 h-1.5 bg-foreground/30 hover:bg-foreground/60"
                    }`}
                  />
                ))}
              </div>

              {/* Floating particles */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-crimson/40"
                  style={{ left: `${20 + i * 14}%`, top: `${30 + (i % 3) * 20}%` }}
                  animate={{ y: [0, -25, 0], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
                />
              ))}

              {/* Bottom note */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  style={{ x: noteX }}
                  className="absolute bottom-24 right-2 lg:right-8 z-20 max-w-[200px] text-right"
                >
                  <div className="w-10 h-px bg-foreground ml-auto mb-2" />
                  <p className="font-serif text-sm">{heroSlides[heroIndex].name}</p>
                  <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1">{heroSlides[heroIndex].tag}</p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Marquee band */}
      <section className="bg-ink text-cream py-4 overflow-hidden">
        <motion.div style={{ x: marqueeX }} className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, r) => (
            <div key={r} className="flex items-center gap-12 px-6">
              {["Silk", "Cashmere", "Velvet", "Chiffon", "Organza", "Satin", "Wool", "Leather"].map((w) => (
                <span key={w} className="text-3xl font-serif italic tracking-tight opacity-90">
                  {w} <span className="text-crimson">◆</span>
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </section>

      {/* Collection grid */}
      <section id="collection" className="max-w-[1600px] mx-auto px-8 py-24">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
          <div>
            <p className="eyebrow mb-3">— The Collection</p>
            <h2 className="text-display text-4xl md:text-5xl">
              Pieces that <em className="text-crimson">move</em>
            </h2>
          </div>
          <a
            href="#"
            className="text-xs tracking-[0.2em] uppercase border-b border-foreground pb-1 hover:text-crimson hover:border-crimson transition-colors"
          >
            View All 48 Pieces →
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map((p, i) => (
            <motion.article
              key={p.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group cursor-pointer"
            >
              <Link to={`/product/${p.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="relative aspect-[3/4] bg-secondary overflow-hidden mb-3">
                  <div className="absolute top-3 left-3 z-10 bg-background px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase">
                    {p.tag}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleWishlist(p);
                    }}
                    className="absolute top-3 right-3 z-10 w-8 h-8 bg-background/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${isWishlisted(p.name) ? "fill-crimson text-crimson" : ""}`}
                    />
                  </button>
                  <motion.img
                    src={p.img}
                    alt={p.name}
                    width={768}
                    height={1024}
                    loading="lazy"
                    className="w-full h-full object-contain p-4 transition-transform duration-1000 group-hover:scale-105"
                    whileHover={{ rotate: [0, -2, 2, 0] }}
                    transition={{ duration: 1.5 }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        addToCart(p);
                      }}
                      className="w-full bg-ink text-cream py-3 text-[10px] tracking-[0.25em] uppercase hover:bg-crimson transition-colors"
                    >
                      Add to Bag
                    </button>
                  </div>
                </div>
              </Link>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-serif text-lg">{p.name}</h3>
                  <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1">
                    4 Colors · Unisex
                  </p>
                </div>
                <span className="font-serif text-base">{p.price}</span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="max-w-[1600px] mx-auto px-8 py-24">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
          <div>
            <p className="eyebrow mb-3">— Just Arrived</p>
            <h2 className="text-display text-4xl md:text-5xl">
              New <em className="text-crimson">arrivals.</em>
            </h2>
          </div>
          <Link
            to="/collection"
            className="text-xs tracking-[0.2em] uppercase border-b border-foreground pb-1 hover:text-crimson hover:border-crimson transition-colors"
          >
            View All New →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {newArrivals.map((p, i) => (
            <motion.article
              key={p.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group cursor-pointer"
            >
              <Link to={`/product/${p.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="relative aspect-[3/4] bg-secondary overflow-hidden mb-3">
                  <div className="absolute top-3 left-3 z-10 bg-crimson text-cream px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase">
                    {p.tag}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleWishlist(p);
                    }}
                    className="absolute top-3 right-3 z-10 w-8 h-8 bg-background/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${isWishlisted(p.name) ? "fill-crimson text-crimson" : ""}`}
                    />
                  </button>
                  <motion.img
                    src={p.img}
                    alt={p.name}
                    width={768}
                    height={1024}
                    loading="lazy"
                    className="w-full h-full object-contain p-4 transition-transform duration-1000 group-hover:scale-105"
                    whileHover={{ rotate: [0, -2, 2, 0] }}
                    transition={{ duration: 1.5 }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        addToCart(p);
                      }}
                      className="w-full bg-ink text-cream py-3 text-[10px] tracking-[0.25em] uppercase hover:bg-crimson transition-colors"
                    >
                      Add to Bag
                    </button>
                  </div>
                </div>
              </Link>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-serif text-lg">{p.name}</h3>
                  <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1">
                    4 Colors · Unisex
                  </p>
                </div>
                <span className="font-serif text-base">{p.price}</span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Editorial split */}
      <section className="bg-ink py-24">
        <div className="max-w-[1600px] mx-auto px-8 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="relative aspect-[4/5] bg-background overflow-hidden"
          >
            <motion.img
              src={dress4}
              alt="Emerald satin gown"
              width={768}
              height={1024}
              loading="lazy"
              className="w-full h-full object-contain animate-float"
            />
            <div className="absolute bottom-6 left-6 bg-cream/90 backdrop-blur px-4 py-3">
              <div className="eyebrow text-foreground">Look 07</div>
              <div className="font-serif text-lg text-foreground">Émeraude</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2 }}
          >
            <p className="eyebrow mb-5 text-cream/50">— Atelier Diary</p>
            <h2 className="text-display text-4xl md:text-5xl mb-6 text-cream">
              Sixty-eight hours of{" "}
              <em className="text-crimson">hand-stitching.</em>
            </h2>
            <p className="text-cream/60 leading-relaxed mb-5 max-w-md text-sm">
              Every piece begins as a single length of raw silk. Our
              première main drapes it directly onto the form — no pattern,
              no shortcut — until the fabric decides how it wants to fall.
            </p>
            <p className="text-cream/60 leading-relaxed mb-8 max-w-md text-sm">
              The result is clothing that moves like a second breath.
              Wearable architecture, alive to every step. Designed for every body.
            </p>
            <a href="#" className="inline-flex items-center gap-3 px-6 py-3 bg-crimson text-cream text-[11px] font-medium tracking-[0.2em] uppercase hover:bg-crimson/80 transition-colors">
              Inside the Atelier <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="eyebrow mb-5">— Correspondence</p>
          <h2 className="text-display text-4xl md:text-5xl mb-5">
            Letters from the <em className="text-crimson">atelier.</em>
          </h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Private previews, atelier films, and access to pieces before
            they meet the world.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-transparent border-b border-foreground px-2 py-3 text-sm focus:outline-none focus:border-crimson transition-colors"
            />
            <button type="submit" className="btn-ink btn-ink-hover justify-center">
              Subscribe
            </button>
          </form>
        </motion.div>
      </section>
    </>
  );
}
