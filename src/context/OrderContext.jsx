import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { allProducts } from "@/data/products";

const OrderContext = createContext();

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL"];

function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function buildInventoryFromProducts(products) {
  const inventory = {};
  if (!products || !Array.isArray(products)) return inventory;
  products.forEach((product) => {
    const slug = product.slug || product.id || product.name;
    const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : DEFAULT_SIZES;
    const stock = {};
    sizes.forEach((size) => {
      stock[size] = product.stock?.[size] ?? 10;
    });
    inventory[slug] = stock;
  });
  return inventory;
}

const SEEDED_REVIEWS = (() => {
  const products = allProducts || [];
  const samples = [
    { rating: 5, comment: "Absolutely stunning quality! Fits perfectly.", userName: "Sophia M." },
    { rating: 4, comment: "Beautiful design, slightly loose but love it.", userName: "Luca B." },
    { rating: 5, comment: "Exceeded my expectations. Fast shipping too!", userName: "Amara K." },
  ];
  return products.slice(0, 3).map((product, i) => ({
    id: `review-seed-${i + 1}`,
    productId: product.slug || product.id,
    userId: `user-seed-${i + 1}`,
    userName: samples[i].userName,
    rating: samples[i].rating,
    comment: samples[i].comment,
    date: new Date(Date.now() - (i + 1) * 86400000 * 3).toISOString(),
    vendorReply: null,
  }));
})();

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(() => loadState("ef_orders", []));
  const [inventory, setInventory] = useState(() => {
    const cached = loadState("ef_inventory", null);
    if (cached) return cached;
    return buildInventoryFromProducts(allProducts);
  });
  const [vendors, setVendors] = useState(() => {
    const cached = loadState("ef_vendors", null);
    if (cached) return cached;
    const productIds = (allProducts || []).map((p) => p.slug || p.id);
    return [
      {
        id: "vendor-1",
        userId: "vendor-1",
        storeName: "Atelier Paris",
        description: "Premium Parisian fashion house",
        commission: 15,
        products: productIds,
        joinedAt: "2024-01-01",
        totalSales: 2847,
        totalEarnings: 186520,
        pendingPayout: 12340,
      },
    ];
  });
  const [reviews, setReviews] = useState(() => {
    const cached = loadState("ef_reviews", null);
    if (cached) return cached;
    return SEEDED_REVIEWS;
  });

  useEffect(() => {
    localStorage.setItem("ef_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("ef_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("ef_vendors", JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem("ef_reviews", JSON.stringify(reviews));
  }, [reviews]);

  const getStock = useCallback(
    (productId, size) => {
      return inventory[productId]?.[size] ?? 0;
    },
    [inventory]
  );

  const updateStock = useCallback((productId, size, qty) => {
    setInventory((prev) => {
      const next = { ...prev };
      if (!next[productId]) return prev;
      next[productId] = { ...next[productId] };
      next[productId][size] = Math.max(0, (next[productId][size] || 0) - qty);
      return next;
    });
  }, []);

  const restoreStock = useCallback((productId, size, qty) => {
    setInventory((prev) => {
      const next = { ...prev };
      if (!next[productId]) {
        next[productId] = { [size]: qty };
        return next;
      }
      next[productId] = { ...next[productId] };
      next[productId][size] = (next[productId][size] || 0) + qty;
      return next;
    });
  }, []);

  const isInStock = useCallback(
    (productId, size) => {
      return (inventory[productId]?.[size] ?? 0) > 0;
    },
    [inventory]
  );

  const placeOrder = useCallback(
    (cartItems, shippingInfo, paymentMethod, userId, coupon, discount) => {
      const subtotal = cartItems.reduce(
        (sum, item) => sum + parseFloat(String(item.price).replace("€", "").replace(",", "")) * item.qty,
        0
      );
      const shipping = shippingInfo;
      const total = Math.max(0, subtotal - (discount || 0));

      const orderItems = cartItems.map((item) => ({
        name: item.name,
        price: item.price,
        qty: item.qty,
        selectedSize: item.selectedSize || null,
        selectedColor: item.selectedColor || null,
        img: item.img || item.image || null,
        vendorId: item.vendorId || "vendor-1",
      }));

      const now = new Date();
      const newOrder = {
        id: `EF-${Date.now()}`,
        items: orderItems,
        total,
        subtotal,
        discount: discount || 0,
        coupon: coupon || null,
        shipping: shippingInfo,
        payment: { method: paymentMethod?.method || "card", details: paymentMethod?.details || null },
        status: "confirmed",
        date: now.toISOString(),
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        userId,
        timeline: [{ status: "confirmed", date: now.toISOString() }],
        rentalDetails: null,
      };

      orderItems.forEach((item) => {
        if (item.selectedSize) {
          updateStock(item.vendorId || item.name, item.selectedSize, item.qty);
        }
      });

      setOrders((prev) => [...prev, newOrder]);
      return newOrder;
    },
    [updateStock]
  );

  const getOrdersByUser = useCallback(
    (userId) => {
      return orders.filter((o) => o.userId === userId);
    },
    [orders]
  );

  const getOrdersByVendor = useCallback(
    (vendorId) => {
      return orders.filter((o) =>
        o.items.some((item) => item.vendorId === vendorId)
      );
    },
    [orders]
  );

  const updateOrderStatus = useCallback((orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: newStatus,
          timeline: [...o.timeline, { status: newStatus, date: new Date().toISOString() }],
        };
      })
    );
  }, []);

  const returnOrder = useCallback(
    (orderId) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          o.items.forEach((item) => {
            if (item.selectedSize) {
              restoreStock(item.vendorId || item.name, item.selectedSize, item.qty);
            }
          });
          return {
            ...o,
            status: "returned",
            timeline: [...o.timeline, { status: "returned", date: new Date().toISOString() }],
          };
        })
      );
    },
    [restoreStock]
  );

  const getVendorByUserId = useCallback(
    (userId) => {
      return vendors.find((v) => v.userId === userId) || null;
    },
    [vendors]
  );

  const getVendorById = useCallback(
    (vendorId) => {
      return vendors.find((v) => v.id === vendorId) || null;
    },
    [vendors]
  );

  const updateVendorPayout = useCallback((vendorId, amount) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== vendorId) return v;
        return { ...v, pendingPayout: Math.max(0, v.pendingPayout - amount) };
      })
    );
  }, []);

  const addReview = useCallback((productId, userId, userName, rating, comment) => {
    const newReview = {
      id: `review-${Date.now()}`,
      productId,
      userId,
      userName,
      rating: Math.min(5, Math.max(1, rating)),
      comment,
      date: new Date().toISOString(),
      vendorReply: null,
    };
    setReviews((prev) => [...prev, newReview]);
    return newReview;
  }, []);

  const getReviewsByProduct = useCallback(
    (productId) => {
      return reviews.filter((r) => r.productId === productId);
    },
    [reviews]
  );

  const getAverageRating = useCallback(
    (productId) => {
      const productReviews = reviews.filter((r) => r.productId === productId);
      if (productReviews.length === 0) return 0;
      const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
      return sum / productReviews.length;
    },
    [reviews]
  );

  const replyToReview = useCallback((reviewId, reply) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r;
        return { ...r, vendorReply: reply };
      })
    );
  }, []);

  return (
    <OrderContext.Provider
      value={{
        orders,
        inventory,
        vendors,
        reviews,
        placeOrder,
        getOrdersByUser,
        getOrdersByVendor,
        updateOrderStatus,
        returnOrder,
        getStock,
        updateStock,
        restoreStock,
        isInStock,
        getVendorByUserId,
        getVendorById,
        updateVendorPayout,
        addReview,
        getReviewsByProduct,
        getAverageRating,
        replyToReview,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
