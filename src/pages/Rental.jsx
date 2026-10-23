import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Truck, ShieldCheck, Star, Heart, ChevronRight,
  ArrowRight, Sparkles, RotateCcw, PackageCheck, Plus,
} from "lucide-react";
import { allProducts, colorMap, parsePrice } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";

const steps = [
  {
    num: "01",
    icon: <Heart className="w-5 h-5" />,
    title: "Choose Your Piece",
    desc: "Browse the curated archive — gowns, tailoring and outerwear, all available to rent.",
  },
  {
    num: "02",
    icon: <Calendar className="w-5 h-5" />,
    title: "Select Your Dates",
    desc: "Pick a window from 3 to 14 days. Availability is confirmed live at checkout.",
  },
  {
    num: "03",
    icon: <PackageCheck className="w-5 h-5" />,
    title: "Wear & Return",
    desc: "Delivered express, worn beautifully, returned with the prepaid label. We handle the rest.",
  },
];

const trustBadges = [
  { icon: Sparkles, label: "Dry Cleaning Included", sub: "Professionally cared for" },
  { icon: ShieldCheck, label: "Insurance Covered", sub: "Wear & tear protection" },
  { icon: Truck, label: "Free Return Shipping", sub: "Prepaid label in every box" },
  { icon: RotateCcw, label: "Flexible Extensions", sub: "Extend any rental in 1 click" },
];

const heroStats = [
  { value: "120+", label: "Pieces available" },
  { value: "3–14", label: "Day rental windows" },
  { value: "4.9", label: "Average rating", star: true },
  { value: "24h", label: "Dispatch worldwide" },
];

const faqs = [
  {
    q: "How does the rental process work?",
    a: "Browse our curated collection, select your rental dates, and we'll ship the piece to you. After your rental period, simply return it using the prepaid shipping label included with your order. We handle professional dry cleaning between each rental.",
  },
  {
    q: "What if I want to buy the rented piece?",
    a: "If you fall in love with a piece, you can purchase it during or after your rental period. The rental fees you've already paid will be credited toward the purchase price.",
  },
  {
    q: "What happens if the item is damaged?",
    a: "Every rental includes insurance coverage for minor wear and tear. For significant damage, a portion of your security deposit may be deducted. We'll always communicate any charges clearly before processing them.",
  },
  {
    q: "Can I extend my rental period?",
    a: "Absolutely. If your piece is available beyond your original dates, you can extend your rental through your account dashboard. Extensions are billed at the same daily rate.",
  },
  {
    q: "What sizes are available for rental?",
    a: "Most pieces are available in sizes XS through XL. Each product page shows exactly which sizes are in stock for rental at your selected dates.",
  },
];

const today = new Date().toISOString().split("T")[0];

function RentalCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [renting, setRenting] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [addError, setAddError] = useState("");

  const sizes = product.sizes || [];
  const colors = product.colors || [];
  const deposit = product.rentalDeposit ?? 100;

  const rentalDays =
    startDate && endDate
      ? Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000))
      : 0;
  const totalRental = rentalDays * (product.rentalPricePerDay || 0);

  const minEndDate = startDate || today;

  const closePicker = () => {
    setRenting(false);
    setStartDate("");
    setEndDate("");
    setAddError("");
  };

  const handleAddRental = () => {
    if (!selectedSize) {
      setAddError("Please select a size");
      return;
    }
    if (!startDate || !endDate) {
      setAddError("Please select start and end dates");
      return;
    }
    addToCart({
      ...product,
      qty: 1,
      isRental: true,
      selectedSize,
      selectedColor,
      rentalDetails: {
        startDate,
        endDate,
        rentalDays,
        rentalPricePerDay: product.rentalPricePerDay,
      },
    });
    closePicker();
    setSelectedSize(null);
    setSelectedColor(null);
    navigate("/cart");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="group relative flex flex-col bg-background border border-border hover:border-foreground/40 transition-colors duration-500"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-cream/40">
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain p-6 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-0 left-0 bg-ink text-cream text-[9px] font-medium px-3 py-1.5 uppercase tracking-[0.2em]">
          Rental
        </div>
        <div className="absolute top-0 right-0 bg-background/90 backdrop-blur text-foreground text-[9px] px-3 py-1.5 uppercase tracking-[0.2em]">
          {product.category}
        </div>
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-ink/95 backdrop-blur px-4 py-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-cream/70">
            {product.gender}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-cream">
            {sizes.length} sizes
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-serif text-lg text-foreground leading-snug">{product.name}</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1.5 mb-3">
          {colors.length} {colors.length === 1 ? "colour" : "colours"} · insured
        </p>

        <div className="flex items-end gap-2 mb-4">
          <span className="font-serif text-2xl text-crimson leading-none">
            {parsePrice(product.rentalPricePerDay)}
          </span>
          <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground pb-0.5">
            / day
          </span>
          <span className="ml-auto text-xs text-muted-foreground line-through">
            {parsePrice(product.price)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSelectedSize(s);
                setAddError("");
              }}
              className={`text-[11px] w-8 h-8 border transition-colors ${
                selectedSize === s
                  ? "bg-ink text-cream border-ink"
                  : "border-border text-foreground hover:border-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {colors.length > 0 && (
          <div className="flex gap-2 mb-5">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                title={c}
                className={`w-4 h-4 rounded-full border transition-transform ${
                  selectedColor === c ? "scale-125 border-ink" : "border-border"
                }`}
                style={{ backgroundColor: colorMap[c] || "#ccc" }}
              />
            ))}
          </div>
        )}

        <div className="mt-auto">
          <AnimatePresence mode="wait">
            {!renting ? (
              <motion.button
                key="rent-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setRenting(true)}
                className="w-full justify-center btn-ink btn-ink-hover py-3 text-[11px] uppercase tracking-[0.2em]"
              >
                Rent Now
              </motion.button>
            ) : (
              <motion.div
                key="date-picker"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3 border-t border-border">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5 block">
                        From
                      </label>
                      <input
                        type="date"
                        min={today}
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setAddError("");
                          if (endDate && e.target.value > endDate) setEndDate("");
                        }}
                        className="w-full border border-border bg-background text-foreground px-2 py-2 text-xs focus:outline-none focus:border-ink"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5 block">
                        Until
                      </label>
                      <input
                        type="date"
                        min={minEndDate}
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setAddError("");
                        }}
                        className="w-full border border-border bg-background text-foreground px-2 py-2 text-xs focus:outline-none focus:border-ink"
                      />
                    </div>
                  </div>

                  {rentalDays > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-cream/60 border border-border p-3 text-xs space-y-1.5"
                    >
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rental</span>
                        <span>
                          {parsePrice(product.rentalPricePerDay)} × {rentalDays} days
                        </span>
                      </div>
                      <div className="flex justify-between font-medium text-foreground border-t border-border pt-1.5">
                        <span>Total</span>
                        <span>{parsePrice(totalRental)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground pt-0.5">
                        Refundable deposit of {parsePrice(deposit)} is held
                      </p>
                    </motion.div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={closePicker}
                      className="flex-1 py-2.5 text-[11px] uppercase tracking-[0.15em] border border-border text-foreground hover:bg-cream/40 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddRental}
                      className="flex-1 bg-ink text-cream py-2.5 text-[11px] uppercase tracking-[0.15em] hover:bg-crimson transition-colors"
                    >
                      Add to Bag
                    </button>
                  </div>

                  <p className={`text-[11px] ${addError ? "text-crimson" : "text-muted-foreground"}`}>
                    {addError || (!selectedSize || rentalDays === 0
                      ? "Select a size and dates to continue"
                      : "\u00a0")}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function Rental() {
  const { products } = useProducts();
  const [openFaq, setOpenFaq] = useState(0);
  const [activeCat, setActiveCat] = useState("All");

  const rentalProducts = useMemo(
    () => (products || []).filter((p) => p.rentalAvailable),
    [products]
  );

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(rentalProducts.map((p) => p.category)))],
    [rentalProducts]
  );

  const visibleProducts = useMemo(
    () =>
      activeCat === "All"
        ? rentalProducts
        : rentalProducts.filter((p) => p.category === activeCat),
    [rentalProducts, activeCat]
  );

  const collage = (rentalProducts.length ? rentalProducts : allProducts).slice(0, 3);
  const heroMain = collage[0]?.img;
  const heroSide = collage[1]?.img;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-ink text-cream overflow-hidden">
        <div className="absolute inset-0 opacity-[0.18] bg-[radial-gradient(circle_at_75%_25%,var(--crimson),transparent_60%)]" />
        <div className="relative max-w-[1600px] mx-auto px-6 lg:px-20 pt-28 pb-0 lg:pt-36">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-6"
            >
              <p className="eyebrow mb-6 flex items-center gap-3 text-cream/50">
                <span className="w-10 h-px bg-crimson" />
                Rental Service — Archive Access
              </p>
              <h1 className="text-display text-[clamp(3rem,7.5vw,6.5rem)] leading-[0.9] tracking-[-0.04em]">
                Rent <em className="text-crimson font-light italic">luxury</em>
                <span className="block">fashion</span>
              </h1>
              <p className="text-cream/60 text-base md:text-lg max-w-md mt-7 leading-relaxed">
                Wear the extraordinary without the commitment. Every piece is
                dry-cleaned, insured and delivered to your door — return it when
                the occasion is over.
              </p>

              <div className="flex flex-wrap items-center gap-5 mt-9">
                <a
                  href="#products"
                  className="group inline-flex items-center gap-3 bg-cream text-ink px-8 py-4 text-[11px] font-medium uppercase tracking-[0.2em] hover:bg-crimson hover:text-cream transition-colors duration-500"
                >
                  Explore Rentals
                  <ArrowRight className="w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="#how-it-works"
                  className="text-[11px] tracking-[0.2em] uppercase border-b border-cream/40 pb-1 hover:text-crimson hover:border-crimson transition-colors"
                >
                  How it works
                </a>
              </div>
            </motion.div>

            {/* Image collage */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.15 }}
              className="lg:col-span-6 relative"
            >
              <div className="relative aspect-[4/5] sm:aspect-[16/12] lg:aspect-[4/5] bg-cream/10 border border-cream/15 backdrop-blur-sm p-6 sm:p-10">
                {heroMain && (
                  <motion.img
                    src={heroMain}
                    alt={collage[0]?.name}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.1, delay: 0.3 }}
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                )}
                <div className="absolute bottom-5 left-5 bg-cream text-ink px-4 py-3">
                  <div className="eyebrow text-ink/60">Look 01</div>
                  <div className="font-serif text-base leading-tight">{collage[0]?.name}</div>
                </div>
                <div className="absolute top-5 right-5 text-right">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-cream/50">
                    From
                  </div>
                  <div className="font-serif text-2xl text-crimson">
                    {parsePrice(rentalProducts[0]?.rentalPricePerDay || 120)}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-cream/50">
                    per day
                  </div>
                </div>
              </div>

              {heroSide && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="hidden sm:block absolute -bottom-10 -left-6 lg:-left-10 w-32 lg:w-44 bg-cream p-2 shadow-2xl"
                >
                  <img
                    src={heroSide}
                    alt={collage[1]?.name}
                    className="w-full aspect-[3/4] object-contain"
                  />
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Stats strip */}
          <div className="mt-16 lg:mt-24 border-t border-cream/10 grid grid-cols-2 lg:grid-cols-4">
            {heroStats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + i * 0.1 }}
                className={`py-7 lg:py-8 px-2 lg:px-6 ${
                  i % 2 === 1 ? "border-l border-cream/10" : ""
                } ${i > 1 ? "border-t border-cream/10 lg:border-t-0" : ""} ${
                  i === 2 ? "lg:border-l lg:border-cream/10" : ""
                }`}
              >
                <div className="font-serif text-3xl lg:text-4xl text-cream flex items-baseline gap-1">
                  {s.value}
                  {s.star && <Star className="w-4 h-4 text-crimson fill-crimson self-center" />}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-cream/40 mt-2">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-[1600px] mx-auto px-6 lg:px-20 py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-14"
        >
          <p className="eyebrow mb-4">— Simple Process</p>
          <h2 className="text-display text-4xl md:text-5xl">
            How It <em className="text-crimson">Works</em>
          </h2>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            Three steps between you and the archive. No membership, no dry-cleaning
            bills, no storage.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-border">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="group relative border-r border-b border-border p-8 lg:p-10 hover:bg-cream/40 transition-colors duration-500"
            >
              <div className="flex items-start justify-between mb-8">
                <span className="font-serif text-5xl text-border group-hover:text-crimson transition-colors duration-500">
                  {step.num}
                </span>
                <span className="w-10 h-10 grid place-items-center border border-border text-foreground rounded-full group-hover:border-crimson group-hover:text-crimson transition-colors duration-500">
                  {step.icon}
                </span>
              </div>
              <h3 className="font-serif text-xl text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-border bg-secondary/40">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-20 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustBadges.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-start gap-4"
            >
              <span className="w-9 h-9 shrink-0 grid place-items-center bg-background border border-border text-crimson">
                <badge.icon className="w-4 h-4" />
              </span>
              <div>
                <div className="text-xs font-medium tracking-[0.15em] uppercase text-foreground">
                  {badge.label}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{badge.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-24 lg:py-32 px-6 lg:px-20 max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12"
        >
          <div className="max-w-xl">
            <p className="eyebrow mb-4">— Available for Rent</p>
            <h2 className="text-display text-4xl md:text-5xl">
              Curated <em className="text-crimson">Selection</em>
            </h2>
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              {rentalPiecesCopy(rentalProducts.length)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase border transition-all ${
                  activeCat === cat
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {visibleProducts.length === 0 ? (
          <div className="border border-dashed border-border py-20 text-center">
            <p className="font-serif text-2xl text-foreground mb-2">
              Nothing in the archive yet
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              We're still cataloguing pieces in this category.
            </p>
            <Link
              to="/collection"
              className="inline-block btn-ink btn-ink-hover text-[11px]"
            >
              Browse the Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleProducts.map((product) => (
              <RentalCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-cream/30">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-20 py-24 lg:py-32 grid lg:grid-cols-12 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-4"
          >
            <p className="eyebrow mb-4">— Questions</p>
            <h2 className="text-display text-4xl md:text-5xl">
              Rental <em className="text-crimson">FAQ</em>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mt-4 max-w-sm">
              Everything about sizing, deposits, extensions and returns. Still
              unsure? Our atelier team answers within a day.
            </p>
            <Link
              to="/journal"
              className="inline-flex items-center gap-2 mt-7 text-[11px] tracking-[0.2em] uppercase border-b border-foreground pb-1 hover:text-crimson hover:border-crimson transition-colors"
            >
              Read the Journal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          <div className="lg:col-span-8 lg:col-start-5">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="border-b border-border first:border-t"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-start justify-between gap-6 py-6 text-left group"
                >
                  <span className="flex items-start gap-5">
                    <span className="font-serif text-xs text-muted-foreground pt-1.5 tabular-nums">
                      0{i + 1}
                    </span>
                    <span className="font-serif text-lg md:text-xl text-foreground group-hover:text-crimson transition-colors">
                      {faq.q}
                    </span>
                  </span>
                  <motion.span
                    animate={{ rotate: openFaq === i ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="shrink-0 w-8 h-8 grid place-items-center border border-border text-foreground group-hover:border-crimson group-hover:text-crimson transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-muted-foreground text-sm leading-relaxed pb-7 pl-9 pr-10 max-w-2xl">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-ink text-cream overflow-hidden">
        {collage[2]?.img && (
          <img
            src={collage[2].img}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/50" />
        <div className="relative max-w-[1600px] mx-auto px-6 lg:px-20 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <p className="eyebrow mb-5 text-cream/50">— Your Next Occasion</p>
            <h2 className="text-display text-4xl md:text-6xl leading-[0.95]">
              Ready to wear the{" "}
              <em className="text-crimson">extraordinary?</em>
            </h2>
            <p className="text-cream/60 mt-6 max-w-md leading-relaxed">
              Reserve your dates now — popular pieces are booked weeks ahead for
              gala season.
            </p>
            <div className="flex flex-wrap gap-4 mt-9">
              <Link
                to="/collection"
                className="group inline-flex items-center gap-3 bg-cream text-ink px-8 py-4 text-[11px] font-medium uppercase tracking-[0.2em] hover:bg-crimson hover:text-cream transition-colors duration-500"
              >
                View Collection
                <ArrowRight className="w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#products"
                className="inline-flex items-center gap-3 border border-cream/30 px-8 py-4 text-[11px] uppercase tracking-[0.2em] hover:bg-cream/10 transition-colors"
              >
                Back to Rentals <ChevronRight className="w-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function rentalPiecesCopy(count) {
  if (!count) return "New pieces are added to the archive every week.";
  return `${count} piece${count === 1 ? "" : "s"} ready to reserve — dry cleaning and return shipping are always included.`;
}
