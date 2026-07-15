import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  Heart,
  X,
  Truck,
  ShieldCheck,
  RotateCcw,
  CreditCard,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import MobileNav from "./MobileNav";

const allProducts = [
  { name: "Écarlate Gown", price: "€1,290", tag: "Signature" },
  { name: "Noir Silhouette", price: "€890", tag: "New" },
  { name: "Camel Trench", price: "€1,150", tag: "Icon" },
  { name: "Émeraude Satin", price: "€1,420", tag: "Couture" },
  { name: "Ivoire Draped", price: "€980", tag: "New" },
  { name: "Bordeaux Velvet", price: "€1,650", tag: "Signature" },
  { name: "Perle Chiffon", price: "€1,100", tag: "Icon" },
  { name: "Sable Wrap", price: "€1,340", tag: "Couture" },
];

const menuCategories = [
  { label: "Men", path: "/collection" },
  { label: "Women", path: "/collection" },
  { label: "Rental", path: "/collection" },
  { label: "Footwear", path: "/collection" },
  { label: "Suits", path: "/collection" },
  { label: "Accessories", path: "/collection" },
  { label: "New Arrivals", path: "/collection" },
  { label: "Sale", path: "/collection" },
];

const menuBottom = [
  { label: "Atelier", path: "/atelier" },
  { label: "Journal", path: "/journal" },
];

const trustBadges = [
  { icon: Truck, label: "Free Shipping", sub: "On orders over €200" },
  { icon: ShieldCheck, label: "Secure Payment", sub: "SSL encrypted checkout" },
  { icon: RotateCcw, label: "Easy Returns", sub: "30-day return policy" },
  { icon: CreditCard, label: "Flexible Payment", sub: "Pay in 4 installments" },
];

const paymentMethods = [
  "Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay", "PayPal", "Klarna",
];

const footerShop = ["Dresses", "Gowns", "Outerwear", "Footwear", "Suits", "Accessories"];
const footerCompany = ["About Us", "Atelier", "Sustainability", "Careers", "Press"];
const footerHelp = ["Contact Us", "Shipping Info", "Returns", "Size Guide", "FAQ"];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    cartCount,
    wishlist,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
  } = useCart();
  const searchRef = useRef(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setResults(
        allProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.tag.toLowerCase().includes(q)
        )
      );
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 py-5 flex items-center justify-between">
          {/* Left — hamburger toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 flex items-center justify-center"
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <div className="flex flex-col gap-[5px]">
                <span className="w-[22px] h-[1.5px] bg-foreground block" />
                <span className="w-[22px] h-[1.5px] bg-foreground block" />
                <span className="w-[22px] h-[1.5px] bg-foreground block" />
              </div>
            )}
          </button>

          {/* Center — logo */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 text-lg md:text-xl lg:text-2xl tracking-[0.4em] font-serif"
          >
            EVERGREEN FASHION
          </Link>

          {/* Right — icons */}
          <div className="flex items-center gap-5">
            <button onClick={() => setSearchOpen(!searchOpen)}>
              <Search className="w-4 h-4" />
            </button>
            <Link to="/bag" className="relative">
              <Heart className={`w-4 h-4 ${wishlist.length > 0 ? "fill-crimson text-crimson" : ""}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-crimson text-cream text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-crimson text-cream text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[76px]" />

      {/* Search overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col items-center pt-24 px-6"
          onClick={() => {
            setSearchOpen(false);
            setSearchQuery("");
          }}
        >
          <div
            className="w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border-b-2 border-foreground pb-3">
              <Search className="w-5 h-5 mr-3 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-lg focus:outline-none"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="ml-3"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {results.length > 0 && (
              <div className="mt-6 flex flex-col gap-3">
                {results.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                      navigate(`/product/${encodeURIComponent(p.name)}`);
                    }}
                    className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/60 transition-colors text-left"
                  >
                    <div>
                      <div className="font-serif text-base">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">
                        {p.tag}
                      </div>
                    </div>
                    <span className="font-serif">{p.price}</span>
                  </button>
                ))}
              </div>
            )}
            {searchQuery && results.length === 0 && (
              <p className="mt-8 text-center text-muted-foreground text-sm">
                No products found for "{searchQuery}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mobile navigation overlay */}
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Page content */}
      <Outlet />

      {/* Trust badges */}
      <section className="border-t border-border bg-secondary/30">
        <div className="max-w-[1600px] mx-auto px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {trustBadges.map((badge) => (
            <div key={badge.label} className="flex items-start gap-4">
              <badge.icon className="w-5 h-5 mt-0.5 text-crimson shrink-0" />
              <div>
                <div className="text-xs font-medium tracking-wide uppercase">
                  {badge.label}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {badge.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-cream py-16 px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-14">
            <div>
              <div className="text-xl tracking-[0.35em] font-serif mb-4">
                EVERGREEN FASHION
              </div>
              <p className="text-xs opacity-50 leading-relaxed max-w-xs">
                Couture handcrafted in Paris since 1957. Unisex fashion that
                moves with you. A quiet revolt against the disposable.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-5">
                {paymentMethods.slice(0, 5).map((m) => (
                  <span
                    key={m}
                    className="text-[8px] border border-cream/20 px-1.5 py-0.5 rounded opacity-50"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="eyebrow mb-4 text-cream/70">Shop</div>
              <ul className="space-y-2.5 text-sm opacity-60">
                {footerShop.map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-crimson transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="eyebrow mb-4 text-cream/70">Company</div>
              <ul className="space-y-2.5 text-sm opacity-60">
                {footerCompany.map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-crimson transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="eyebrow mb-4 text-cream/70">Help</div>
              <ul className="space-y-2.5 text-sm opacity-60">
                {footerHelp.map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-crimson transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-cream/10 flex flex-wrap justify-between gap-4 text-[10px] tracking-[0.2em] uppercase opacity-40">
            <span>© MMXXVI Evergreen Fashion</span>
            <span>Paris · Milano · Tokyo · New York</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
