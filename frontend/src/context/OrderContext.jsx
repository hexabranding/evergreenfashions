import { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  Check,
  Package,
  Truck,
  PackageCheck,
  Shirt,
  RotateCcw,
  Search,
  ShieldCheck,
  Wallet,
  Sparkles,
} from "lucide-react";
import { allProducts } from "@/data/products";
import { ordersApi } from "@/api/orders";
import { isOfflineError } from "@/lib/utils";

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

function mapApiOrder(order) {
  return {
    ...order,
    id: order._id || order.id,
    date: order.createdAt || order.date,
    items: (order.items || []).map((item) => ({
      ...item,
      qty: item.quantity,
      selectedSize: item.size,
      selectedColor: item.color,
    })),
  };
}

export function isSameOrder(localOrder, apiOrder) {
  if (!localOrder || !apiOrder) return false;
  const localId = localOrder.id || localOrder._id;
  const apiId = apiOrder.id || apiOrder._id;
  if (localId && apiId && localId === apiId) return true;

  if (typeof localId === "string" && localId.startsWith("EF-")) {
    const localDate = new Date(localOrder.date || localOrder.createdAt).getTime();
    const apiDate = new Date(apiOrder.date || apiOrder.createdAt).getTime();
    const timeDiff = Math.abs(localDate - apiDate);
    const totalMatch = Math.abs(Number(localOrder.total || 0) - Number(apiOrder.total || 0)) < 1;
    const itemsMatch = (localOrder.items?.length || 0) === (apiOrder.items?.length || 0);

    if (!isNaN(timeDiff) && timeDiff < 15 * 60 * 1000 && totalMatch && itemsMatch) {
      return true;
    }
  }
  return false;
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

const DEMO_CUSTOMER_ID = "cust-1";

function buildDemoOrders() {
  const find = (id) => allProducts.find((p) => p.id === id) || {};
  const item = (id, qty, size, color, extra = {}) => ({
    productId: id,
    name: find(id).name || id,
    price: find(id).price || 0,
    qty,
    quantity: qty,
    size,
    selectedSize: size,
    color,
    selectedColor: color,
    img: find(id).img || "",
    vendorId: "vendor-1",
    ...extra,
  });
  return [
    {
      id: "order-1",
      userId: DEMO_CUSTOMER_ID,
      customerName: "Isabelle Moreau",
      customerEmail: "customer@evergreen.com",
      date: "2026-07-24T09:00:00.000Z",
      items: [item("ecarlate-gown", 1, "M", "Red", { isRental: true, rentalDetails: { startDate: "2026-08-01", endDate: "2026-08-05" } })],
      subtotal: 1290,
      deposit: 160,
      depositRefunded: false,
      refundAmount: 0,
      discount: 0,
      total: 1450,
      coupon: null,
      shipping: { address: "12 Rue de Rivoli, Paris", method: "express" },
      payment: { method: "card", status: "paid" },
      status: "delivered",
      rentalStatus: "pending_return",
      rentalDetails: { startDate: "2026-08-01", endDate: "2026-08-05" },
      timeline: [
        { status: "confirmed", date: "2026-07-20T10:00:00.000Z", description: "Order placed successfully" },
        { status: "shipped", date: "2026-07-22T14:00:00.000Z", description: "Order shipped via express" },
        { status: "delivered", date: "2026-07-24T09:00:00.000Z", description: "Order delivered to customer" },
      ],
    },
    {
      id: "order-2",
      userId: DEMO_CUSTOMER_ID,
      customerName: "Isabelle Moreau",
      customerEmail: "customer@evergreen.com",
      date: "2026-07-26T09:00:00.000Z",
      items: [item("noir-blazer", 1, "L", "Black"), item("wool-trousers", 1, "L", "Charcoal")],
      subtotal: 1240,
      deposit: 0,
      depositRefunded: false,
      refundAmount: 0,
      discount: 100,
      total: 1140,
      coupon: { code: "WELCOME10", type: "fixed", value: 100 },
      shipping: { address: "45 Avenue Montaigne, Paris", method: "standard" },
      payment: { method: "card", status: "paid" },
      status: "processing",
      rentalStatus: "active",
      rentalDetails: null,
      timeline: [
        { status: "confirmed", date: "2026-07-25T11:30:00.000Z", description: "Order placed successfully" },
        { status: "processing", date: "2026-07-26T09:00:00.000Z", description: "Order is being prepared" },
      ],
    },
    {
      id: "order-3",
      userId: DEMO_CUSTOMER_ID,
      customerName: "Isabelle Moreau",
      customerEmail: "customer@evergreen.com",
      date: "2026-07-28T16:00:00.000Z",
      items: [item("stiletto-suede", 2, "38", "Black")],
      subtotal: 960,
      deposit: 0,
      depositRefunded: false,
      refundAmount: 0,
      discount: 0,
      total: 960,
      coupon: null,
      shipping: { address: "8 Place Vendôme, Paris", method: "express" },
      payment: { method: "card", status: "paid" },
      status: "confirmed",
      rentalStatus: "active",
      rentalDetails: null,
      timeline: [
        { status: "confirmed", date: "2026-07-28T16:00:00.000Z", description: "Order placed successfully" },
      ],
    },
  ];
}

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(() => loadState("ef_orders", []));
  const [customerApiOrders, setCustomerApiOrders] = useState([]);
  const [customerOrdersLoading, setCustomerOrdersLoading] = useState(false);
  const [vendorApiOrders, setVendorApiOrders] = useState([]);
  const [adminApiOrders, setAdminApiOrders] = useState([]);
  const [vendorOrdersLoading, setVendorOrdersLoading] = useState(false);
  const [adminOrdersLoading, setAdminOrdersLoading] = useState(false);

  const updateOrderInAllStates = useCallback((orderId, updater) => {
    const applyUpdate = (prev) =>
      prev.map((o) => {
        if (o.id !== orderId && o._id !== orderId) return o;
        return typeof updater === "function" ? updater(o) : { ...o, ...updater };
      });

    setOrders(applyUpdate);
    setVendorApiOrders(applyUpdate);
    setAdminApiOrders(applyUpdate);
    setCustomerApiOrders(applyUpdate);
  }, []);
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
        totalSales: 0,
        totalEarnings: 0,
        pendingPayout: 0,
      },
    ];
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
      const customerName = [shippingInfo?.firstName, shippingInfo?.lastName].filter(Boolean).join(" ");
      const customerEmail = shippingInfo?.email || "";
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
        rentalStatus: hasRental ? "confirmed" : "active",
        rentalDetails,
        returnDueDate: rentalDetails?.endDate || null,
        date: now.toISOString(),
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        userId,
        customerName,
        customerEmail,
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

  const syncBackendOrder = useCallback((tempId, backendOrder) => {
    if (!tempId || !backendOrder) return;
    const realId = backendOrder._id || backendOrder.id;
    const mapped = mapApiOrder(backendOrder);

    setOrders((prev) =>
      prev.map((o) => (o.id === tempId ? { ...o, ...mapped, id: realId } : o))
    );
    setCustomerApiOrders((prev) => {
      const exists = prev.some((o) => (o.id || o._id) === realId);
      if (exists) {
        return prev.map((o) => ((o.id || o._id) === realId ? mapped : o));
      }
      return [mapped, ...prev];
    });
  }, []);

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

  const updateOrderStatus = useCallback((orderId, newStatus, extraData = {}) => {
    updateOrderInAllStates(orderId, (o) => {
      if (o.status === "returned" && newStatus !== "returned") {
        return o;
      }
      if (o.status === "cancelled" && newStatus !== "cancelled") {
        return o;
      }
      if (o.status === "return_requested" && !["returned", "cancelled", "delivered"].includes(newStatus)) {
        return o;
      }
      const forwardFlow = ["confirmed", "processing", "preparing", "dispatched", "shipped", "delivered"];
      const currentIdx = forwardFlow.indexOf(o.status);
      const targetIdx = forwardFlow.indexOf(newStatus);
      if (currentIdx !== -1 && targetIdx !== -1 && targetIdx < currentIdx) {
        return o; // Cannot revert back to previous statuses
      }
      const trackingUrl = extraData.trackingUrl !== undefined ? extraData.trackingUrl : o.trackingUrl;
      const courierName = extraData.courierName !== undefined ? extraData.courierName : o.courierName;
      const trackingNumber = extraData.trackingNumber !== undefined ? extraData.trackingNumber : o.trackingNumber;
      let description = `Order ${newStatus}`;
      if (newStatus === "dispatched") {
        if (courierName || trackingUrl || trackingNumber) {
          description = `Dispatched via ${courierName || "Courier"}${trackingNumber ? ` (Tracking #${trackingNumber})` : ""}`;
        }
      }
      return {
        ...o,
        status: newStatus,
        courierName,
        trackingUrl,
        trackingNumber,
        dispatchedAt: newStatus === "dispatched" ? new Date().toISOString() : o.dispatchedAt,
        timeline: [
          ...(o.timeline || []),
          { status: newStatus, date: new Date().toISOString(), description },
        ],
      };
    });
  }, [updateOrderInAllStates]);

  const returnOrder = useCallback(
    (orderId) => {
      updateOrderInAllStates(orderId, (o) => {
        if (o.rentalDetails) {
          return {
            ...o,
            returnRequested: true,
            returnRequestedDate: new Date().toISOString(),
            rentalStatus: "pending_return",
            status: "delivered",
            timeline: [
              ...(o.timeline || []),
              { status: "pending_return", date: new Date().toISOString(), description: "Return requested by customer" },
            ],
          };
        }
        o.items?.forEach((item) => {
          if (item.selectedSize) {
            restoreStock(item.vendorId || item.name, item.selectedSize, item.qty);
          }
        });
        return {
          ...o,
          status: "returned",
          timeline: [...(o.timeline || []), { status: "returned", date: new Date().toISOString() }],
        };
      });
    },
    [restoreStock, updateOrderInAllStates]
  );

  const requestReturn = useCallback(async (orderId, reason, photos = []) => {
    let offline = false;
    try {
      await ordersApi.returnOrder(orderId, reason, photos);
    } catch (err) {
      if (!isOfflineError(err)) throw err;
      offline = true;
    }
    const photosDate = photos.length > 0 ? new Date().toISOString() : undefined;
    updateOrderInAllStates(orderId, (o) => {
      const photoFields = {
        returnRequested: true,
        returnRequestedDate: new Date().toISOString(),
        returnReason: reason || "",
        returnPhotos: photos,
        returnPhotosDate: photosDate,
      };
      if (o.rentalDetails) {
        return {
          ...o,
          ...photoFields,
          rentalStatus: "pending_return",
          status: "delivered",
          timeline: [
            ...(o.timeline || []),
            { status: "pending_return", date: new Date().toISOString(), description: reason || "Return requested by customer" },
            ...(photos.length > 0
              ? [{ status: "return_photos", date: photosDate, description: `${photos.length} return item photo(s) uploaded by customer` }]
              : []),
          ],
        };
      }
      return {
        ...o,
        ...photoFields,
        status: "return_requested",
        timeline: [
          ...(o.timeline || []),
          { status: "return_requested", date: new Date().toISOString(), description: reason || "Return requested by customer" },
          ...(photos.length > 0
            ? [{ status: "return_photos", date: photosDate, description: `${photos.length} return item photo(s) uploaded by customer` }]
            : []),
        ],
      };
    });
    return { offline };
  }, [updateOrderInAllStates]);

  const uploadReturnPhotos = useCallback(async (orderId, photos = []) => {
    if (!photos || photos.length === 0) return { saved: [], offline: false };
    let saved = photos;
    let offline = false;
    try {
      const data = await ordersApi.uploadReturnPhotos(orderId, photos);
      saved = data.returnPhotos || photos;
    } catch (err) {
      if (!isOfflineError(err)) throw err;
      offline = true;
    }
    updateOrderInAllStates(orderId, (o) => {
      const merged = [...new Set([...(o.returnPhotos || []), ...saved])];
      const added = merged.length - (o.returnPhotos?.length || 0);
      return {
        ...o,
        returnPhotos: merged,
        returnPhotosDate: new Date().toISOString(),
        timeline:
          added > 0
            ? [
                ...(o.timeline || []),
                {
                  status: "return_photos",
                  date: new Date().toISOString(),
                  description: `${added} return item photo(s) uploaded by customer`,
                },
              ]
            : o.timeline,
      };
    });
    return { saved, offline };
  }, [updateOrderInAllStates]);

  const inspectOrder = useCallback(async (orderId, inspectionStatus, notes) => {
    try {
      const updated = await ordersApi.inspectOrder(orderId, inspectionStatus, notes);
      if (updated) {
        updateOrderInAllStates(orderId, mapApiOrder(updated));
        return;
      }
    } catch {
      // Server unreachable or rejected — mirror the inspection locally.
    }
    updateOrderInAllStates(orderId, (o) => {
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
        timeline: [...(o.timeline || []), timelineEntry],
      };
    });
  }, [updateOrderInAllStates]);

  const refundDeposit = useCallback(async (orderId, amount) => {
    try {
      const updated = await ordersApi.refundDeposit(orderId, amount);
      if (updated) {
        updateOrderInAllStates(orderId, mapApiOrder(updated));
        return;
      }
    } catch {
      /* fallback handled locally */
    }
    updateOrderInAllStates(orderId, (o) => ({
      ...o,
      depositRefunded: true,
      refundAmount: amount,
      rentalStatus: "deposit_refunded",
    }));
  }, [updateOrderInAllStates]);

  const confirmReturn = useCallback(async (orderId) => {
    updateOrderInAllStates(orderId, (o) => {
      o.items?.forEach((item) => {
        if (item.selectedSize) {
          restoreStock(item.vendorId || item.name, item.selectedSize, item.qty);
        }
      });
      return {
        ...o,
        status: o.rentalDetails ? o.status : "refund_processing",
        refundStatus: o.rentalDetails ? o.refundStatus : "processing",
        inspectionStatus: "passed",
        inspectedAt: new Date().toISOString(),
        returnPhotosReviewed: true,
        rentalStatus:
          o.rentalDetails && o.rentalStatus === "pending_return" ? "awaiting_inspection" : o.rentalStatus,
        timeline: [
          ...(o.timeline || []),
          {
            status: "inspected",
            date: new Date().toISOString(),
            description: o.rentalDetails
              ? "Return received, inventory restored — awaiting inspection"
              : "Product reached our hands & inspection passed. Refund is being processed (expected in 3-4 working days).",
          },
        ],
      };
    });
    try {
      const updated = await ordersApi.confirmReturn(orderId);
      if (updated) {
        updateOrderInAllStates(orderId, mapApiOrder(updated));
      }
    } catch (err) {
      console.error("Failed to confirm return on server:", err);
    }
  }, [restoreStock, updateOrderInAllStates]);

  const completeRefund = useCallback(async (orderId) => {
    updateOrderInAllStates(orderId, (o) => ({
      ...o,
      status: "returned",
      refundStatus: "completed",
      refundedAt: new Date().toISOString(),
      timeline: [
        ...(o.timeline || []),
        {
          status: "returned",
          date: new Date().toISOString(),
          description: `Refund completed for €${o.total || 0}. Credited to customer payment method.`,
        },
      ],
    }));
    try {
      const updated = await ordersApi.completeRefund(orderId);
      if (updated) {
        updateOrderInAllStates(orderId, mapApiOrder(updated));
      }
    } catch (err) {
      console.error("Failed to complete refund on server:", err);
    }
  }, [updateOrderInAllStates]);

  const rentalStatusSteps = [
    { id: "confirmed", label: "Confirmed", icon: Check },
    { id: "preparing", label: "Preparing", icon: Package },
    { id: "dispatched", label: "Dispatched", icon: Truck },
    { id: "shipped", label: "Shipped", icon: Truck },
    { id: "delivered", label: "Delivered", icon: PackageCheck },
    { id: "active", label: "Rental Active", icon: Shirt },
    { id: "pending_return", label: "Return Requested", icon: RotateCcw },
    { id: "awaiting_inspection", label: "Awaiting Inspection", icon: Search },
    { id: "inspected", label: "Inspected", icon: ShieldCheck },
    { id: "deposit_refunded", label: "Deposit Refunded", icon: Wallet },
    { id: "completed", label: "Completed", icon: Sparkles },
  ];

  const updateRentalStatus = useCallback((orderId, newRentalStatus) => {
    const rentalToOrderStatus = {
      confirmed: "confirmed",
      preparing: "preparing",
      dispatched: "dispatched",
      shipped: "shipped",
      delivered: "delivered",
      active: "delivered",
      pending_return: "delivered",
      completed: "returned",
    };
    const mirrored = rentalToOrderStatus[newRentalStatus];
    updateOrderInAllStates(orderId, (o) => {
      const canMirror = mirrored && !["cancelled", "returned", "return_requested"].includes(o.status);
      return {
        ...o,
        rentalStatus: newRentalStatus,
        status: canMirror ? mirrored : o.status,
        timeline: [
          ...(o.timeline || []),
          { status: newRentalStatus, date: new Date().toISOString(), description: `Rental status: ${newRentalStatus}` },
        ],
      };
    });
  }, [updateOrderInAllStates]);

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
      setOrders((prev) =>
        prev.filter((local) => {
          if (typeof local.id === "string" && local.id.startsWith("EF-")) {
            return !mapped.some((api) => isSameOrder(local, api));
          }
          return true;
        })
      );
      return mapped;
    } catch {
      const demo = buildDemoOrders();
      setVendorApiOrders(demo);
      return demo;
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
      setOrders((prev) =>
        prev.filter((local) => {
          if (typeof local.id === "string" && local.id.startsWith("EF-")) {
            return !mapped.some((api) => isSameOrder(local, api));
          }
          return true;
        })
      );
      return mapped;
    } catch {
      const demo = buildDemoOrders();
      setAdminApiOrders(demo);
      return demo;
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
      setOrders((prev) =>
        prev.filter((local) => {
          if (typeof local.id === "string" && local.id.startsWith("EF-")) {
            return !mapped.some((api) => isSameOrder(local, api));
          }
          return true;
        })
      );
      return mapped;
    } catch {
      const demo = buildDemoOrders();
      setCustomerApiOrders(demo);
      return demo;
    } finally {
      setCustomerOrdersLoading(false);
    }
  }, []);

  const updateOrderStatusApi = useCallback(async (orderId, statusOrPayload, extraData = {}) => {
    const payload = typeof statusOrPayload === "string" ? { status: statusOrPayload, ...extraData } : statusOrPayload;
    const status = payload.status;
    updateOrderStatus(orderId, status, payload);
    try {
      const updated = await ordersApi.updateStatus(orderId, payload);
      if (updated) {
        updateOrderInAllStates(orderId, mapApiOrder(updated));
      }
    } catch (err) {
      console.error("Failed to sync order status with server:", err);
    }
  }, [updateOrderStatus, updateOrderInAllStates]);

  const updateRentalStatusApi = useCallback(async (orderId, rentalStatus) => {
    updateRentalStatus(orderId, rentalStatus);
    try {
      const updated = await ordersApi.updateRentalStatus(orderId, rentalStatus);
      if (updated) {
        updateOrderInAllStates(orderId, mapApiOrder(updated));
      }
    } catch (err) {
      console.error("Failed to sync rental status with server:", err);
    }
  }, [updateRentalStatus, updateOrderInAllStates]);

  const cancelOrderApi = useCallback(async (orderId, reason) => {
    updateOrderStatus(orderId, "cancelled");
    try {
      const updated = await ordersApi.cancelOrder(orderId, reason);
      if (updated) {
        updateOrderInAllStates(orderId, mapApiOrder(updated));
      }
    } catch (err) {
      console.error("Failed to cancel order on server:", err);
    }
  }, [updateOrderStatus, updateOrderInAllStates]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        inventory,
        vendors,
        placeOrder,
        getOrdersByUser,
        getOrdersByVendor,
        updateOrderStatus,
        returnOrder,
        requestReturn,
        uploadReturnPhotos,
        confirmReturn,
        completeRefund,
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
        syncBackendOrder,
        isSameOrder,
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
