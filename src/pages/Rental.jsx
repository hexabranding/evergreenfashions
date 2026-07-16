import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Truck, ShieldCheck, Star, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { allProducts, colorMap, parsePrice } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";

const rentalProducts = allProducts.filter((p) => p.rentalAvailable);

const steps = [
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Choose Your Piece",
    desc: "Browse our curated collection of luxury fashion available for rent",
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: "Select Your Dates",
    desc: "Pick your rental period, from 3 days to 2 weeks",
  },
  {
    icon: <Truck className="w-6 h-6" />,
    title: "Ship & Return",
    desc: "We ship to you, you enjoy, then return with prepaid label",
  },
];

const trustBadges = [
  "Dry Cleaning Included",
  "Insurance Covered",
  "Free Return Shipping",
  "Flexible Extensions",
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

  const rentalDays =
    startDate && endDate
      ? Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000))
      : 0;
  const totalRental = rentalDays * (product.rentalPricePerDay || 0);

  const minEndDate = startDate || today;

  const handleAddRental = () => {
    if (!selectedSize || !startDate || !endDate) return;
    addToCart({
      ...product,
      qty: 1,
      selectedSize,
      selectedColor,
      rentalDetails: {
        startDate,
        endDate,
        rentalDays,
        rentalPricePerDay: product.rentalPricePerDay,
      },
    });
    setRenting(false);
    setStartDate("");
    setEndDate("");
    setSelectedSize(null);
    setSelectedColor(null);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group relative bg-background border border-border rounded-sm overflow-hidden"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={product.img}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 bg-ink text-cream text-xs font-medium px-3 py-1 uppercase tracking-widest">
          Rental
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-serif text-lg text-foreground mb-1">{product.name}</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-muted-foreground line-through text-sm">{parsePrice(product.price)}</span>
          <span className="text-crimson font-medium">{parsePrice(product.rentalPricePerDay)}/day</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {product.sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSize(s)}
              className={`text-xs px-2 py-1 border transition-colors ${
                selectedSize === s
                  ? "bg-ink text-cream border-ink"
                  : "border-border text-foreground hover:border-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {product.colors && (
          <div className="flex gap-1.5 mb-4">
            {product.colors.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                title={c}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${
                  selectedColor === c ? "scale-125 border-ink" : "border-border"
                }`}
                style={{ backgroundColor: colorMap[c] || "#ccc" }}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!renting ? (
            <motion.button
              key="rent-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRenting(true)}
              className="w-full btn-ink btn-ink-hover py-3 text-sm uppercase tracking-widest"
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
              <div className="pt-2 space-y-3">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Start Date</label>
                  <input
                    type="date"
                    min={today}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate && e.target.value > endDate) setEndDate("");
                    }}
                    className="w-full border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">End Date</label>
                  <input
                    type="date"
                    min={minEndDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:border-ink"
                  />
                </div>

                {rentalDays > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-cream/50 border border-border p-3 text-sm space-y-1"
                  >
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rental price</span>
                      <span>{parsePrice(product.rentalPricePerDay)}/day × {rentalDays} days</span>
                    </div>
                    <div className="flex justify-between font-medium text-foreground border-t border-border pt-1">
                      <span>Total</span>
                      <span>{parsePrice(totalRental)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      A refundable deposit of €100 will be held
                    </p>
                  </motion.div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setRenting(false);
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="flex-1 py-2 text-sm border border-border text-foreground hover:bg-cream/30 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRental}
                    disabled={!selectedSize || rentalDays === 0}
                    className="flex-1 btn-ink btn-ink-hover py-2 text-sm uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function Rental() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center bg-ink text-cream overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 to-ink/90" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-6 max-w-3xl"
        >
          <p className="eyebrow mb-6">— Rental Service</p>
          <h1 className="text-display text-5xl md:text-7xl lg:text-8xl mb-6">
            Rent <em className="text-crimson">Luxury</em> Fashion
          </h1>
          <p className="text-cream/70 text-lg md:text-xl max-w-xl mx-auto mb-10">
            Access the world's finest garments without the commitment. Wear the extraordinary, return when done.
          </p>
          <a
            href="#products"
            className="inline-block border border-cream/40 text-cream px-10 py-4 text-sm uppercase tracking-[0.2em] hover:bg-cream hover:text-ink transition-all duration-500"
          >
            Explore Rentals
          </a>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="eyebrow mb-4">— Simple Process</p>
          <h2 className="text-display text-4xl md:text-5xl">How It <em className="text-crimson">Works</em></h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto mb-5 flex items-center justify-center border border-border text-foreground rounded-full">
                {step.icon}
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-[0.3em]">Step {i + 1}</span>
              <h3 className="font-serif text-xl mt-2 mb-3 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-border bg-cream/30 py-10">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustBadges.map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex items-center gap-3 justify-center"
            >
              <ShieldCheck className="w-5 h-5 text-crimson flex-shrink-0" />
              <span className="text-sm text-foreground">{badge}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-24 px-6 max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="eyebrow mb-4">— Available for Rent</p>
          <h2 className="text-display text-4xl md:text-5xl">
            Curated <em className="text-crimson">Selection</em>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {rentalProducts.map((product) => (
            <RentalCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 max-w-[800px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="eyebrow mb-4">— Questions</p>
          <h2 className="text-display text-4xl md:text-5xl">
            Rental <em className="text-crimson">FAQ</em>
          </h2>
        </motion.div>

        <div>
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="border-b border-border"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-6 text-left group"
              >
                <span className="font-serif text-lg text-foreground pr-8 group-hover:text-crimson transition-colors">
                  {faq.q}
                </span>
                <motion.span
                  animate={{ rotate: openFaq === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-muted-foreground flex-shrink-0"
                >
                  <ChevronRight className="w-5 h-5 -rotate-90" />
                </motion.span>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-muted-foreground text-sm leading-relaxed pb-6">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cream/30 border-t border-border py-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-display text-3xl md:text-4xl mb-6">
            Ready to <em className="text-crimson">Wear</em> the Extraordinary?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-10">
            Browse our full collection and find the perfect piece for your next occasion.
          </p>
          <Link
            to="/collection"
            className="inline-block btn-ink btn-ink-hover px-12 py-4 text-sm uppercase tracking-[0.2em]"
          >
            View Collection
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
