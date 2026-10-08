import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingBag, Search, Heart, X, Truck, ShieldCheck, RotateCcw, CreditCard,
  User, LogOut, ChevronDown, ArrowUp, Check,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import MobileNav from "./MobileNav";
import MiniCart from "./MiniCart";
import { allProducts } from "@/data/products";
import { useProducts } from "@/context/ProductContext";

const menuCategories = [
  { label: "Men", path: "/collection" },
  { label: "Women", path: "/collection" },
  { label: "Rental", path: "/rental" },
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
  "Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay", "PayPal", "Klarna", "UPI",
];

const footerShop = ["Dresses", "Gowns", "Outerwear", "Footwear", "Suits", "Accessories"];
const footerCompany = ["About Us", "Atelier", "Sustainability", "Careers", "Press"];
const footerHelp = ["Contact Us", "Shipping Info", "Returns", "Size Guide", "FAQ"];
const footerSocials = ["Instagram", "Pinterest", "TikTok", "X"];
const footerCities = [
  { city: "Paris", address: "12 Rue de Rivoli" },
  { city: "Milano", address: "Via Montenapoleone 12" },
  { city: "Tokyo", address: "Minami-Aoyama 3-9" },
  { city: "New York", address: "SoHo, Greene Street" },
];

export default function Layout() {
  const { products } = useProducts();
  const [menuOpen, setMenuOpen] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    cartCount, wishlist, searchOpen, setSearchOpen, searchQuery, setSearchQuery,
  } = useCart();
  const { currentUser, isAuthenticated, logout, isAdmin, isVendor } = useAuth();
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const [results, setResults] = useState([]);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setResults(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.tag.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.gender.toLowerCase().includes(q) ||
            p.colors.some((c) => c.toLowerCase().includes(q)) ||
            String(p.price).includes(q)
        )
      );
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const groupedResults = results.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 py-5 flex items-center justify-between">
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 flex items-center justify-center">
            {menuOpen ? <X className="w-5 h-5" /> : (
              <div className="flex flex-col gap-[5px]">
                <span className="w-[22px] h-[1.5px] bg-foreground block" />
                <span className="w-[22px] h-[1.5px] bg-foreground block" />
                <span className="w-[22px] h-[1.5px] bg-foreground block" />
              </div>
            )}
          </button>

          <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-lg md:text-xl lg:text-2xl tracking-[0.4em] font-serif">
            EVERGREEN FASHION
          </Link>

          <div className="flex items-center gap-5">
            <button onClick={() => setSearchOpen(!searchOpen)}><Search className="w-4 h-4" /></button>
            <Link to="/bag" className="relative hidden sm:block">
              <Heart className={`w-4 h-4 ${wishlist.length > 0 ? "fill-crimson text-crimson" : ""}`} />
              {wishlist.length > 0 && <span className="absolute -top-2 -right-2 bg-crimson text-cream text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{wishlist.length}</span>}
            </Link>
            <button onClick={() => setMiniCartOpen(true)} className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-crimson text-cream text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>}
            </button>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase hover:text-crimson transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-ink text-cream flex items-center justify-center text-[10px] font-medium">
                    {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                  </div>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs font-medium">{currentUser?.firstName} {currentUser?.lastName}</p>
                      <p className="text-[10px] text-muted-foreground">{currentUser?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-secondary transition-colors">
                        <User className="w-3.5 h-3.5" /> My Account
                      </Link>
                      <Link to="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-secondary transition-colors">
                        <ShoppingBag className="w-3.5 h-3.5" /> My Orders
                      </Link>
                      {isVendor && (
                        <Link to="/vendor" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-secondary transition-colors">
                          <ShoppingBag className="w-3.5 h-3.5" /> Vendor Dashboard
                        </Link>
                      )}
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-secondary transition-colors">
                          <ShoppingBag className="w-3.5 h-3.5" /> Admin Dashboard
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-border py-1">
                      <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-secondary transition-colors w-full text-left text-crimson">
                        <LogOut className="w-3.5 h-3.5" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-[11px] tracking-wider uppercase hover:text-crimson transition-colors hidden sm:block">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="h-[76px]" />

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col items-center pt-24 px-6" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
          <div className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center border-b-2 border-foreground pb-3">
              <Search className="w-5 h-5 mr-3 shrink-0" />
              <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, category, color, price..." className="flex-1 bg-transparent text-lg focus:outline-none" />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="ml-3"><X className="w-5 h-5" /></button>
            </div>

            {results.length > 0 && (
              <div className="mt-6 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">
                {Object.entries(groupedResults).map(([category, items]) => (
                  <div key={category}>
                    <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3 font-medium">{category}</div>
                    <div className="flex flex-col gap-2">
                      {items.map((p) => (
                        <button key={p.name} onClick={() => { setSearchOpen(false); setSearchQuery(""); navigate(`/product/${p.id}`); }}
                          className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/60 transition-colors text-left"
                        >
                          <div>
                            <div className="font-serif text-base">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">{p.tag} · {p.colors.join(", ")}</div>
                          </div>
                          <span className="font-serif">€{p.price.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && results.length === 0 && (
              <p className="mt-8 text-center text-muted-foreground text-sm">No products found for "{searchQuery}"</p>
            )}

            {!searchQuery && (
              <div className="mt-8">
                <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Popular Searches</div>
                <div className="flex flex-wrap gap-2">
                  {["Dresses", "Shoes", "Gowns", "Jacket", "Trench", "Blazer", "Rental"].map((term) => (
                    <button key={term} onClick={() => setSearchQuery(term)}
                      className="px-3 py-1.5 border border-border text-[10px] tracking-wider uppercase hover:border-foreground transition-colors"
                    >{term}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <MiniCart open={miniCartOpen} onClose={() => setMiniCartOpen(false)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />

      <Outlet />

      {/* Trust badges */}
      <section className="border-t border-border bg-secondary/30">
        <div className="max-w-[1600px] mx-auto px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {trustBadges.map((badge) => (
            <div key={badge.label} className="flex items-start gap-4">
              <badge.icon className="w-5 h-5 mt-0.5 text-crimson shrink-0" />
              <div>
                <div className="text-xs font-medium tracking-wide uppercase">{badge.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{badge.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-cream">
        {/* Newsletter */}
        <div className="border-b border-cream/10">
          <div className="max-w-[1600px] mx-auto px-8 py-14 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-[10px] tracking-[0.35em] uppercase text-crimson mb-4">The Evergreen Letters</p>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight text-cream">
                Private previews, early access<br className="hidden md:block" /> to every new collection.
              </h2>
            </div>
            {newsletterSubscribed ? (
              <div className="flex items-center gap-3 border border-cream/25 px-6 py-4">
                <Check size={16} className="text-crimson" />
                <p className="text-sm text-cream/80">Welcome to the atelier. Your first letter arrives soon.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail.includes("@")) setNewsletterSubscribed(true);
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 bg-transparent border border-cream/25 px-5 py-4 text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:border-cream/60 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-cream text-ink px-8 py-4 text-[11px] tracking-[0.25em] uppercase font-medium hover:bg-crimson hover:text-cream transition-colors"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Link columns */}
        <div className="max-w-[1600px] mx-auto px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-10">
            <div className="col-span-2 lg:col-span-4">
              <div className="text-xl tracking-[0.35em] font-serif mb-5">EVERGREEN FASHION</div>
              <p className="text-xs text-cream/50 leading-relaxed max-w-xs">
                Couture handcrafted in Paris since 1957. Unisex fashion that moves with you. A quiet revolt against the disposable.
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-7">
                {footerSocials.map((s) => (
                  <button
                    key={s}
                    className="text-[10px] tracking-[0.25em] uppercase text-cream/50 hover:text-crimson transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-7">
                {paymentMethods.map((m) => (
                  <span key={m} className="text-[8px] tracking-widest border border-cream/20 px-2 py-1 text-cream/60">
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2">
              <p className="text-[10px] tracking-[0.3em] uppercase text-cream/40 mb-5">Shop</p>
              <ul className="space-y-3 text-sm text-cream/70">
                {footerShop.map((item) => (
                  <li key={item}>
                    <button className="hover:text-crimson transition-colors">{item}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-2">
              <p className="text-[10px] tracking-[0.3em] uppercase text-cream/40 mb-5">Company</p>
              <ul className="space-y-3 text-sm text-cream/70">
                {footerCompany.map((item) => (
                  <li key={item}>
                    <button className="hover:text-crimson transition-colors">{item}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-2">
              <p className="text-[10px] tracking-[0.3em] uppercase text-cream/40 mb-5">Help</p>
              <ul className="space-y-3 text-sm text-cream/70">
                {footerHelp.map((item) => (
                  <li key={item}>
                    <button className="hover:text-crimson transition-colors">{item}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-2">
              <p className="text-[10px] tracking-[0.3em] uppercase text-cream/40 mb-5">Ateliers</p>
              <ul className="space-y-3 text-sm text-cream/70">
                {footerCities.map((c) => (
                  <li key={c.city}>
                    <p className="font-serif">{c.city}</p>
                    <p className="text-[10px] text-cream/40 mt-0.5">{c.address}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-cream/10">
          <div className="max-w-[1600px] mx-auto px-8 py-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-cream/40">© MMXXVI Evergreen Fashion</p>
            <p className="text-[10px] tracking-[0.2em] uppercase text-cream/40">Paris · Milano · Tokyo · New York</p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-cream/60 hover:text-crimson transition-colors"
            >
              Back to top <ArrowUp size={12} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
