import { createContext, useContext, useState, useCallback, useEffect } from "react";

const CartContext = createContext();

const COUPONS = {
  WELCOME10: { type: "percent", value: 10, label: "10% OFF" },
  VIP20: { type: "percent", value: 20, label: "20% OFF" },
  FREESHIP: { type: "shipping", value: 0, label: "Free Shipping" },
  FLAT100: { type: "flat", value: 100, label: "€100 OFF" },
  NEWYEAR: { type: "percent", value: 15, label: "15% OFF" },
};

function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getItemPrice(item) {
  if (item.isRental && item.rentalDetails) {
    return item.rentalDetails.rentalPricePerDay * item.rentalDetails.rentalDays;
  }
  return typeof item.price === "number" ? item.price : parseFloat(String(item.price).replace("€", "").replace(",", ""));
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => loadState("ef_cart", []));
  const [wishlist, setWishlist] = useState(() => loadState("ef_wishlist", []));
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [order, setOrder] = useState(null);
  const [coupon, setCoupon] = useState(() => loadState("ef_coupon", null));
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    localStorage.setItem("ef_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem("ef_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (coupon) localStorage.setItem("ef_coupon", JSON.stringify(coupon));
    else localStorage.removeItem("ef_coupon");
  }, [coupon]);

  const addToCart = useCallback((product) => {
    setCartItems((prev) => {
      const key = `${product.name}-${product.selectedSize || ""}-${product.selectedColor || ""}-${product.isRental ? "rental" : ""}`;
      const exists = prev.find((item) => {
        const itemKey = `${item.name}-${item.selectedSize || ""}-${item.selectedColor || ""}-${item.isRental ? "rental" : ""}`;
        return itemKey === key;
      });
      if (exists) {
        return prev.map((item) => {
          const itemKey = `${item.name}-${item.selectedSize || ""}-${item.selectedColor || ""}-${item.isRental ? "rental" : ""}`;
          return itemKey === key ? { ...item, qty: item.qty + 1 } : item;
        });
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const buyNow = useCallback((product) => {
    setCartItems([{ ...product, qty: 1 }]);
  }, []);

  const removeFromCart = useCallback((name, size, color) => {
    setCartItems((prev) =>
      prev.filter((item) => {
        const key = `${item.name}-${item.selectedSize || ""}-${item.selectedColor || ""}-${item.isRental ? "rental" : ""}`;
        const target = `${name}-${size || ""}-${color || ""}-`;
        return !key.startsWith(target.replace(/-$/, ""));
      })
    );
  }, []);

  const updateQty = useCallback((name, size, color, qty) => {
    if (qty < 1) return;
    setCartItems((prev) =>
      prev.map((item) => {
        const key = `${item.name}-${item.selectedSize || ""}-${item.selectedColor || ""}-${item.isRental ? "rental" : ""}`;
        const target = `${name}-${size || ""}-${color || ""}-${item.isRental ? "rental" : ""}`;
        return key === target ? { ...item, qty } : item;
      })
    );
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item) * item.qty,
    0
  );

  const applyCoupon = useCallback((code) => {
    const upper = code.trim().toUpperCase();
    const found = COUPONS[upper];
    if (!found) {
      setCouponError("Invalid coupon code");
      setCoupon(null);
      return false;
    }
    setCoupon({ code: upper, ...found });
    setCouponError("");
    return true;
  }, []);

  const removeCoupon = useCallback(() => {
    setCoupon(null);
    setCouponError("");
  }, []);

  let discount = 0;
  let freeShipping = false;
  if (coupon) {
    if (coupon.type === "percent") {
      discount = Math.round(cartSubtotal * (coupon.value / 100));
    } else if (coupon.type === "flat") {
      discount = Math.min(coupon.value, cartSubtotal);
    } else if (coupon.type === "shipping") {
      freeShipping = true;
    }
  }

  const cartTotal = Math.max(0, cartSubtotal - discount);

  const placeOrder = useCallback(
    (shippingInfo, paymentMethod) => {
      const newOrder = {
        id: `EF-${Date.now().toString(36).toUpperCase()}`,
        items: [...cartItems],
        total: cartTotal,
        coupon: coupon ? coupon.code : null,
        discount,
        shipping: shippingInfo,
        payment: paymentMethod,
        status: "confirmed",
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        estimatedDelivery: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };
      setOrder(newOrder);
      setCartItems([]);
      setCoupon(null);
      return newOrder;
    },
    [cartItems, cartTotal, coupon, discount]
  );

  const toggleWishlist = useCallback((product) => {
    setWishlist((prev) => {
      const exists = prev.find((item) => item.name === product.name);
      if (exists) return prev.filter((item) => item.name !== product.name);
      return [...prev, product];
    });
  }, []);

  const isWishlisted = useCallback(
    (name) => wishlist.some((item) => item.name === name),
    [wishlist]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartSubtotal,
        cartTotal,
        addToCart,
        buyNow,
        removeFromCart,
        updateQty,
        order,
        placeOrder,
        wishlist,
        toggleWishlist,
        isWishlisted,
        searchOpen,
        setSearchOpen,
        searchQuery,
        setSearchQuery,
        coupon,
        couponError,
        applyCoupon,
        removeCoupon,
        discount,
        freeShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
