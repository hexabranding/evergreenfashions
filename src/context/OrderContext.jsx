import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { allProducts } from "@/data/products";
import { ordersApi } from "@/api/orders";

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
  const [customerApiOrders, setCustomerApiOrders] = useState([]);
  const [customerOrdersLoading, setCustomerOrdersLoading] = useState(false);
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
    try { localStorage.setItem("ef_orders", JSON.stringify(orders)); } catch (_e) { /* quota exceeded */ }
  }, [orders]);

  useEffect(() => {
    try { localStorage.setItem("ef_inventory", JSON.stringify(inventory)); } catch (_e) { /* quota exceeded */ }
  }, [inventory]);

  useEffect(() => {
    try { localStorage.setItem("ef_vendors", JSON.stringify(vendors)); } catch (_e) { /* quota exceeded */ }
  }, [vendors]);

  useEffect(() => {
    try { localStorage.setItem("ef_reviews", JSON.stringify(reviews)); } catch (_e) { /* quota exceeded */ }
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
      let deposit = 0;
      cartItems.forEach((item) => {
        if (item.isRental && item.rentalDetails) {
          deposit += 100 * item.qty;
        }
      });
      const total = Math.max(0, subtotal - (discount || 0)) + deposit;

      const orderItems = cartItems.map((item) => ({
        productId: item.id || item.slug || item.name,
        name: item.name,
        price: item.price,
        qty: item.qty,
        selectedSize: item.selectedSize || null,
        selectedColor: item.selectedColor || null,
        img: item.img || item.image || null,
        vendorId: item.vendorId || "vendor-1",
        isRental: !!item.isRental,
        rentalDetails: item.rentalDetails || null,
      }));

      const hasRental = cartItems.some((item) => item.isRental);
      const rentalDetails = hasRental
        ? {
            startDate: cartItems.find((i) => i.isRental)?.rentalDetails?.startDate || null,
            endDate: cartItems.find((i) => i.isRental)?.rentalDetails?.endDate || null,
            rentalDays: cartItems.find((i) => i.isRental)?.rentalDetails?.rentalDays || 0,
            rentalPricePerDay: cartItems.find((i) => i.isRental)?.rentalDetails?.rentalPricePerDay || 0,
            deposit,
          }
        : null;

      const now = new Date();
      const newOrder = {
        id: `EF-${Date.now()}`,
        items: orderItems,
        total,
        subtotal,
        deposit,
        depositRefunded: false,
        refundAmount: 0,
        discount: discount || 0,
        coupon: coupon || null,
        shipping: shippingInfo,
        payment: { ...paymentMethod, method: paymentMethod?.method || "card" },
        status: "confirmed",
        rentalStatus: hasRental ? "active" : "active",
        rentalDetails,
        date: now.toISOString(),
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        userId,
        timeline: [{ status: "confirmed", date: now.toISOString() }],
      };

      orderItems.forEach((item) => {
        if (item.selectedSize) {
          updateStock(item.productId, item.selectedSize, item.qty);
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
        o.items.some((item) => {
          if (item.vendorId === vendorId) return true;
          if (item.vendorId === 'vendor-1' && vendorId === 'vendor-1') return true;
          return false;
        })
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
          if (o.rentalDetails) {
            return {
              ...o,
              returnRequested: true,
              returnRequestedDate: new Date().toISOString(),
              rentalStatus: "pending_return",
              status: "delivered",
              timeline: [
                ...o.timeline,
                { status: "pending_return", date: new Date().toISOString(), description: "Return requested by customer" },
              ],
            };
          }
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

  const requestReturn = useCallback(async (orderId, reason) => {
    try {
      await ordersApi.returnOrder(orderId, reason);
    } catch {
      /* fallback: handled locally */
    }
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        if (o.rentalDetails) {
          return {
            ...o,
            returnRequested: true,
            returnRequestedDate: new Date().toISOString(),
            rentalStatus: "pending_return",
            status: "delivered",
            timeline: [
              ...o.timeline,
              { status: "pending_return", date: new Date().toISOString(), description: reason || "Return requested by customer" },
            ],
          };
        }
        return {
          ...o,
          returnRequested: true,
          returnRequestedDate: new Date().toISOString(),
          status: "return_requested",
          timeline: [
            ...o.timeline,
            { status: "return_requested", date: new Date().toISOString(), description: reason || "Return requested by customer" },
          ],
        };
      })
    );
  }, []);

  const inspectOrder = useCallback((orderId, inspectionStatus, notes) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const deposit = o.deposit || 0;
        let refundAmount = 0;
        let depositRefunded = false;
        let rentalStatus = "awaiting_inspection";
        let timelineEntry = { status: "inspected", date: new Date().toISOString(), description: `Inspection: ${inspectionStatus}` };
        if (inspectionStatus === "passed") {
          refundAmount = deposit;
          depositRefunded = true;
          rentalStatus = "deposit_refunded";
          timelineEntry = { status: "deposit_refunded", date: new Date().toISOString(), description: `Deposit of €${deposit} refunded` };
        } else if (inspectionStatus === "partial_refund") {
          refundAmount = Math.round(deposit * 0.5);
          depositRefunded = true;
          rentalStatus = "deposit_refunded";
          timelineEntry = { status: "deposit_refunded", date: new Date().toISOString(), description: `Partial refund of €${refundAmount} (damaged item)` };
        }
        return {
          ...o,
          inspectionStatus,
          inspectedBy: "admin",
          inspectedAt: new Date().toISOString(),
          rentalStatus,
          depositRefunded,
          refundAmount,
          timeline: [...o.timeline, timelineEntry],
        };
      })
    );
  }, []);

  const refundDeposit = useCallback(async (orderId, amount) => {
    try {
      await ordersApi.refundDeposit(orderId, amount);
    } catch {
      /* fallback handled locally */
    }
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return { ...o, depositRefunded: true, refundAmount: amount, rentalStatus: "deposit_refunded" };
      })
    );
  }, []);

  const confirmReturn = useCallback(async (orderId) => {
    try {
      await ordersApi.confirmReturn(orderId);
    } catch {
      /* fallback handled locally */
    }
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
          timeline: [
            ...o.timeline,
            { status: "returned", date: new Date().toISOString(), description: "Return confirmed, inventory restored" },
          ],
        };
      })
    );
  }, [restoreStock]);

  const rentalStatusSteps = [
    { id: "confirmed", label: "Confirmed", icon: "✓" },
    { id: "preparing", label: "Preparing", icon: "📦" },
    { id: "shipped", label: "Shipped", icon: "🚚" },
    { id: "delivered", label: "Delivered", icon: "📬" },
    { id: "active", label: "Rental Active", icon: "🏠" },
    { id: "pending_return", label: "Return Requested", icon: "↩️" },
    { id: "awaiting_inspection", label: "Awaiting Inspection", icon: "🔍" },
    { id: "inspected", label: "Inspected", icon: "✅" },
    { id: "deposit_refunded", label: "Deposit Refunded", icon: "💰" },
    { id: "completed", label: "Completed", icon: "🎉" },
  ];

  const updateRentalStatus = useCallback((orderId, newRentalStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          rentalStatus: newRentalStatus,
          timeline: [
            ...o.timeline,
            { status: newRentalStatus, date: new Date().toISOString(), description: `Rental stage: ${newRentalStatus}` },
          ],
        };
      })
    );
  }, []);

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

  const [vendorApiOrders, setVendorApiOrders] = useState([]);
  const [adminApiOrders, setAdminApiOrders] = useState([]);
  const [vendorOrdersLoading, setVendorOrdersLoading] = useState(false);
  const [adminOrdersLoading, setAdminOrdersLoading] = useState(false);

  const fetchVendorOrders = useCallback(async () => {
    setVendorOrdersLoading(true);
    try {
      const data = await ordersApi.getVendorOrders();
      const mapped = data.map((o) => ({
        ...o,
        id: o._id || o.id,
        date: o.createdAt || o.date,
        items: (o.items || []).map((item) => ({
          ...item,
          qty: item.quantity,
          selectedSize: item.size,
          selectedColor: item.color,
        })),
      }));
      setVendorApiOrders(mapped);
      return mapped;
    } catch {
      return [];
    } finally {
      setVendorOrdersLoading(false);
    }
  }, []);

  const fetchAdminOrders = useCallback(async () => {
    setAdminOrdersLoading(true);
    try {
      const data = await ordersApi.getAdminOrders();
      const mapped = data.map((o) => ({
        ...o,
        id: o._id || o.id,
        date: o.createdAt || o.date,
        items: (o.items || []).map((item) => ({
          ...item,
          qty: item.quantity,
          selectedSize: item.size,
          selectedColor: item.color,
        })),
      }));
      setAdminApiOrders(mapped);
      return mapped;
    } catch {
      return [];
    } finally {
      setAdminOrdersLoading(false);
    }
  }, []);

  const fetchCustomerOrders = useCallback(async () => {
    setCustomerOrdersLoading(true);
    try {
      const data = await ordersApi.getUserOrders();
      const mapped = data.map((o) => ({
        ...o,
        id: o._id || o.id,
        date: o.createdAt || o.date,
        items: (o.items || []).map((item) => ({
          ...item,
          qty: item.quantity,
          selectedSize: item.size,
          selectedColor: item.color,
        })),
      }));
      setCustomerApiOrders(mapped);
      return mapped;
    } catch {
      return [];
    } finally {
      setCustomerOrdersLoading(false);
    }
  }, []);

  const updateOrderStatusApi = useCallback(async (orderId, status) => {
    try {
      await ordersApi.updateStatus(orderId, status);
    } catch {
      // fallback: update locally
    }
    updateOrderStatus(orderId, status);
  }, [updateOrderStatus]);

  const updateRentalStatusApi = useCallback(async (orderId, rentalStatus) => {
    try {
      await ordersApi.updateRentalStatus(orderId, rentalStatus);
    } catch {
      // fallback: update locally
    }
    updateRentalStatus(orderId, rentalStatus);
  }, [updateRentalStatus]);

  const cancelOrderApi = useCallback(async (orderId, reason) => {
    try {
      await ordersApi.cancelOrder(orderId, reason);
    } catch {
      // fallback: update locally
    }
    updateOrderStatus(orderId, "cancelled");
  }, [updateOrderStatus]);

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
        requestReturn,
        confirmReturn,
        inspectOrder,
        refundDeposit,
        rentalStatusSteps,
        updateRentalStatus,
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
        vendorApiOrders,
        adminApiOrders,
        vendorOrdersLoading,
        adminOrdersLoading,
        fetchVendorOrders,
        fetchAdminOrders,
        fetchCustomerOrders,
        customerApiOrders,
        customerOrdersLoading,
        updateOrderStatusApi,
        updateRentalStatusApi,
        cancelOrderApi,
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
