import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useOrders } from "@/context/OrderContext";
import { useAuth } from "@/context/AuthContext";
import { ordersApi } from "@/api/orders";

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

function isInlineImage(value) {
  return typeof value === "string" && value.startsWith("data:");
}

function saveState(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Large uploaded images must never make the cart provider crash.
    console.warn(`Could not persist ${key} locally.`, error);
  }
}

function compactProduct(product) {
  return {
    ...product,
    img: isInlineImage(product.img) ? "" : product.img,
    images: (product.images || []).filter((image) => !isInlineImage(image)),
  };
}

function getItemPrice(item) {
  if (item.isRental && item.rentalDetails) {
    return item.rentalDetails.rentalPricePerDay * item.rentalDetails.rentalDays;
  }
  return typeof item.price === "number" ? item.price : parseFloat(String(item.price).replace("€", "").replace(",", ""));
}

function getCartKey(userId) {
  return userId ? `ef_cart_${userId}` : `ef_cart_guest`;
}

function getWishlistKey(userId) {
  return userId ? `ef_wishlist_${userId}` : `ef_wishlist_guest`;
}

function getCouponKey(userId) {
  return userId ? `ef_coupon_${userId}` : `ef_coupon_guest`;
}

function loadCartForUser(userId) {
  const userKey = getCartKey(userId);
  const saved = loadState(userKey, null);
  if (saved !== null) return saved;
  return loadState("ef_cart", []);
}

function loadWishlistForUser(userId) {
  const userKey = getWishlistKey(userId);
  const saved = loadState(userKey, null);
  if (saved !== null) return saved;
  return loadState("ef_wishlist", []);
}

function loadCouponForUser(userId) {
  const userKey = getCouponKey(userId);
  const saved = loadState(userKey, null);
  if (saved !== null) return saved;
  return loadState("ef_coupon", null);
}

function mergeCarts(existingItems = [], incomingItems = []) {
  if (!incomingItems || incomingItems.length === 0) return existingItems;
  const merged = [...existingItems];
  incomingItems.forEach((incoming) => {
    const incomingKey = `${incoming.name}-${incoming.selectedSize || ""}-${incoming.selectedColor || ""}-${incoming.isRental ? "rental" : ""}`;
    const idx = merged.findIndex((item) => {
      const itemKey = `${item.name}-${item.selectedSize || ""}-${item.selectedColor || ""}-${item.isRental ? "rental" : ""}`;
      return itemKey === incomingKey;
    });
    if (idx !== -1) {
      merged[idx] = { ...merged[idx], qty: merged[idx].qty + (incoming.qty || 1) };
    } else {
      merged.push(incoming);
    }
  });
  return merged;
}

function mergeWishlists(existingWishlist = [], incomingWishlist = []) {
  if (!incomingWishlist || incomingWishlist.length === 0) return existingWishlist;
  const merged = [...existingWishlist];
  incomingWishlist.forEach((item) => {
    const exists = merged.some((m) => (m.id && item.id ? m.id === item.id : m.name === item.name));
    if (!exists) merged.push(item);
  });
  return merged;
}

export function CartProvider({ children }) {
  const { placeOrder: createSharedOrder } = useOrders();
  const { isAuthenticated, currentUser } = useAuth();
  const currentUserId = currentUser?.id || null;

  const [cartItems, setCartItems] = useState(() => loadCartForUser(currentUserId));
  const [wishlist, setWishlist] = useState(() => loadWishlistForUser(currentUserId));
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [order, setOrder] = useState(() => loadState("ef_order", null));
  const [coupon, setCoupon] = useState(() => loadCouponForUser(currentUserId));
  const [couponError, setCouponError] = useState("");

  const prevUserRef = useRef(currentUserId);
  const isInitialMount = useRef(true);

  // When currentUser changes (login, logout, or account switch)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const prevUserId = prevUserRef.current;
    const nextUserId = currentUser?.id || null;

    if (prevUserId === nextUserId) return;

    if (nextUserId) {
      // User just logged in! Restore user's saved items and merge any guest items
      const userSavedCart = loadCartForUser(nextUserId);
      const userSavedWishlist = loadWishlistForUser(nextUserId);
      const userSavedCoupon = loadCouponForUser(nextUserId);

      const guestCart = loadState("ef_cart_guest", []);
      const guestWishlist = loadState("ef_wishlist_guest", []);
      const guestCoupon = loadState("ef_coupon_guest", null);

      const finalCart = mergeCarts(userSavedCart, guestCart);
      const finalWishlist = mergeWishlists(userSavedWishlist, guestWishlist);
      const finalCoupon = userSavedCoupon || guestCoupon;

      setCartItems(finalCart);
      setWishlist(finalWishlist);
      setCoupon(finalCoupon);

      saveState(getCartKey(nextUserId), finalCart.map(compactProduct));
      saveState(getWishlistKey(nextUserId), finalWishlist.map(compactProduct));
      if (finalCoupon) saveState(getCouponKey(nextUserId), finalCoupon);

      localStorage.removeItem("ef_cart_guest");
      localStorage.removeItem("ef_wishlist_guest");
      localStorage.removeItem("ef_coupon_guest");
    } else {
      // User logged out: previous user's cart is safely kept in ef_cart_<prevUserId>
      // Switch active session to guest storage
      const guestCart = loadState("ef_cart_guest", []);
      const guestWishlist = loadState("ef_wishlist_guest", []);
      const guestCoupon = loadState("ef_coupon_guest", null);

      setCartItems(guestCart);
      setWishlist(guestWishlist);
      setCoupon(guestCoupon);
    }

    prevUserRef.current = nextUserId;
  }, [currentUser?.id]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    const key = getCartKey(currentUser?.id);
    localStorage.removeItem(key);
    localStorage.removeItem("ef_cart");
  }, [currentUser?.id]);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    const key = getWishlistKey(currentUser?.id);
    localStorage.removeItem(key);
    localStorage.removeItem("ef_wishlist");
  }, [currentUser?.id]);

  useEffect(() => {
    // Keep user-scoped and legacy keys in sync
    const key = getCartKey(currentUser?.id);
    saveState(key, cartItems.map(compactProduct));
    saveState("ef_cart", cartItems.map(compactProduct));
  }, [cartItems, currentUser?.id]);

  useEffect(() => {
    const key = getWishlistKey(currentUser?.id);
    saveState(key, wishlist.map(compactProduct));
    saveState("ef_wishlist", wishlist.map(compactProduct));
  }, [wishlist, currentUser?.id]);

  useEffect(() => {
    const key = getCouponKey(currentUser?.id);
    if (coupon) {
      saveState(key, coupon);
      saveState("ef_coupon", coupon);
    } else {
      localStorage.removeItem(key);
      localStorage.removeItem("ef_coupon");
    }
  }, [coupon, currentUser?.id]);

  useEffect(() => {
    if (order) saveState("ef_order", order);
  }, [order]);

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
    async (shippingInfo, paymentMethod) => {
      const newOrder = createSharedOrder(
        cartItems,
        shippingInfo,
        paymentMethod,
        currentUser?.id || "guest",
        coupon?.code,
        discount
      );

      let savedOrder = newOrder;
      // Also save to backend MongoDB
      try {
        const hasRental = cartItems.some((item) => item.isRental);
        const backendItems = cartItems.map((item) => ({
          productId: item.id || item.slug || item.name,
          quantity: item.qty,
          size: item.selectedSize || null,
          color: item.selectedColor || null,
          isRental: !!item.isRental,
          rentalDetails: item.isRental ? item.rentalDetails : undefined,
        }));
        const rentalDetails = hasRental
          ? {
              startDate: cartItems.find((i) => i.isRental)?.rentalDetails?.startDate || null,
              endDate: cartItems.find((i) => i.isRental)?.rentalDetails?.endDate || null,
              rentalDays: cartItems.find((i) => i.isRental)?.rentalDetails?.rentalDays || 0,
              rentalPricePerDay: cartItems.find((i) => i.isRental)?.rentalDetails?.rentalPricePerDay || 0,
            }
          : null;
        const backendOrder = await ordersApi.create({
          items: backendItems,
          coupon: coupon || null,
          shipping: shippingInfo,
          payment: paymentMethod,
          rentalDetails,
        });
        // Keep the local order shape (used by the Confirmation page) but swap in
        // the real backend id so post-order actions (OTP, status) can find it.
        savedOrder = { ...newOrder, id: backendOrder._id || backendOrder.id, phoneVerified: !!backendOrder.phoneVerified };
      } catch {
        // Backend might be unreachable; local order is still saved
      }

      setOrder(savedOrder);
      setCartItems([]);
      setCoupon(null);
      const userKey = getCartKey(currentUser?.id);
      localStorage.removeItem(userKey);
      localStorage.removeItem("ef_cart");
      return savedOrder;
    },
    [cartItems, coupon, discount, createSharedOrder, currentUser?.id]
  );

  const updateOrder = useCallback((patch) => {
    setOrder((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const toggleWishlist = useCallback((product) => {
    setWishlist((prev) => {
      const exists = prev.find((item) => (item.id && product.id ? item.id === product.id : item.name === product.name));
      if (exists) return prev.filter((item) => (item.id && product.id ? item.id !== product.id : item.name !== product.name));
      return [...prev, product];
    });
    return true;
  }, []);

  const isWishlisted = useCallback(
    (identifier) => wishlist.some((item) => item.id === identifier || item.slug === identifier || item.name === identifier),
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
        updateOrder,
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
        clearCart,
        clearWishlist,
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
