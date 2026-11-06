import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function Bag() {
  const { wishlist, toggleWishlist, addToCart } = useCart();

  return (
    <section className="max-w-[1600px] mx-auto px-8 py-20 min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-12"
      >
        <p className="eyebrow mb-4">— Wishlist</p>
        <h1 className="text-display text-5xl md:text-7xl">
          Your <em className="text-crimson">Bag</em>
        </h1>
      </motion.div>

      {wishlist.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-6">
            Your wishlist is empty.
          </p>
          <Link
            to="/collection"
            className="inline-flex items-center gap-3 btn-ink btn-ink-hover"
          >
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {wishlist.map((item, i) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group"
            >
              <div className="relative aspect-[3/4] bg-secondary overflow-hidden mb-3">
                <div className="absolute top-3 left-3 z-10 bg-background px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase">
                  {item.tag}
                </div>
                <button
                  onClick={() => toggleWishlist(item)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 bg-background/80 backdrop-blur rounded-full flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {item.img && (
                  <img
                    src={item.img}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-contain p-4 transition-transform duration-1000 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <button
                    onClick={() => {
                      addToCart(item);
                    }}
                    className="w-full bg-ink text-cream py-3 text-[10px] tracking-[0.25em] uppercase hover:bg-crimson transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    Move to Cart
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-serif text-lg">{item.name}</h3>
                </div>
                <span className="font-serif text-base">{item.price}</span>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
