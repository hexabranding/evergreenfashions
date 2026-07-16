import { motion } from "framer-motion";
import { useState } from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { allProducts, colorMap, parsePrice } from "@/data/products";

const categories = ["All", "Dresses", "Apparel", "Shoes", "Menswear", "Womenswear"];

export default function Collection() {
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? allProducts
      : activeCategory === "Menswear"
      ? allProducts.filter((p) => p.gender === "Menswear")
      : activeCategory === "Womenswear"
      ? allProducts.filter((p) => p.gender === "Womenswear")
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
                ({cat === "Menswear"
                  ? allProducts.filter((p) => p.gender === "Menswear").length
                  : cat === "Womenswear"
                  ? allProducts.filter((p) => p.gender === "Womenswear").length
                  : allProducts.filter((p) => p.category === cat).length})
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
              key={`${p.id}-${i}`}
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
              <Link to={`/product/${p.id}`}>
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
                    {p.gender} · {p.category}
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
                <span className="font-serif text-lg">{parsePrice(p.price)}</span>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
