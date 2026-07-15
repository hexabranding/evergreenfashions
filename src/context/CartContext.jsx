import { createContext, useContext, useState, useCallback } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [order, setOrder] = useState(null);

  const addToCart = useCallback((product) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item.name === product.name);
      if (exists) {
        return prev.map((item) =>
          item.name === product.name ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const buyNow = useCallback((product) => {
    setCartItems([{ ...product, qty: 1 }]);
  }, []);

  const removeFromCart = useCallback((name) => {
    setCartItems((prev) => prev.filter((item) => item.name !== name));
  }, []);

  const updateQty = useCallback((name, qty) => {
    if (qty < 1) return;
    setCartItems((prev) =>
      prev.map((item) => (item.name === name ? { ...item, qty } : item))
    );
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const cartTotal = cartItems.reduce(
    (sum, item) =>
      sum + parseFloat(item.price.replace("€", "").replace(",", "")) * item.qty,
    0
  );

  const placeOrder = useCallback(
    (shippingInfo, paymentMethod) => {
      const newOrder = {
        id: `EF-${Date.now().toString(36).toUpperCase()}`,
        items: [...cartItems],
        total: cartTotal,
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
      return newOrder;
    },
    [cartItems, cartTotal]
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
