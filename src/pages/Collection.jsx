import { motion } from "framer-motion";
import { useState } from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import dressHero from "@/assets/dress-hero.png";
import dress2 from "@/assets/dress-2.png";
import dress3 from "@/assets/dress-3.png";
import dress4 from "@/assets/dress-4.png";

const categories = ["All", "Gowns", "Outerwear", "Dresses", "Coats", "Accessories"];

const colorMap = {
  Red: "#b41e28",
  Black: "#1a1a1a",
  Ivory: "#f5f0e8",
  Navy: "#1a2744",
  Charcoal: "#4a4a4a",
  Camel: "#c4a46c",
  Olive: "#5c5c3d",
  Burgundy: "#6b1d3a",
  Emerald: "#2d6a4f",
  Ruby: "#9b111e",
  Blush: "#e8c4c4",
  Sage: "#9caf88",
  Bordeaux: "#6b1d3a",
  Midnight: "#1a1a2e",
  Pearl: "#f0ead6",
  Dove: "#b0b0a8",
  Champagne: "#f7e7ce",
  Sand: "#c2b280",
  Espresso: "#3c2415",
  Cream: "#fffdd0",
};

const allProducts = [
  { name: "Écarlate Gown", price: "€1,290", tag: "Signature", img: dressHero, category: "Gowns", colors: ["Red", "Black", "Ivory", "Navy"] },
  { name: "Noir Silhouette", price: "€890", tag: "New", img: dress2, category: "Dresses", colors: ["Black", "Charcoal"] },
  { name: "Camel Trench", price: "€1,150", tag: "Icon", img: dress3, category: "Outerwear", colors: ["Camel", "Black", "Olive", "Burgundy", "Navy"] },
  { name: "Émeraude Satin", price: "€1,420", tag: "Couture", img: dress4, category: "Gowns", colors: ["Emerald", "Ruby"] },
  { name: "Ivoire Draped", price: "€980", tag: "New", img: dressHero, category: "Dresses", colors: ["Ivory", "Blush", "Sage"] },
  { name: "Bordeaux Velvet", price: "€1,650", tag: "Signature", img: dress2, category: "Coats", colors: ["Bordeaux", "Midnight"] },
  { name: "Perle Chiffon", price: "€1,100", tag: "Icon", img: dress3, category: "Dresses", colors: ["Pearl", "Dove", "Champagne", "Black"] },
  { name: "Sable Wrap", price: "€1,340", tag: "Couture", img: dress4, category: "Outerwear", colors: ["Sand", "Espresso", "Cream"] },
];

export default function Collection() {
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? allProducts
      : allProducts.filter((p) => p.category === activeCategory);

  return (
    <section className="max-w-[1600px] mx-auto px-8 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-10"
      >
        <p className="eyebrow mb-4">— Fall / Winter 2026</p>
        <h1 className="text-display text-6xl md:text-8xl">
          The <em className="text-crimson">Collection</em>
        </h1>
        <p className="text-muted-foreground mt-6 max-w-lg leading-relaxed">
          Silhouettes from our latest atelier. Each piece hand-cut and
          draped in our Parisian workshops — designed to move with you.
        </p>
      </motion.div>

      {/* Category filter */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="flex flex-wrap gap-2 mb-12"
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase border transition-all ${
              activeCategory === cat
                ? "bg-ink text-cream border-ink"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {cat}
            {cat !== "All" && (
              <span className="ml-1.5 text-[9px] opacity-60">
                ({allProducts.filter((p) => p.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Product count */}
      <div className="text-[11px] text-muted-foreground tracking-wider uppercase mb-6">
        {filtered.length} {filtered.length === 1 ? "piece" : "pieces"} available
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No products in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
          {filtered.map((p, i) => (
            <motion.article
              key={`${p.name}-${i}`}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.9,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group cursor-pointer"
            >
              <Link to={`/product/${p.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="relative aspect-[3/4] bg-secondary overflow-hidden mb-4">
                  <div className="absolute top-4 left-4 z-10 bg-background px-3 py-1 text-[10px] tracking-[0.2em] uppercase">
                    {p.tag}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleWishlist(p);
                    }}
                    className="absolute top-4 right-4 z-10 w-9 h-9 bg-background/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart
                      className={`w-4 h-4 ${isWishlisted(p.name) ? "fill-crimson text-crimson" : ""}`}
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
                <div className="flex-1">
                  <h3 className="font-serif text-xl">{p.name}</h3>
                  <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1">
                    {p.category}
                  </p>
                  {/* Color swatches */}
                  <div className="flex gap-1.5 mt-2">
                    {p.colors.map((c) => (
                      <span
                        key={c}
                        title={c}
                        className="w-3.5 h-3.5 rounded-full border border-border/60"
                        style={{ background: colorMap[c] || "#ccc" }}
                      />
                    ))}
                  </div>
                </div>
                <span className="font-serif text-lg">{p.price}</span>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
