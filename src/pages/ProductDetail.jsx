import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, Star, Truck, ShieldCheck, RotateCcw, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import dressHero from "@/assets/dress-hero.png";
import dress2 from "@/assets/dress-2.png";
import dress3 from "@/assets/dress-3.png";
import dress4 from "@/assets/dress-4.png";

const allProducts = [
  { name: "Écarlate Gown", price: "€1,290", tag: "Signature", img: dressHero, colors: ["Red", "Black", "Ivory", "Navy"], sizes: ["XS", "S", "M", "L", "XL"], desc: "Flowing silk chiffon gown cut on the bias. Hand-finished in our Parisian atelier with French seams throughout." },
  { name: "Noir Silhouette", price: "€890", tag: "New", img: dress2, colors: ["Black", "Charcoal"], sizes: ["XS", "S", "M", "L"], desc: "Structured wool-blend silhouette with architectural draping. A modern take on the classic black dress." },
  { name: "Camel Trench", price: "€1,150", tag: "Icon", img: dress3, colors: ["Camel", "Black", "Olive", "Burgundy", "Navy"], sizes: ["S", "M", "L", "XL"], desc: "Double-breasted trench in Italian cashmere-wool. Timeless design refined over three decades." },
  { name: "Émeraude Satin", price: "€1,420", tag: "Couture", img: dress4, colors: ["Emerald", "Ruby"], sizes: ["XS", "S", "M"], desc: "Duchesse satin evening piece with hand-draped bodice. Each piece requires 68 hours of hand-stitching." },
  { name: "Ivoire Draped", price: "€980", tag: "New", img: dressHero, colors: ["Ivory", "Blush", "Sage"], sizes: ["XS", "S", "M", "L"], desc: "Bias-cut silk crepe with asymmetric draping. Effortless elegance for every occasion." },
  { name: "Bordeaux Velvet", price: "€1,650", tag: "Signature", img: dress2, colors: ["Bordeaux", "Midnight"], sizes: ["S", "M", "L"], desc: "Silk velvet jacket with satin lining. Hand-tailored in our atelier with horn buttons." },
  { name: "Perle Chiffon", price: "€1,100", tag: "Icon", img: dress3, colors: ["Pearl", "Dove", "Champagne", "Black"], sizes: ["XS", "S", "M", "L", "XL"], desc: "Layered silk chiffon dress with delicate pleating. Moves like a second breath." },
  { name: "Sable Wrap", price: "€1,340", tag: "Couture", img: dress4, colors: ["Sand", "Espresso", "Cream"], sizes: ["S", "M", "L"], desc: "Cashmere-silk wrap coat with hand-rolled edges. The ultimate layering piece." },
];

function parsePrice(p) {
  return parseFloat(p.replace("€", "").replace(",", ""));
}

export default function ProductDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { addToCart, buyNow, toggleWishlist, isWishlisted } = useCart();

  const product = allProducts.find(
    (p) => p.name.toLowerCase().replace(/\s+/g, "-") === name
  );

  if (!product) {
    return (
      <section className="max-w-[1600px] mx-auto px-8 py-20 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-6">Product not found.</p>
          <Link to="/collection" className="btn-ink btn-ink-hover">
            Back to Collection
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-[1600px] mx-auto px-8 py-12">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-10"
      >
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back
        </button>
        <span>/</span>
        <Link to="/collection" className="hover:text-foreground transition-colors">Collection</Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative aspect-[3/4] bg-secondary overflow-hidden"
        >
          <div className="absolute top-4 left-4 z-10 bg-background px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase">
            {product.tag}
          </div>
          <button
            onClick={() => toggleWishlist(product)}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-background/80 backdrop-blur rounded-full flex items-center justify-center"
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted(product.name) ? "fill-crimson text-crimson" : ""}`}
            />
          </button>
          <img
            src={product.img}
            alt={product.name}
            className="w-full h-full object-contain p-8"
          />
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="flex flex-col"
        >
          <div className="mb-1">
            <span className="eyebrow text-crimson">{product.tag}</span>
          </div>
          <h1 className="text-display text-4xl md:text-5xl lg:text-6xl mb-3">
            {product.name}
          </h1>
          <div className="font-serif text-2xl text-muted-foreground mb-6">
            {product.price}
          </div>

          <p className="text-muted-foreground leading-relaxed mb-8 max-w-lg">
            {product.desc}
          </p>

          {/* Colors */}
          <div className="mb-6">
            <div className="text-[11px] tracking-[0.2em] uppercase font-medium mb-3">
              Color — <span className="text-muted-foreground">{product.colors[0]}</span>
            </div>
            <div className="flex gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  title={c}
                  className="w-8 h-8 rounded-full border border-border hover:border-foreground transition-colors"
                  style={{
                    background:
                      c === "Black"
                        ? "#1a1a1a"
                        : c === "Red" || c === "Ruby"
                        ? "#b41e28"
                        : c === "Ivory" || c === "Cream" || c === "Pearl" || c === "Champagne"
                        ? "#f5f0e8"
                        : c === "Navy"
                        ? "#1a2744"
                        : c === "Camel"
                        ? "#c4a46c"
                        : c === "Olive"
                        ? "#5c5c3d"
                        : c === "Burgundy" || c === "Bordeaux"
                        ? "#6b1d3a"
                        : c === "Charcoal"
                        ? "#4a4a4a"
                        : c === "Emerald"
                        ? "#2d6a4f"
                        : c === "Blush"
                        ? "#e8c4c4"
                        : c === "Sage"
                        ? "#9caf88"
                        : c === "Midnight"
                        ? "#1a1a2e"
                        : c === "Dove"
                        ? "#b0b0a8"
                        : c === "Sand"
                        ? "#c2b280"
                        : c === "Espresso"
                        ? "#3c2415"
                        : "#ccc",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="mb-8">
            <div className="text-[11px] tracking-[0.2em] uppercase font-medium mb-3">
              Size
            </div>
            <div className="flex gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  className="w-12 h-12 border border-border text-xs tracking-wider hover:border-foreground hover:bg-foreground hover:text-background transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button
              onClick={() => {
                addToCart(product);
                navigate("/cart");
              }}
              className="flex-1 bg-ink text-cream py-4 text-[11px] tracking-[0.25em] uppercase hover:bg-crimson transition-colors"
            >
              Add to Cart
            </button>
            <button
              onClick={() => {
                buyNow(product);
                navigate("/checkout");
              }}
              className="flex-1 border-2 border-ink py-4 text-[11px] tracking-[0.25em] uppercase hover:bg-ink hover:text-cream transition-colors"
            >
              Buy Now
            </button>
          </div>

          {/* Trust */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-crimson shrink-0" />
              <span className="text-[10px] text-muted-foreground">Free Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-crimson shrink-0" />
              <span className="text-[10px] text-muted-foreground">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-crimson shrink-0" />
              <span className="text-[10px] text-muted-foreground">30-Day Returns</span>
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-crimson text-crimson" />
              ))}
              <span className="text-xs text-muted-foreground ml-1">4.9 (127 reviews)</span>
            </div>
            <p className="text-sm text-muted-foreground">
              "The most beautiful piece I've ever owned. The silk moves like water."
              <span className="block mt-1 text-[10px] tracking-wider uppercase">— Isabelle M., Paris</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
