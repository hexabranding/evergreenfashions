import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, Star, Truck, ShieldCheck, RotateCcw, ArrowLeft, Ruler, Calendar } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";
import SizeGuide from "@/components/SizeGuide";
import { allProducts, colorMap, parsePrice } from "@/data/products";

function getColorHex(c) {
  return colorMap[c] || "#ccc";
}

export default function ProductDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { addToCart, buyNow, toggleWishlist, isWishlisted } = useCart();
  const { getAverageRating, getReviewsByProduct } = useOrders();
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [mainImage, setMainImage] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [showRental, setShowRental] = useState(false);
  const [rentalStart, setRentalStart] = useState("");
  const [rentalEnd, setRentalEnd] = useState("");

  const product = allProducts.find((p) => p.id === name);

  useEffect(() => {
    if (product?.colors?.length && !selectedColor) {
      setSelectedColor(product.colors[0]);
    }
  }, [product, selectedColor]);

  if (!product) {
    return (
      <section className="max-w-[1600px] mx-auto px-8 py-20 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-6">Product not found.</p>
          <Link to="/collection" className="btn-ink btn-ink-hover">Back to Collection</Link>
        </div>
      </section>
    );
  }

  const isShoe = product.category === "Shoes";
  const productImages = product.images || [product.img];
  const avgRating = getAverageRating(product.id);
  const reviews = getReviewsByProduct(product.id);

  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.name !== product.name)
    .slice(0, 4);

  const productWithSelection = {
    ...product,
    selectedSize,
    selectedColor: selectedColor || product.colors[0],
  };

  const rentalDays = rentalStart && rentalEnd
    ? Math.max(1, Math.ceil((new Date(rentalEnd) - new Date(rentalStart)) / (1000 * 60 * 60 * 24)))
    : 0;
  const rentalTotal = rentalDays * (product.rentalPricePerDay || 0);

  const handleRentNow = () => {
    const rentalItem = {
      ...productWithSelection,
      qty: 1,
      isRental: true,
      rentalDetails: {
        startDate: rentalStart,
        endDate: rentalEnd,
        rentalDays,
        rentalPricePerDay: product.rentalPricePerDay,
      },
    };
    addToCart(rentalItem);
    navigate("/cart");
  };

  return (
    <section className="max-w-[1600px] mx-auto px-8 py-12">
      <SizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} type={isShoe ? "shoe" : "clothing"} />

      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back
        </button>
        <span>/</span>
        <Link to="/collection" className="hover:text-foreground transition-colors">Collection</Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Image Gallery */}
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          {/* Thumbnails */}
          <div className="flex gap-3 mb-4">
            {productImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setMainImage(i)}
                className={`w-16 h-20 bg-secondary overflow-hidden border-2 transition-colors ${
                  mainImage === i ? "border-foreground" : "border-transparent hover:border-border"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-contain p-1" />
              </button>
            ))}
          </div>

          {/* Main image */}
          <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
            <div className="absolute top-4 left-4 z-10 bg-background px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase">
              {product.tag}
            </div>
            <button
              onClick={() => toggleWishlist(product)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-background/80 backdrop-blur rounded-full flex items-center justify-center"
            >
              <Heart className={`w-4 h-4 ${isWishlisted(product.name) ? "fill-crimson text-crimson" : ""}`} />
            </button>
            <motion.img
              key={mainImage}
              src={productImages[mainImage]}
              alt={product.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-contain p-8"
            />
          </div>
        </motion.div>

        {/* Details */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.15 }} className="flex flex-col">
          <div className="mb-1"><span className="eyebrow text-crimson">{product.tag}</span></div>
          <h1 className="text-display text-4xl md:text-5xl lg:text-6xl mb-3">{product.name}</h1>
          <div className="flex items-center gap-4 mb-6">
            <span className="font-serif text-2xl text-muted-foreground">{parsePrice(product.price)}</span>
            {product.rentalAvailable && (
              <span className="text-[11px] tracking-wider uppercase text-crimson border border-crimson/30 px-3 py-1">
                Rent from {parsePrice(product.rentalPricePerDay)}/day
              </span>
            )}
          </div>
          <p className="text-muted-foreground leading-relaxed mb-8 max-w-lg">{product.description}</p>

          {/* Stock info */}
          {selectedSize && product.stock && (
            <div className="mb-4">
              {product.stock[selectedSize] > 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  {product.stock[selectedSize] > 5 ? "In Stock" : `Only ${product.stock[selectedSize]} left`}
                </p>
              ) : (
                <p className="text-[11px] text-crimson font-medium">Out of Stock</p>
              )}
            </div>
          )}

          {/* Colors */}
          <div className="mb-6">
            <div className="text-[11px] tracking-[0.2em] uppercase font-medium mb-3">
              Color — <span className="text-muted-foreground">{selectedColor || product.colors[0]}</span>
            </div>
            <div className="flex gap-2">
              {product.colors.map((c) => (
                <button key={c} title={c} onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-full border transition-colors ${(selectedColor || product.colors[0]) === c ? "border-foreground ring-2 ring-foreground/20" : "border-border hover:border-foreground"}`}
                  style={{ background: getColorHex(c) }}
                />
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-[11px] tracking-[0.2em] uppercase font-medium">
                Size{selectedSize ? ` — ${selectedSize}` : ""}
              </div>
              <button onClick={() => setSizeGuideOpen(true)} className="flex items-center gap-1 text-[10px] tracking-wider uppercase text-crimson hover:underline">
                <Ruler className="w-3 h-3" /> Size Guide
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {product.sizes.map((s) => {
                const inStock = product.stock ? (product.stock[s] || 0) > 0 : true;
                return (
                  <button key={s} onClick={() => inStock && setSelectedSize(s)}
                    disabled={!inStock}
                    className={`w-12 h-12 border text-xs tracking-wider transition-all ${
                      !inStock ? "border-border text-muted-foreground/40 cursor-not-allowed line-through" :
                      selectedSize === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground hover:bg-foreground hover:text-background"
                    }`}
                  >{s}</button>
                );
              })}
            </div>
          </div>

          {/* Rental Section */}
          {product.rentalAvailable && (
            <div className="border border-crimson/20 bg-crimson/5 p-4 mb-6 mt-4">
              <button
                onClick={() => setShowRental(!showRental)}
                className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase font-medium text-crimson"
              >
                <Calendar className="w-4 h-4" />
                {showRental ? "Hide Rental Options" : "Rent This Item"}
              </button>
              {showRental && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] tracking-wider uppercase text-muted-foreground mb-1 block">Start Date</label>
                      <input
                        type="date"
                        value={rentalStart}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setRentalStart(e.target.value)}
                        className="w-full border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-wider uppercase text-muted-foreground mb-1 block">End Date</label>
                      <input
                        type="date"
                        value={rentalEnd}
                        min={rentalStart || new Date().toISOString().split("T")[0]}
                        onChange={(e) => setRentalEnd(e.target.value)}
                        className="w-full border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                      />
                    </div>
                  </div>
                  {rentalDays > 0 && (
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>{parsePrice(product.rentalPricePerDay)} × {rentalDays} days</span>
                        <span>{parsePrice(rentalTotal)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Refundable deposit</span>
                        <span>€100</span>
                      </div>
                      <div className="flex justify-between font-serif text-base pt-1 border-t border-border">
                        <span>Total</span>
                        <span>{parsePrice(rentalTotal + 100)}</span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleRentNow}
                    disabled={!rentalStart || !rentalEnd || !selectedSize}
                    className="w-full bg-crimson text-cream py-3 text-[11px] tracking-[0.25em] uppercase hover:bg-crimson/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Rental to Cart
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8 mt-4">
            <button
              onClick={() => { addToCart(productWithSelection); navigate("/cart"); }}
              disabled={selectedSize && product.stock && (product.stock[selectedSize] || 0) === 0}
              className="flex-1 bg-ink text-cream py-4 text-[11px] tracking-[0.25em] uppercase hover:bg-crimson transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Cart
            </button>
            <button
              onClick={() => { buyNow(productWithSelection); navigate("/checkout"); }}
              disabled={selectedSize && product.stock && (product.stock[selectedSize] || 0) === 0}
              className="flex-1 border-2 border-ink py-4 text-[11px] tracking-[0.25em] uppercase hover:bg-ink hover:text-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>
          </div>

          {/* Trust */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border">
            <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-crimson shrink-0" /><span className="text-[10px] text-muted-foreground">Free Shipping</span></div>
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-crimson shrink-0" /><span className="text-[10px] text-muted-foreground">Secure Payment</span></div>
            <div className="flex items-center gap-2"><RotateCcw className="w-4 h-4 text-crimson shrink-0" /><span className="text-[10px] text-muted-foreground">30-Day Returns</span></div>
          </div>

          {/* Reviews */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(avgRating) ? "fill-crimson text-crimson" : "text-muted-foreground"}`} />)}
              <span className="text-xs text-muted-foreground ml-1">{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
            </div>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="border-b border-border pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className={`w-2.5 h-2.5 ${i < r.rating ? "fill-crimson text-crimson" : ""}`} />)}
                      <span className="text-[10px] text-muted-foreground">{r.userName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.comment}</p>
                    {r.vendorReply && (
                      <p className="text-[10px] text-foreground mt-2 ml-4 italic">Reply: {r.vendorReply}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                "The most beautiful piece I've ever owned. The silk moves like water."
                <span className="block mt-1 text-[10px] tracking-wider uppercase">— Isabelle M., Paris</span>
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* You May Also Like */}
      {relatedProducts.length > 0 && (
        <div className="mt-24">
          <div className="mb-10">
            <p className="eyebrow mb-3">— You May Also Like</p>
            <h2 className="text-display text-3xl md:text-4xl">Related <em className="text-crimson">pieces.</em></h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {relatedProducts.map((p, i) => (
              <motion.article key={p.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.1 }} className="group cursor-pointer">
                <Link to={`/product/${p.id}`}>
                  <div className="relative aspect-[3/4] bg-secondary overflow-hidden mb-3">
                    <div className="absolute top-3 left-3 z-10 bg-background px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase">{p.tag}</div>
                    <motion.img src={p.img} alt={p.name} loading="lazy" className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105" />
                  </div>
                </Link>
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-serif text-lg">{p.name}</h3>
                    <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1">{p.colors.length} Colors · {p.sizes.length} Sizes</p>
                  </div>
                  <span className="font-serif text-base">{parsePrice(p.price)}</span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
