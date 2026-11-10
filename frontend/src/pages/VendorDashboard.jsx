import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { allProducts, parsePrice } from "@/data/products";
import { getRentalDueDate, isRentalOverdue, getOrderName, getOrderItemNames, getOrderSearchText } from "@/lib/utils";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AddProductForm from "@/components/AddProductForm";
import OrderDetailPanel from "@/components/OrderDetailPanel";
import ReturnStatusTracker from "@/components/ReturnStatusTracker";
import DispatchModal from "@/components/DispatchModal";
import { adsApi } from "@/api/ads";
import { productsApi } from "@/api/products";
import { authApi } from "@/api/auth";
import { uploadApi } from "@/api/upload";
import {
  Package,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  Edit2,
  BarChart3,
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Send,
  Star,
  Calendar,
  RefreshCw,
  Ban,
  ChevronDown,
  ChevronUp,
  Image,
  Tag,
  Repeat,
  FileText,
  CreditCard,
  Truck,
  Settings,
  Inbox,
  MailOpen,
  Reply,
  MoreVertical,
  X,
  Check,
  AlertTriangle,
  TrendingDown,
  PieChart,
  CircleDollarSign,
  Banknote,
  Receipt,
  Landmark,
  ExternalLink,
} from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "products", label: "Products", icon: Package },
  { key: "rentals", label: "Rentals", icon: Repeat },
  { key: "inventory", label: "Inventory", icon: Tag },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "rentalOrders", label: "Rental Orders", icon: RefreshCw },
  { key: "earnings", label: "Earnings", icon: DollarSign },
  { key: "ads", label: "Advertisements", icon: Image },
  { key: "withdrawals", label: "Withdrawals", icon: Wallet },
  { key: "profile", label: "Profile", icon: User },
];

const PRODUCT_CATEGORIES = [
  { id: "dresses", name: "Dresses" },
  { id: "apparel", name: "Apparel" },
  { id: "shoes", name: "Shoes" },
  { id: "outerwear", name: "Outerwear" },
  { id: "knitwear", name: "Knitwear" },
  { id: "accessories", name: "Accessories" },
  { id: "footwear", name: "Footwear" },
  { id: "evening-wear", name: "Evening Wear" },
];

const ORDER_STATUS_FLOW = ["confirmed", "preparing", "dispatched", "shipped", "delivered"];
const RENTAL_STATUS_FLOW = ["pending", "approved", "shipped", "active", "returned"];
const STATUS_COLORS = {
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-amber-100 text-amber-800",
  dispatched: "bg-orange-100 text-orange-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  returned: "bg-emerald-100 text-emerald-800",
  refund_processing: "bg-amber-100 text-amber-800",
  return_requested: "bg-amber-100 text-amber-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  active: "bg-purple-100 text-purple-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-emerald-100 text-emerald-800",
  processing: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

function StatCard({ icon: Icon, label, value, change, changeType, index }) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="bg-secondary border border-border/60 rounded-sm p-6 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">
          <Icon size={18} className="text-ink" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${changeType === "up" ? "text-emerald-600" : "text-red-500"}`}>
            {changeType === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}%
          </div>
        )}
      </div>
      <p className="eyebrow">{label}</p>
      <p className="text-display text-3xl">{value}</p>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
        STATUS_COLORS[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status === "confirmed" && <Clock size={12} />}
      {status === "preparing" && <Package size={12} />}
      {status === "dispatched" && <Truck size={12} />}
      {status === "shipped" && <TrendingUp size={12} />}
      {status === "delivered" && <CheckCircle size={12} />}
      {status === "returned" && <RefreshCw size={12} />}
      {status === "pending" && <Clock size={12} />}
      {status === "approved" && <CheckCircle size={12} />}
      {status === "active" && <ArrowUpRight size={12} />}
      {status === "completed" && <CheckCircle size={12} />}
      {status === "processing" && <RefreshCw size={12} />}
      {status}
    </span>
  );
}

function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center mb-6">
        <Icon size={24} className="text-muted-foreground" />
      </div>
      <h3 className="font-serif text-xl text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {action && onAction && (
        <button onClick={onAction} className="btn-ink px-6 py-2.5 text-xs tracking-widest uppercase">
          {action}
        </button>
      )}
    </motion.div>
  );
}

export default function VendorDashboard() {
  const { currentUser, isAuthenticated, isVendor, updateProfile } = useAuth();
  const {
    vendors,
    orders,
    getVendorByUserId,
    getOrdersByVendor,
    updateOrderStatus,
    inventory,
    vendorApiOrders,
    vendorOrdersLoading,
    fetchVendorOrders,
    updateOrderStatusApi,
    updateRentalStatusApi,
    rentalStatusSteps,
    confirmReturn,
    completeRefund,
    inspectOrder,
    isSameOrder,
  } = useOrders();
  const navigate = useNavigate();

  const logoInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [orderFilter, setOrderFilter] = useState("all");
  const [rentalFilter, setRentalFilter] = useState("all");
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState("bank");
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawals, setWithdrawals] = useState(() => {
    try {
      const key = `ef_withdrawals_${currentUser?.id || "default"}`;
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : [];
    } catch (_e) {
      return [];
    }
  });

  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      localStorage.setItem(`ef_withdrawals_${currentUser.id}`, JSON.stringify(withdrawals));
    } catch (_e) {}
  }, [withdrawals, currentUser?.id]);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    storeName: "",
    storeDescription: "",
    storeLogo: "",
    bankAccount: "",
    taxId: "",
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [productTab, setProductTab] = useState("all");
  const [rentalTab, setRentalTab] = useState("all");
  const [earningsPeriod, setEarningsPeriod] = useState("7months");

  const [newProductForm, setNewProductForm] = useState(false);
  const [vendorProductsList, setVendorProductsList] = useState(allProducts);
  const [vendorAds, setVendorAds] = useState([]);
  const [showAdForm, setShowAdForm] = useState(false);
  const [adForm, setAdForm] = useState({ title: "", subtitle: "", type: "slide", position: "homepage-top", image: "", link: "/collection", buttonText: "Shop Now", startDate: "", endDate: "" });
  const [editingAdId, setEditingAdId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const productFormRef = useRef(null);

  const [newRentalForm, setNewRentalForm] = useState(false);
  const [editingRentalProduct, setEditingRentalProduct] = useState(null);
  const rentalFormRef = useRef(null);

  const [localInventory, setLocalInventory] = useState({});
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [vendorOrderSearch, setVendorOrderSearch] = useState("");
  const [vendorOrderStatusFilter, setVendorOrderStatusFilter] = useState("All");
  const [vendorRentalOrderSearch, setVendorRentalOrderSearch] = useState("");
  const [vendorRentalOrderStatusFilter, setVendorRentalOrderStatusFilter] = useState("All");
  const [expandedVendorOrder, setExpandedVendorOrder] = useState(null);
  const [expandedVendorRentalOrder, setExpandedVendorRentalOrder] = useState(null);
  const [productModal, setProductModal] = useState(null);
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    adsApi.getAll().then((data) => setVendorAds(data.map((ad) => ({ ...ad, id: ad._id || ad.id })))).catch(() => setVendorAds([]));
    fetchVendorOrders();
    const interval = setInterval(() => fetchVendorOrders(), 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id, fetchVendorOrders]);
  useEffect(() => {
    if (!currentUser?.id) return;
    // Vendors use the same catalogue as the admin dashboard. Products created by an
    // admin are therefore visible immediately, even before a vendor is assigned.
    productsApi.getAll().then((data) => setVendorProductsList(
      [...data]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .map((product) => ({ ...product, id: product._id || product.id, stock: Object.fromEntries((product.inventory || []).map((item) => [item.size, item.stock])) }))
    )).catch(() => setVendorProductsList(allProducts.map((product) => ({ ...product, stock: product.stock || {} }))));
  }, [currentUser?.id]);

  const handleAdImage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please select an image file.");
    try {
      const res = await uploadApi.uploadImage(file);
      if (res?.url) {
        setAdForm((prev) => ({ ...prev, image: res.url }));
        return;
      }
    } catch {
      // Fallback to FileReader if server upload fails
    }
    const reader = new FileReader();
    reader.onload = () => setAdForm((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };
  const emptyAdForm = { title: "", subtitle: "", type: "slide", position: "homepage-top", image: "", link: "/collection", buttonText: "Shop Now", startDate: "", endDate: "" };
  const closeAdForm = () => {
    setShowAdForm(false);
    setEditingAdId(null);
    setAdForm(emptyAdForm);
  };
  const startEditAd = (ad) => {
    setEditingAdId(ad.id);
    setAdForm({
      title: ad.title || "",
      subtitle: ad.subtitle || "",
      type: ad.type || "slide",
      position: ad.position || "homepage-top",
      image: ad.image || "",
      link: ad.link || "",
      buttonText: ad.buttonText || "Shop Now",
      startDate: ad.startDate || "",
      endDate: ad.endDate || "",
    });
    setShowAdForm(true);
  };
  const submitAd = async () => {
    if (!adForm.title.trim() || !adForm.image) return;
    try {
      if (editingAdId) {
        const saved = await adsApi.update(editingAdId, adForm);
        setVendorAds((prev) => prev.map((item) => item.id === editingAdId ? { ...saved, id: saved._id || saved.id } : item));
      } else {
        const saved = await adsApi.create(adForm);
        setVendorAds((prev) => [{ ...saved, id: saved._id || saved.id }, ...prev]);
      }
      closeAdForm();
    } catch (error) { alert(error.message || "Could not save advertisement."); }
  };
  const updateVendorAd = async (ad) => {
    try {
      const saved = await adsApi.update(ad.id, { active: !ad.active });
      setVendorAds((prev) => prev.map((item) => item.id === ad.id ? { ...saved, id: saved._id || saved.id } : item));
    } catch (err) {
      alert(err.message || "Could not update this advertisement.");
    }
  };
  const removeVendorAd = async (id) => {
    if (!window.confirm("Delete this advertisement?")) return;
    try {
      await adsApi.remove(id);
      setVendorAds((prev) => prev.filter((ad) => ad.id !== id));
    } catch (err) {
      alert(err.message || "Could not delete this advertisement.");
    }
  };

  if (!isAuthenticated || !isVendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md px-8"
        >
          <AlertCircle size={48} className="mx-auto mb-6 text-crimson" />
          <h1 className="text-display text-4xl mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            You need a vendor account to access this dashboard.
          </p>
          <Link
            to="/login"
            className="inline-block btn-ink px-8 py-3 text-sm tracking-widest uppercase"
          >
            Sign In
          </Link>
        </motion.div>
      </div>
    );
  }

  const vendor = getVendorByUserId(currentUser.id) || { id: currentUser.id, userId: currentUser.id, storeName: currentUser.vendorStore?.name || `${currentUser.firstName} ${currentUser.lastName}`, description: currentUser.vendorStore?.description || "", commission: currentUser.vendorStore?.commission || 15, joinedAt: currentUser.createdAt || new Date().toISOString(), totalSales: 0, totalEarnings: 0, pendingPayout: 0 };

  const isMyProduct = useCallback((product) => {
    if (!product) return false;
    const currentId = currentUser?.id;
    const vendorId = vendor?.id;
    if (product.vendorId && (product.vendorId === currentId || product.vendorId === vendorId)) {
      return true;
    }
    const storeName = (vendor?.storeName || currentUser?.vendorStore?.name || "").trim().toLowerCase();
    if (product.vendor && storeName && product.vendor.trim().toLowerCase() === storeName) {
      return true;
    }
    const isAtelierParis = currentId === "vendor-1" || storeName === "atelier paris";
    if (isAtelierParis && (product.vendorId === "vendor-1" || product.vendorId === "ef-main" || !product.vendorId)) {
      return true;
    }
    return false;
  }, [currentUser?.id, currentUser?.vendorStore?.name, vendor?.id, vendor?.storeName]);

  const allProductsList = vendorProductsList;
  const myProductsList = useMemo(() => {
    return allProductsList.filter(isMyProduct);
  }, [allProductsList, isMyProduct]);

  const activeProductsList = productTab === "my" ? myProductsList : allProductsList;
  const vendorProducts = vendorProductsList;
  const orderNameScope = vendor?.id || currentUser?.id || null;

  const filteredVendorProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return activeProductsList;
    return activeProductsList.filter((p) =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.vendor?.toLowerCase().includes(q)
    );
  }, [activeProductsList, productSearch]);

  const localVendorOrders = getOrdersByVendor(vendor.id);
  const vendorOrders = useMemo(() => {
    const nonDuplicateLocal = localVendorOrders.filter(
      (local) => !vendorApiOrders.some((api) => (isSameOrder ? isSameOrder(local, api) : (api.id === local.id || api._id === local.id)))
    );
    const seen = new Set();
    const merged = [];
    for (const o of [...nonDuplicateLocal, ...vendorApiOrders]) {
      const id = o.id || o._id;
      if (id && !seen.has(id)) {
        seen.add(id);
        merged.push(o);
      }
    }
    return merged;
  }, [localVendorOrders, vendorApiOrders, isSameOrder]);
  const normalOrders = useMemo(() => vendorOrders.filter((o) => !o.rentalDetails), [vendorOrders]);
  const rentalOrders = useMemo(() => vendorOrders.filter((o) => o.rentalDetails), [vendorOrders]);
  const recentOrders = [...normalOrders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const filteredOrders = orderFilter === "all"
    ? normalOrders
    : normalOrders.filter((o) => o.status === orderFilter);
  const sortedFilteredOrders = [...filteredOrders].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredRentalOrders = rentalFilter === "all"
    ? rentalOrders
    : rentalOrders.filter((o) => o.status === rentalFilter);
  const sortedRentalOrders = [...filteredRentalOrders].sort((a, b) => new Date(b.date) - new Date(a.date));

  const pendingOrders = normalOrders.filter((o) => o.status !== "delivered" && o.status !== "returned").length;
  const allRentalProductsList = useMemo(() => vendorProducts.filter((p) => p.rentalAvailable), [vendorProducts]);
  const myRentalProductsList = useMemo(() => allRentalProductsList.filter(isMyProduct), [allRentalProductsList, isMyProduct]);
  const activeRentalProductsList = rentalTab === "my" ? myRentalProductsList : allRentalProductsList;
  const rentalProducts = activeRentalProductsList;

  const isItemForVendor = useCallback((item) => {
    if (!item) return false;
    const currentId = currentUser?.id;
    const vendorId = vendor?.id;
    if (item.vendorId && (item.vendorId === currentId || item.vendorId === vendorId)) {
      return true;
    }
    const storeName = (vendor?.storeName || currentUser?.vendorStore?.name || "").trim().toLowerCase();
    if (item.vendor && storeName && item.vendor.trim().toLowerCase() === storeName) {
      return true;
    }
    if (item.productId) {
      const prod = vendorProductsList.find((p) => p.id === item.productId || p._id === item.productId || p.slug === item.productId);
      if (prod && isMyProduct(prod)) {
        return true;
      }
    }
    const isAtelierParis = currentId === "vendor-1" || vendorId === "vendor-1" || storeName === "atelier paris";
    if (isAtelierParis && (item.vendorId === "vendor-1" || item.vendorId === "ef-main" || !item.vendorId)) {
      return true;
    }
    return false;
  }, [currentUser?.id, vendor?.id, vendor?.storeName, currentUser?.vendorStore?.name, vendorProductsList, isMyProduct]);

  const getVendorItemsForOrder = useCallback((order) => {
    if (!order || !order.items) return [];
    const matched = order.items.filter(isItemForVendor);
    if (matched.length > 0) return matched;
    if (order.vendorId && (order.vendorId === vendor?.id || order.vendorId === currentUser?.id)) {
      return order.items;
    }
    return [];
  }, [isItemForVendor, vendor?.id, currentUser?.id]);

  const getProductRealStats = useCallback((product) => {
    if (!product) return { orders: 0, revenue: 0, unitsSold: 0, views: 0 };

    const prodId = String(product.id || product._id || "").trim();
    const prodName = (product.name || "").trim().toLowerCase();

    let ordersCount = 0;
    let unitsSold = 0;
    let revenue = 0;

    vendorOrders.forEach((order) => {
      if (order.status === "cancelled" || order.rentalStatus === "cancelled") return;

      const items = order.items || [];
      const matchingItems = items.filter((item) => {
        const itemId = String(item.productId || "").trim();
        const itemName = (item.name || "").trim().toLowerCase();
        return (prodId && itemId === prodId) || (prodName && itemName === prodName);
      });

      if (matchingItems.length > 0) {
        ordersCount += 1;
        matchingItems.forEach((item) => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || Number(product.price) || 0;
          unitsSold += qty;
          revenue += price * qty;
        });
      }
    });

    let localViews = 0;
    try {
      localViews = parseInt(localStorage.getItem(`ef_views_${prodId}`) || "0", 10);
    } catch {}
    const views = Math.max(Number(product.views) || 0, localViews);

    return {
      orders: ordersCount,
      unitsSold,
      revenue,
      views,
    };
  }, [vendorOrders]);

  const getRentalProductRealStats = useCallback((product) => {
    if (!product) return { activeRentals: 0, totalRentals: 0, totalRentalRevenue: 0 };

    const prodId = String(product.id || product._id || "").trim();
    const prodName = (product.name || "").trim().toLowerCase();

    let activeRentals = 0;
    let totalRentals = 0;
    let totalRentalRevenue = 0;

    rentalOrders.forEach((ro) => {
      if (ro.status === "cancelled" || ro.rentalStatus === "cancelled") return;

      const items = ro.items || [];
      const matchingItems = items.filter((item) => {
        const itemId = String(item.productId || "").trim();
        const itemName = (item.name || "").trim().toLowerCase();
        return (prodId && itemId === prodId) || (prodName && itemName === prodName);
      });

      if (matchingItems.length > 0) {
        totalRentals += 1;
        if (ro.status === "active" || ro.rentalStatus === "active") {
          activeRentals += 1;
        }
        matchingItems.forEach((item) => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || (Number(product.rentalPricePerDay) * (Number(item.rentalDays) || 1)) || 0;
          totalRentalRevenue += price * qty;
        });
      }
    });

    return {
      activeRentals,
      totalRentals,
      totalRentalRevenue,
    };
  }, [rentalOrders]);

  const allTimeEarnings = useMemo(() => {
    let sales = 0;
    let rental = 0;
    let orderCount = 0;
    const rate = Number(vendor?.commission) || 15;

    vendorOrders.forEach((o) => {
      if (o.status === "cancelled" || o.rentalStatus === "cancelled") return;
      const vItems = getVendorItemsForOrder(o);
      if (vItems.length > 0) {
        orderCount += 1;
        vItems.forEach((item) => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          const totalItemPrice = price * qty;
          const isRental = Boolean(item.isRental || o.rentalDetails);
          if (isRental) {
            rental += totalItemPrice;
          } else {
            sales += totalItemPrice;
          }
        });
      }
    });

    const gross = sales + rental;
    const commission = Math.round(gross * (rate / 100));
    const net = gross - commission;

    return { sales, rental, gross, commission, net, orderCount };
  }, [vendorOrders, vendor?.commission, getVendorItemsForOrder]);

  const monthlyEarningsData = useMemo(() => {
    const months = [];
    const now = new Date();
    const rate = Number(vendor?.commission) || 15;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const monthShort = d.toLocaleString("en-US", { month: "short" });
      const fullLabel = `${monthShort} ${year}`;

      let sales = 0;
      let rental = 0;

      vendorOrders.forEach((o) => {
        if (o.status === "cancelled" || o.rentalStatus === "cancelled") return;
        const oDate = new Date(o.date || o.createdAt || 0);
        if (isNaN(oDate.getTime())) return;
        if (oDate.getFullYear() === year && oDate.getMonth() === monthIdx) {
          const vItems = getVendorItemsForOrder(o);
          vItems.forEach((item) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            const totalItemPrice = price * qty;
            const isRental = Boolean(item.isRental || o.rentalDetails);
            if (isRental) {
              rental += totalItemPrice;
            } else {
              sales += totalItemPrice;
            }
          });
        }
      });

      const total = sales + rental;
      const commission = Math.round(total * (rate / 100));
      const net = total - commission;

      months.push({
        month: monthShort,
        year,
        fullLabel,
        sales,
        rental,
        total,
        commission,
        net,
      });
    }

    return months;
  }, [vendorOrders, vendor?.commission, getVendorItemsForOrder]);

  const thisMonthData = monthlyEarningsData[monthlyEarningsData.length - 1] || { sales: 0, rental: 0, total: 0, commission: 0, net: 0 };
  const prevMonthData = monthlyEarningsData[monthlyEarningsData.length - 2] || { sales: 0, rental: 0, total: 0, commission: 0, net: 0 };

  const totalSalesThisMonth = thisMonthData.sales;
  const totalRentalThisMonth = thisMonthData.rental;
  const totalCommissionThisMonth = thisMonthData.commission;
  const totalNetThisMonth = thisMonthData.net;

  const totalSalesAllTime = allTimeEarnings.sales;
  const totalRentalAllTime = allTimeEarnings.rental;
  const totalNetAllTime = allTimeEarnings.net;
  const totalRevenue = allTimeEarnings.gross;

  const getChangePct = (curr, prev) => {
    if (prev > 0) return Math.round(((curr - prev) / prev) * 100);
    if (curr > 0) return 100;
    return 0;
  };

  const netMonthChangePct = getChangePct(thisMonthData.net, prevMonthData.net);
  const grossMonthChangePct = getChangePct(thisMonthData.total, prevMonthData.total);

  const totalCompletedWithdrawn = useMemo(() => {
    return withdrawals.filter((w) => w.status === "completed").reduce((s, w) => s + (Number(w.amount) || 0), 0);
  }, [withdrawals]);

  const totalProcessingWithdrawn = useMemo(() => {
    return withdrawals.filter((w) => w.status === "processing").reduce((s, w) => s + (Number(w.amount) || 0), 0);
  }, [withdrawals]);

  const availableBalance = useMemo(() => {
    return Math.max(0, totalNetAllTime - totalCompletedWithdrawn - totalProcessingWithdrawn);
  }, [totalNetAllTime, totalCompletedWithdrawn, totalProcessingWithdrawn]);

  const initProfile = () => {
    if (!profileForm.firstName) {
      setProfileForm({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        storeName: currentUser.vendorStore?.name || vendor.storeName,
        storeDescription: currentUser.vendorStore?.description || vendor.description,
        storeLogo: "",
        bankAccount: "",
        taxId: "",
      });
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const changes = {
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      email: profileForm.email,
      phone: profileForm.phone,
      vendorStore: {
        ...currentUser.vendorStore,
        name: profileForm.storeName,
        description: profileForm.storeDescription,
      },
    };
    try {
      const saved = await authApi.updateProfile(changes);
      updateProfile({ ...saved, id: saved._id || saved.id });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (error) { alert(error.message || "Could not save your store profile."); }
  };

  const getStockForProduct = useCallback((product) => {
    if (localInventory[product.id]) {
      return localInventory[product.id];
    }
    return product.stock || Object.fromEntries((product.inventory || []).map((item) => [item.size, item.stock]));
  }, [localInventory]);

  const handleLocalStockChange = async (productId, size, qty) => {
    const product = vendorProducts.find((item) => item.id === productId);
    if (!product) return;
    const stock = { ...getStockForProduct(product), [size]: Math.max(0, parseInt(qty) || 0) };
    setLocalInventory((prev) => ({ ...prev, [productId]: stock }));
    try {
      const inventory = Object.entries(stock).map(([stockSize, value]) => ({ size: stockSize, stock: value }));
      const savedInventory = await productsApi.updateStock(productId, inventory);
      setVendorProductsList((prev) => prev.map((item) => item.id === productId ? { ...item, inventory: savedInventory, stock } : item));
    } catch (error) { alert(error.message || "Could not save stock."); }
  };

  const handleNextStatus = (orderId, currentStatus) => {
    const idx = ORDER_STATUS_FLOW.indexOf(currentStatus);
    if (idx >= 0 && idx < ORDER_STATUS_FLOW.length - 1) {
      const nextStatus = ORDER_STATUS_FLOW[idx + 1];
      updateOrderStatusApi(orderId, nextStatus);
    }
  };

  const handleNextRentalStatus = (orderId, currentRentalStatus) => {
    const rentalStepIds = rentalStatusSteps.map((s) => s.id);
    const idx = rentalStepIds.indexOf(currentRentalStatus);
    if (idx >= 0 && idx < rentalStepIds.length - 1) {
      const nextRentalStatus = rentalStepIds[idx + 1];
      updateRentalStatusApi(orderId, nextRentalStatus);
    }
  };

  const handleWithdrawalRequest = (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount <= 0) return;
    if (amount > availableBalance) {
      alert(`Withdrawal amount cannot exceed your available balance of ${parsePrice(availableBalance)}.`);
      return;
    }
    const bankDetails = profileForm.bankAccount || currentUser?.bankAccount;
    const accountDisplay = withdrawalMethod === "bank"
      ? (bankDetails ? `Bank (${bankDetails.slice(-4) ? `****${bankDetails.slice(-4)}` : bankDetails})` : "Bank Account")
      : (currentUser?.email || "PayPal");

    const newWithdrawal = {
      id: `wd-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      amount,
      status: "processing",
      method: withdrawalMethod === "bank" ? "Bank Transfer" : "PayPal",
      account: accountDisplay,
    };
    setWithdrawals((prev) => [newWithdrawal, ...prev]);
    setWithdrawalAmount("");
    setShowWithdrawalForm(false);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setNewProductForm(true);
    setTimeout(() => productFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProductForm(true);
    setActiveTab("products");
    setExpandedProduct(null);
    setTimeout(() => productFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  };

  const handleSaveNewProduct = async (product) => {
    const inventory = Object.entries(product.stock || {}).map(([size, stock]) => ({ size, stock: Number(stock) }));
    const payload = {
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
      gender: product.gender,
      colors: product.colors,
      sizes: product.sizes,
      img: product.img,
      images: product.images,
      colorImages: product.colorImages,
      inventory,
      rentalAvailable: product.rentalAvailable,
      rentalPricePerDay: product.rentalPricePerDay,
      rentalDeposit: product.rentalDeposit,
      vendorId: vendor.id || currentUser.id,
    };
    try {
      const saved = editingProduct
        ? await productsApi.update(editingProduct.id, payload)
        : await productsApi.create(payload);
      const mapped = {
        ...saved,
        id: saved._id || saved.id,
        stock: Object.fromEntries((saved.inventory || []).map((item) => [item.size, item.stock])),
        approvalStatus: saved.approvalStatus || (editingProduct ? editingProduct.approvalStatus : "pending"),
      };
      setVendorProductsList((prev) => editingProduct ? prev.map((item) => item.id === mapped.id ? mapped : item) : [mapped, ...prev]);
      setProductTab("my");
      setNewProductForm(false);
      setEditingProduct(null);
      if (!editingProduct) {
        setProductModal({
          type: "success",
          title: "Submitted for Verification",
          message: "Product submitted successfully! It is now pending admin verification and will appear live in the store once approved.",
          product: mapped,
        });
      } else {
        setProductModal({
          type: "success",
          title: "Product Updated",
          message: `"${mapped.name}" has been updated successfully.`,
          product: mapped,
        });
      }
    } catch (error) {
      setProductModal({
        type: "error",
        title: "Could Not Save Product",
        message: error.message || "Could not save product.",
      });
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    try { await productsApi.delete(product.id); setVendorProductsList((prev) => prev.filter((p) => p.id !== product.id)); }
    catch (error) { alert(error.message || "Could not delete product."); }
  };

  const handleToggleRental = async (productId) => {
    const product = vendorProductsList.find((item) => item.id === productId);
    if (!product) return;
    const changes = { rentalAvailable: !product.rentalAvailable, rentalPricePerDay: !product.rentalAvailable ? product.rentalPricePerDay || 50 : 0 };
    try {
      const saved = await productsApi.update(productId, changes);
      setVendorProductsList((prev) => prev.map((item) => item.id === productId ? { ...saved, id: saved._id } : item));
    } catch (error) { alert(error.message || "Could not update rental availability."); }
  };

  const handleExportReport = () => {
    const header = "Month,Product Sales (€),Rental Income (€),Commission (€),Net Earnings (€)\n";
    const rows = monthlyEarningsData.map((m) =>
      `"${m.fullLabel}",${m.sales},${m.rental},${m.commission},${m.net}`
    ).join("\n");
    const totalSales = monthlyEarningsData.reduce((s, m) => s + m.sales, 0);
    const totalRental = monthlyEarningsData.reduce((s, m) => s + m.rental, 0);
    const totalCommission = monthlyEarningsData.reduce((s, m) => s + m.commission, 0);
    const totalNet = monthlyEarningsData.reduce((s, m) => s + m.net, 0);
    const summaryRow = `"Total",${totalSales},${totalRental},${totalCommission},${totalNet}`;
    const csv = header + rows + "\n" + summaryRow;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const storeSlug = (vendor.storeName || "vendor").toLowerCase().replace(/[^a-z0-9]/g, "-");
    a.download = `earnings-report-${storeSlug}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddRental = () => {
    setEditingRentalProduct(null);
    setNewRentalForm((prev) => !prev);
    setTimeout(() => rentalFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  };

  const handleRentalEdit = (product) => {
    setEditingRentalProduct(product);
    setNewRentalForm(true);
    setTimeout(() => rentalFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  };

  const handleSaveRentalProduct = async (product) => {
    const inventory = Object.entries(product.stock || {}).map(([size, stock]) => ({ size, stock: Number(stock) }));
    const payload = {
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
      gender: product.gender,
      colors: product.colors,
      sizes: product.sizes,
      img: product.img,
      images: product.images,
      colorImages: product.colorImages,
      inventory,
      rentalAvailable: true,
      rentalPricePerDay: Number(product.rentalPricePerDay) || Math.round(Number(product.price) * 0.1) || 50,
      rentalDeposit: Number(product.rentalDeposit) || 100,
      vendorId: vendor.id || currentUser.id,
    };
    try {
      const saved = editingRentalProduct
        ? await productsApi.update(editingRentalProduct.id, payload)
        : await productsApi.create(payload);
      const mapped = {
        ...saved,
        id: saved._id || saved.id,
        stock: Object.fromEntries((saved.inventory || []).map((item) => [item.size, item.stock])),
        approvalStatus: saved.approvalStatus || (editingRentalProduct ? editingRentalProduct.approvalStatus : "pending"),
      };
      setVendorProductsList((prev) => editingRentalProduct ? prev.map((item) => item.id === mapped.id ? mapped : item) : [mapped, ...prev]);
      setNewRentalForm(false);
      setEditingRentalProduct(null);
      setProductModal({
        type: "success",
        title: editingRentalProduct ? "Rental Item Updated" : "Rental Item Submitted",
        message: editingRentalProduct
          ? `"${mapped.name}" rental details have been updated successfully.`
          : `"${mapped.name}" has been added as a rental item and submitted for verification.`,
        product: mapped,
      });
    } catch (error) {
      setProductModal({
        type: "error",
        title: "Submission Error",
        message: error.message || "Could not save rental item.",
      });
    }
  };

  const handleToggleRentalDisable = (productId) => {
    handleToggleRental(productId);
  };

  const getInventoryStatus = (slug) => {
    const product = vendorProducts.find((item) => (item.slug || item.id) === slug);
    const stock = product ? getStockForProduct(product) : inventory[slug] || {};
    const total = Object.values(stock).reduce((a, b) => a + b, 0);
    if (total === 0) return { label: "Out of Stock", color: "text-red-600", bg: "bg-red-50" };
    if (total < 15) return { label: "Low Stock", color: "text-amber-600", bg: "bg-amber-50" };
    return { label: "In Stock", color: "text-emerald-600", bg: "bg-emerald-50" };
  };

  const filteredInventoryProducts = vendorProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.category.toLowerCase().includes(inventorySearch.toLowerCase());
    if (inventoryFilter === "all") return matchesSearch;
    const status = getInventoryStatus(p.slug || p.id);
    if (inventoryFilter === "inStock") return matchesSearch && status.label === "In Stock";
    if (inventoryFilter === "lowStock") return matchesSearch && status.label === "Low Stock";
    if (inventoryFilter === "outOfStock") return matchesSearch && status.label === "Out of Stock";
    return matchesSearch;
  });

  const renderOverview = () => (
    <div className="space-y-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard icon={TrendingUp} label="Total Orders" value={allTimeEarnings.orderCount.toLocaleString()} index={0} />
        <StatCard icon={DollarSign} label="Gross Revenue" value={parsePrice(allTimeEarnings.gross)} index={1} />
        <StatCard icon={Clock} label="Pending Orders" value={pendingOrders} index={2} />
        <StatCard icon={Package} label="My Products" value={myProductsList.length} index={3} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <StatCard icon={Repeat} label="My Rental Items" value={myRentalProductsList.length} index={4} />
        <StatCard icon={Banknote} label="Available Balance" value={parsePrice(availableBalance)} index={5} />
        <StatCard icon={Wallet} label="Total Earnings (Net)" value={parsePrice(allTimeEarnings.net)} index={6} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="eyebrow mb-6">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-secondary border border-border/60 rounded-sm p-4 gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-foreground text-sm min-w-0 truncate" title={getOrderItemNames(order, orderNameScope).join(", ")}>{getOrderName(order, orderNameScope)}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {getOrderItemNames(order, orderNameScope).length} item{getOrderItemNames(order, orderNameScope).length !== 1 ? "s" : ""} — {parsePrice(order.total)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(order.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="eyebrow mb-6">Earnings Overview</h2>
          <div className="bg-secondary border border-border/60 rounded-sm p-6">
            <div className="flex items-end gap-2 mb-6">
              <p className="text-display text-3xl">{parsePrice(totalSalesThisMonth + totalRentalThisMonth)}</p>
              <span className="text-xs text-muted-foreground mb-1">this month</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Product Sales</span>
                <span className="text-sm font-medium text-foreground">{parsePrice(totalSalesThisMonth)}</span>
              </div>
              <div className="w-full bg-cream h-2 rounded-full overflow-hidden">
                <div
                  className="bg-ink h-full rounded-full transition-all"
                  style={{ width: `${(totalSalesThisMonth + totalRentalThisMonth) > 0 ? (totalSalesThisMonth / (totalSalesThisMonth + totalRentalThisMonth)) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rental Income</span>
                <span className="text-sm font-medium text-foreground">{parsePrice(totalRentalThisMonth)}</span>
              </div>
              <div className="w-full bg-cream h-2 rounded-full overflow-hidden">
                <div
                  className="bg-crimson h-full rounded-full transition-all"
                  style={{ width: `${(totalSalesThisMonth + totalRentalThisMonth) > 0 ? (totalRentalThisMonth / (totalSalesThisMonth + totalRentalThisMonth)) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <span className="text-sm text-muted-foreground">Commission ({vendor.commission}%)</span>
                <span className="text-sm font-medium text-foreground">
                  {totalCommissionThisMonth > 0 ? `-${parsePrice(totalCommissionThisMonth)}` : parsePrice(0)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-wrap gap-4 pt-4 border-t border-border/60">
        <button onClick={() => setActiveTab("products")} className="btn-ink px-6 py-2.5 text-xs tracking-widest uppercase">
          View Products
        </button>
        <button onClick={() => setActiveTab("orders")} className="btn-ink-hover px-6 py-2.5 text-xs tracking-widest uppercase border border-border/60 text-foreground">
          View Orders
        </button>
        <button onClick={() => setActiveTab("earnings")} className="btn-ink-hover px-6 py-2.5 text-xs tracking-widest uppercase border border-border/60 text-foreground">
          Earnings Report
        </button>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="eyebrow">Product Listings</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="bg-cream border border-border/60 rounded-sm pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ink/30 w-48"
            />
          </div>
          <button
            onClick={handleAddProduct}
            className="btn-ink px-5 py-2.5 text-xs tracking-widest uppercase flex items-center gap-2"
          >
            <Plus size={14} />
            Add Product
          </button>
        </div>
      </div>

      {/* Product Sub-Tabs: Tab 1: All Products | Tab 2: My Products */}
      <div className="flex border-b border-border/80 gap-2">
        <button
          type="button"
          onClick={() => setProductTab("all")}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-serif flex items-center gap-2 border-b-2 transition-colors ${
            productTab === "all"
              ? "border-ink text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All Products
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            productTab === "all" ? "bg-ink text-cream" : "bg-secondary text-muted-foreground"
          }`}>
            {allProductsList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setProductTab("my")}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-serif flex items-center gap-2 border-b-2 transition-colors ${
            productTab === "my"
              ? "border-ink text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          My Products
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            productTab === "my" ? "bg-ink text-cream" : "bg-secondary text-muted-foreground"
          }`}>
            {myProductsList.length}
          </span>
        </button>
      </div>

      <div ref={productFormRef}>
        <AnimatePresence>
          {newProductForm && (
            <AddProductForm
              categories={PRODUCT_CATEGORIES}
              editProduct={editingProduct}
              onSave={handleSaveNewProduct}
              onCancel={() => {
                setNewProductForm(false);
                setEditingProduct(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {filteredVendorProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title={
            productSearch
              ? "No Products Found"
              : productTab === "my"
              ? "No Products in Your Store"
              : "No Products Found"
          }
          description={
            productSearch
              ? "No products match your search criteria."
              : productTab === "my"
              ? "You haven't added any products to your store yet. Click Add Product to start selling."
              : "No products currently available in the catalogue."
          }
          action={productSearch ? undefined : "Add First Product"}
          onAction={productSearch ? undefined : handleAddProduct}
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVendorProducts.map((product) => {
            const isOwned = isMyProduct(product);
            const productStock = getStockForProduct(product);
            const totalStock = Object.values(productStock).reduce((a, b) => a + b, 0);
            const isExpanded = expandedProduct === product.id;
            const stats = getProductRealStats(product);
            const stockStatus =
              totalStock === 0
                ? { label: "Out of Stock", color: "text-red-600" }
                : totalStock < 15
                ? { label: "Low Stock", color: "text-amber-600" }
                : { label: "In Stock", color: "text-emerald-600" };

            return (
              <motion.div
                key={product.id}
                layout
                className="bg-secondary border border-border/60 rounded-sm overflow-hidden"
              >
                <div
                  className="relative aspect-[4/5] overflow-hidden cursor-pointer"
                  onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                >
                  <img
                    src={product.img}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    <span className={`text-xs font-medium bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-full ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                    <span className="text-[10px] font-medium bg-background/90 backdrop-blur-sm text-foreground/80 border border-border px-2 py-0.5 rounded-full">
                      {isOwned ? "Your Product" : (product.vendor || "Other Vendor")}
                    </span>
                    {isOwned && product.approvalStatus === "pending" && (
                      <span className="text-[11px] font-medium bg-amber-100/95 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Clock size={11} /> Pending Review
                      </span>
                    )}
                    {isOwned && product.approvalStatus === "rejected" && (
                      <span className="text-[11px] font-medium bg-red-100/95 text-red-900 border border-red-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm" title={product.approvalReason || "Rejected by admin"}>
                        <AlertCircle size={11} /> Rejected
                      </span>
                    )}
                    {isOwned && (!product.approvalStatus || product.approvalStatus === "approved") && (
                      <span className="text-[11px] font-medium bg-emerald-100/95 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <CheckCircle size={11} /> Live in Store
                      </span>
                    )}
                  </div>
                  {product.rentalAvailable && (
                    <div className="absolute top-3 left-3">
                      <span className="text-xs font-medium bg-cream/90 backdrop-blur-sm text-ink px-2.5 py-1 rounded-full">
                        Rental Available
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-serif text-foreground font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <p className="text-display text-lg">{parsePrice(product.price)}</p>
                  </div>

                  {product.approvalStatus === "rejected" && (
                    <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <strong>Admin note:</strong> {product.approvalReason || "Product was rejected. Please review product details and resubmit."}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground mb-3 pt-3 border-t border-border/40">
                    <div>
                      <Eye size={14} className="mx-auto mb-1 opacity-60" />
                      <span className="font-medium text-foreground">{stats.views}</span>
                      <p>Views</p>
                    </div>
                    <div>
                      <ShoppingBag size={14} className="mx-auto mb-1 opacity-60" />
                      <span className="font-medium text-foreground">{stats.orders}</span>
                      <p>Orders</p>
                    </div>
                    <div>
                      <DollarSign size={14} className="mx-auto mb-1 opacity-60" />
                      <span className="font-medium text-foreground">{parsePrice(stats.revenue)}</span>
                      <p>Revenue</p>
                    </div>
                  </div>

                  {isOwned ? (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProduct(product);
                        }}
                        className="flex-1 text-xs tracking-widest uppercase py-2 border border-border/60 text-muted-foreground hover:text-foreground hover:border-ink/30 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit2 size={12} />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(product);
                        }}
                        className="text-xs tracking-widest uppercase py-2 px-3 border border-border/60 text-crimson hover:bg-crimson/5 transition-colors flex items-center justify-center gap-1.5"
                        title="Delete Product"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Link
                        to={`/product/${product.slug || product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-xs tracking-widest uppercase py-2 border border-border/60 text-muted-foreground hover:text-foreground hover:border-ink/30 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink size={12} />
                        View in Store
                      </Link>
                    </div>
                  )}

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-border/40 space-y-3">
                          <p className="text-xs font-medium text-foreground uppercase tracking-wider">Edit Details</p>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-muted-foreground mb-1">Name</label>
                              <input
                                type="text"
                                defaultValue={product.name}
                                className="w-full bg-cream border border-border/60 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ink/30"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-muted-foreground mb-1">Price (€)</label>
                              <input
                                type="number"
                                defaultValue={product.price}
                                className="w-full bg-cream border border-border/60 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ink/30"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Rental: {product.rentalAvailable ? `€${product.rentalPricePerDay}/day` : "Not available"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleRental(product.id);
                              }}
                              className="text-xs text-crimson underline underline-offset-2"
                            >
                              Toggle Rental
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderRentals = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h2 className="font-serif text-2xl text-foreground mt-1">Rental Listings</h2>
        </div>
        <button
          onClick={handleAddRental}
          className="btn-ink px-5 py-2.5 text-xs tracking-widest uppercase flex items-center gap-2"
        >
          <Plus size={14} />
          {newRentalForm ? "Close Form" : "Add Rental Item"}
        </button>
      </div>

      {/* Rental Sub-Tabs: Tab 1: All Rentals | Tab 2: My Rentals */}
      <div className="flex border-b border-border/80 gap-2">
        <button
          type="button"
          onClick={() => setRentalTab("all")}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-serif flex items-center gap-2 border-b-2 transition-colors ${
            rentalTab === "all"
              ? "border-ink text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All Rentals
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            rentalTab === "all" ? "bg-ink text-cream" : "bg-secondary text-muted-foreground"
          }`}>
            {allRentalProductsList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setRentalTab("my")}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-serif flex items-center gap-2 border-b-2 transition-colors ${
            rentalTab === "my"
              ? "border-ink text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          My Rentals
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            rentalTab === "my" ? "bg-ink text-cream" : "bg-secondary text-muted-foreground"
          }`}>
            {myRentalProductsList.length}
          </span>
        </button>
      </div>

      <div ref={rentalFormRef}>
        <AnimatePresence>
          {newRentalForm && (
            <AddProductForm
              categories={PRODUCT_CATEGORIES}
              editProduct={editingRentalProduct}
              defaultRental={true}
              title={editingRentalProduct ? "Edit Rental Item" : "Add New Rental Item"}
              onSave={handleSaveRentalProduct}
              onCancel={() => {
                setNewRentalForm(false);
                setEditingRentalProduct(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {rentalProducts.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title={rentalTab === "my" ? "No Rental Items Added Yet" : "No Rental Listings"}
          description={
            rentalTab === "my"
              ? "You haven't listed any of your products for rental yet. Click 'Add Rental Item' to add one."
              : "No rental items are currently available in the catalogue."
          }
          action="Add Rental Item"
          onAction={handleAddRental}
        />
      ) : (
        <div className="space-y-4">
          {rentalProducts.map((product) => {
            const isOwned = isMyProduct(product);
            const productStock = getStockForProduct(product);
            const totalStock = Object.values(productStock).reduce((a, b) => a + b, 0);
            const rentalStats = getRentalProductRealStats(product);

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary border border-border/60 rounded-sm p-5"
              >
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="w-24 h-32 flex-shrink-0 overflow-hidden rounded-sm relative">
                    <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[9px] font-medium bg-background/90 backdrop-blur-sm text-foreground/80 border border-border px-1.5 py-0.5 rounded-sm">
                      {isOwned ? "Your Item" : (product.vendor || "Other Vendor")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-serif text-foreground font-medium text-lg">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-display text-xl">{parsePrice(product.rentalPricePerDay)}<span className="text-sm text-muted-foreground font-sans">/day</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Sale price: {parsePrice(product.price)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/40">
                      <div>
                        <p className="text-xs text-muted-foreground">Available Stock</p>
                        <p className="text-sm font-medium text-foreground">{totalStock} units</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Active Rentals</p>
                        <p className="text-sm font-medium text-foreground">{rentalStats.activeRentals}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Rentals</p>
                        <p className="text-sm font-medium text-foreground">{rentalStats.totalRentals}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rental Revenue</p>
                        <p className="text-sm font-medium text-foreground">{parsePrice(rentalStats.totalRentalRevenue)}</p>
                      </div>
                    </div>
                    {isOwned ? (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleRentalEdit(product)}
                          className="text-xs tracking-widest uppercase py-2 px-4 border border-border/60 text-muted-foreground hover:text-foreground hover:border-ink/30 transition-colors flex items-center gap-1.5"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleRentalDisable(product.id)}
                          className="text-xs tracking-widest uppercase py-2 px-4 border border-border/60 text-crimson hover:bg-crimson/5 transition-colors flex items-center gap-1.5"
                        >
                          <Ban size={12} />
                          Disable
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-4">
                        <Link
                          to={`/product/${product.slug || product.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs tracking-widest uppercase py-2 px-4 border border-border/60 text-muted-foreground hover:text-foreground hover:border-ink/30 transition-colors flex items-center gap-1.5"
                        >
                          <ExternalLink size={12} />
                          View in Store
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="eyebrow">Inventory Management</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="bg-cream border border-border/60 rounded-sm pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ink/30 w-48"
            />
          </div>
          <div className="flex gap-1 bg-secondary border border-border/60 rounded-sm p-1">
            {["all", "inStock", "lowStock", "outOfStock"].map((filter) => (
              <button
                key={filter}
                onClick={() => setInventoryFilter(filter)}
                className={`text-xs tracking-wider uppercase px-3 py-1.5 rounded-sm transition-colors ${
                  inventoryFilter === filter
                    ? "bg-ink text-cream"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter === "all" ? "All" : filter === "inStock" ? "In Stock" : filter === "lowStock" ? "Low" : "Out"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-secondary border border-border/60 rounded-sm p-4 text-center">
          <p className="text-display text-2xl text-emerald-600">
            {vendorProducts.filter((p) => getInventoryStatus(p.slug || p.id).label === "In Stock").length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">In Stock</p>
        </div>
        <div className="bg-secondary border border-border/60 rounded-sm p-4 text-center">
          <p className="text-display text-2xl text-amber-600">
            {vendorProducts.filter((p) => getInventoryStatus(p.slug || p.id).label === "Low Stock").length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Low Stock</p>
        </div>
        <div className="bg-secondary border border-border/60 rounded-sm p-4 text-center">
          <p className="text-display text-2xl text-red-600">
            {vendorProducts.filter((p) => getInventoryStatus(p.slug || p.id).label === "Out of Stock").length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Out of Stock</p>
        </div>
      </div>

      {filteredInventoryProducts.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No Products Found"
          description="No products match your current filter."
        />
      ) : (
        <div className="bg-secondary border border-border/60 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Product</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Category</th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">XS</th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">S</th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">M</th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">L</th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">XL</th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Total</th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventoryProducts.map((product) => {
                  const slug = product.slug || product.id;
                  const productStock = getStockForProduct(product);
                  const totalStock = Object.values(productStock).reduce((a, b) => a + b, 0);
                  const status = getInventoryStatus(slug);

                  return (
                    <tr key={product.id} className="border-b border-border/30 hover:bg-cream/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 rounded-sm overflow-hidden flex-shrink-0">
                            <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-medium text-foreground">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{product.category}</td>
                      {product.sizes.map((size) => (
                        <td key={size} className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min={0}
                            value={productStock[size] ?? 0}
                            onChange={(e) => handleLocalStockChange(product.id, size, parseInt(e.target.value) || 0)}
                            className="w-14 bg-cream border border-border/60 rounded-sm px-2 py-1 text-sm text-center text-foreground focus:outline-none focus:ring-1 focus:ring-ink/30"
                          />
                        </td>
                      ))}
                      <td className="py-3 px-4 text-center font-medium text-foreground">{totalStock}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderOrders = () => {
    const filteredVendorOrders = vendorOrders.filter((o) => {
      if (o.rentalDetails) return false;
      const matchesSearch =
        getOrderSearchText(o, orderNameScope).includes(vendorOrderSearch.toLowerCase().trim()) ||
        (o.customerName || o.shipping?.name || `${o.shipping?.firstName || ""} ${o.shipping?.lastName || ""}`).toLowerCase().includes(vendorOrderSearch.toLowerCase());
      const matchesStatus = vendorOrderStatusFilter === "All" || o.status === vendorOrderStatusFilter;
      return matchesSearch && matchesStatus;
    });
    const sortedVendorOrders = [...filteredVendorOrders].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    const vendorOrderStatusCounts = {
      All: filteredVendorOrders.length,
      confirmed: filteredVendorOrders.filter((o) => o.status === "confirmed").length,
      preparing: filteredVendorOrders.filter((o) => o.status === "preparing").length,
      dispatched: filteredVendorOrders.filter((o) => o.status === "dispatched").length,
      shipped: filteredVendorOrders.filter((o) => o.status === "shipped").length,
      delivered: filteredVendorOrders.filter((o) => o.status === "delivered").length,
      return_requested: filteredVendorOrders.filter((o) => o.status === "return_requested").length,
      cancelled: filteredVendorOrders.filter((o) => o.status === "cancelled").length,
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ShoppingBag} label="Total Orders" value={vendorOrders.length} index={0} />
          <StatCard icon={Clock} label="Pending" value={vendorOrderStatusCounts.confirmed + vendorOrderStatusCounts.preparing} index={1} />
          <StatCard icon={Package} label="Shipped" value={vendorOrderStatusCounts.shipped} index={2} />
          <StatCard icon={CheckCircle} label="Delivered" value={vendorOrderStatusCounts.delivered} index={3} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders by product name or customer name..."
              value={vendorOrderSearch}
              onChange={(e) => setVendorOrderSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors"
            />
          </div>
          <select
            value={vendorOrderStatusFilter}
            onChange={(e) => setVendorOrderStatusFilter(e.target.value)}
            className="px-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors appearance-none cursor-pointer"
          >
            {Object.keys(vendorOrderStatusCounts).map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Statuses" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>

        {vendorOrdersLoading && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading orders from server...</p>
          </div>
        )}

        <div className="bg-cream border border-border overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-serif">
            <div className="col-span-2">Order Name</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-2">Items</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Total</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Actions</div>
          </div>
          <div className="divide-y divide-border">
            <AnimatePresence>
              {sortedVendorOrders.map((order, i) => {
                const isExpanded = expandedVendorOrder === order.id;
                return (
                  <motion.div
                    key={order.id}
                    variants={fadeUp}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                  >
                    <div
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-secondary/50 transition-colors items-center cursor-pointer"
                      onClick={() => setExpandedVendorOrder(isExpanded ? null : order.id)}
                    >
                      <div className="md:col-span-2 text-sm text-foreground min-w-0 truncate" title={getOrderItemNames(order, orderNameScope).join(", ") || order.id}>{getOrderName(order, orderNameScope)}</div>
                      <div className="md:col-span-2 text-sm text-foreground">{order.customerName || order.shipping?.firstName || ""} {order.customerName ? "" : (order.shipping?.lastName || "")}</div>
                      <div className="md:col-span-2 text-sm text-muted-foreground">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}</div>
                      <div className="md:col-span-2 text-sm text-muted-foreground">
                        {new Date(order.date || order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="md:col-span-1 font-serif text-sm text-foreground">${(order.total || 0).toLocaleString()}</div>
                      <div className="md:col-span-1"><StatusBadge status={order.status} /></div>
                      <div className="md:col-span-2 flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedVendorOrder(isExpanded ? null : order.id); }}
                          className="p-2 hover:bg-ink/5 rounded transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-4">
                            <OrderDetailPanel order={order} showCustomer={true} />
                            {/* Status Controls / Return Flow */}
                            {order.status === "return_requested" || order.status === "refund_processing" || order.status === "returned" || order.returnRequested ? (
                              <div className="mt-4 pt-4 border-t border-border">
                                <ReturnStatusTracker
                                  order={order}
                                  onConfirmReturn={confirmReturn}
                                  onCompleteRefund={completeRefund}
                                  isVendorOrAdmin={true}
                                />
                              </div>
                            ) : order.status === "cancelled" ? (
                              <div className="mt-4 pt-4 border-t border-border">
                                <div className="w-full flex items-center justify-between bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-3 text-xs text-zinc-700 dark:text-zinc-300">
                                  <span className="font-semibold uppercase tracking-wider">Order Cancelled</span>
                                  <span className="text-[10px] text-zinc-500 font-mono">No forward fulfillment actions available</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-3 mt-4 pt-4 border-t border-border flex-wrap items-center">
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-1">
                                  Update Status:
                                </span>
                                {["confirmed", "preparing", "dispatched", "shipped", "delivered", "cancelled"].map((status) => {
                                  const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status);
                                  const targetIdx = ORDER_STATUS_FLOW.indexOf(status);
                                  const isPast = targetIdx !== -1 && currentIdx !== -1 && targetIdx < currentIdx;
                                  const isCurrent = order.status === status;
                                  const isNext = targetIdx === currentIdx + 1;
                                  const isCancelDisabled = status === "cancelled" && ["dispatched", "shipped", "delivered"].includes(order.status);
                                  const isDisabled = isPast || isCurrent || isCancelDisabled;

                                  return (
                                    <button
                                      key={status}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (status === "dispatched") {
                                          setDispatchModalOrder(order);
                                          return;
                                        }
                                        updateOrderStatusApi(order.id, status);
                                        setExpandedVendorOrder(null);
                                      }}
                                      disabled={isDisabled}
                                      className={`text-xs tracking-wider uppercase px-3 py-2 rounded-sm transition-colors ${
                                        isCurrent
                                          ? "bg-ink/10 text-ink border border-ink/30"
                                          : isPast
                                          ? "border border-border/40 text-muted-foreground/40 bg-secondary/30"
                                          : "border border-border text-muted-foreground hover:text-foreground hover:border-ink/30"
                                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                                      title={isPast ? "Status already passed (cannot go back)" : isCurrent ? "Current status" : `Update to ${status}`}
                                    >
                                      {status}
                                    </button>
                                  );
                                })}
                                {order.status === "dispatched" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDispatchModalOrder(order);
                                    }}
                                    className="text-xs text-amber-800 bg-amber-50 border border-amber-300 px-3 py-2 rounded-sm hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                                  >
                                    <Truck size={12} />
                                    <span>{order.trackingUrl ? "Edit Tracking Link" : "+ Add Tracking Link"}</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {sortedVendorOrders.length === 0 && (
              <div className="px-6 py-12">
                <EmptyState icon={ShoppingBag} title="No orders found" description="No orders match your search criteria." />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRentalOrders = () => {
    const filteredVendorRentalOrders = rentalOrders.filter((o) => {
      const matchesSearch =
        getOrderSearchText(o, orderNameScope).includes(vendorRentalOrderSearch.toLowerCase().trim()) ||
        (o.customerName || o.shipping?.name || `${o.shipping?.firstName || ""} ${o.shipping?.lastName || ""}`).toLowerCase().includes(vendorRentalOrderSearch.toLowerCase());
      const matchesStatus = vendorRentalOrderStatusFilter === "All" ||
        o.status === vendorRentalOrderStatusFilter ||
        o.rentalStatus === vendorRentalOrderStatusFilter;
      return matchesSearch && matchesStatus;
    });
    const sortedVendorRentalOrders = [...filteredVendorRentalOrders].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    const vendorFilterStatuses = [
      "confirmed", "preparing", "dispatched", "shipped", "delivered", "active",
      "pending_return", "awaiting_inspection", "inspected", "deposit_refunded",
      "completed", "cancelled",
    ];
    const vendorRentalStatusCounts = { All: filteredVendorRentalOrders.length };
    vendorFilterStatuses.forEach((s) => {
      vendorRentalStatusCounts[s] = filteredVendorRentalOrders.filter(
        (o) => o.status === s || o.rentalStatus === s
      ).length;
    });

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Repeat} label="Total Rental Orders" value={rentalOrders.length} index={0} />
          <StatCard icon={Clock} label="Pending Return" value={vendorRentalStatusCounts.pending_return + vendorRentalStatusCounts.awaiting_inspection} index={1} />
          <StatCard icon={Package} label="Shipped" value={vendorRentalStatusCounts.shipped} index={2} />
          <StatCard icon={CheckCircle} label="Deposit Refunded" value={vendorRentalStatusCounts.deposit_refunded} index={3} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search rental orders by product name or customer name..."
              value={vendorRentalOrderSearch}
              onChange={(e) => setVendorRentalOrderSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors"
            />
          </div>
          <select
            value={vendorRentalOrderStatusFilter}
            onChange={(e) => setVendorRentalOrderStatusFilter(e.target.value)}
            className="px-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors appearance-none cursor-pointer"
          >
            {Object.keys(vendorRentalStatusCounts).map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Statuses" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>

        {vendorOrdersLoading && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading rental orders from server...</p>
          </div>
        )}

        <div className="bg-cream border border-border overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-serif">
            <div className="col-span-2">Order Name</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-2">Items</div>
            <div className="col-span-2">Rental Period</div>
            <div className="col-span-1">Total</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Actions</div>
          </div>
          <div className="divide-y divide-border">
            <AnimatePresence>
              {sortedVendorRentalOrders.map((order, i) => {
                const isExpanded = expandedVendorRentalOrder === order.id;
                const rentalStepIds = rentalStatusSteps.map((s) => s.id);
                const currentRentalStep = rentalStepIds.indexOf(order.rentalStatus || order.status);
                const dueDate = getRentalDueDate(order);
                const overdue = isRentalOverdue(order);
                return (
                  <motion.div
                    key={order.id}
                    variants={fadeUp}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                  >
                    <div
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-secondary/50 transition-colors items-center cursor-pointer"
                      onClick={() => setExpandedVendorRentalOrder(isExpanded ? null : order.id)}
                    >
                      <div className="md:col-span-2 text-sm text-foreground min-w-0 truncate" title={getOrderItemNames(order, orderNameScope).join(", ") || order.id}>{getOrderName(order, orderNameScope)}</div>
                      <div className="md:col-span-2 text-sm text-foreground">{order.customerName || order.shipping?.firstName || ""} {order.customerName ? "" : (order.shipping?.lastName || "")}</div>
                      <div className="md:col-span-2 text-sm text-muted-foreground">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}</div>
                      <div className="md:col-span-2 text-sm text-muted-foreground">
                        {order.rentalDetails?.startDate ? new Date(order.rentalDetails.startDate).toLocaleDateString() : "-"} →{" "}
                        {order.rentalDetails?.endDate ? new Date(order.rentalDetails.endDate).toLocaleDateString() : "-"}
                        {order.rentalDetails?.rentalDays ? ` (${order.rentalDetails.rentalDays}d)` : ""}
                        {dueDate && (
                          <span className="block text-[11px] mt-0.5 text-muted-foreground">
                            Due {dueDate.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="md:col-span-1">
                        <StatusBadge status={order.rentalStatus || order.status} />
                        {overdue && (
                          <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="md:col-span-2 flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedVendorRentalOrder(isExpanded ? null : order.id); }}
                          className="p-2 hover:bg-ink/5 rounded transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-4">
                            {order.rentalDetails && (
                              <div className="bg-background rounded-sm p-4 mb-4 border border-border">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Rental Details</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                  {order.rentalDetails.startDate && (
                                    <div>
                                      <p className="text-muted-foreground text-xs">Start Date</p>
                                      <p className="text-foreground">{new Date(order.rentalDetails.startDate).toLocaleDateString()}</p>
                                    </div>
                                  )}
                                  {order.rentalDetails.endDate && (
                                    <div>
                                      <p className="text-muted-foreground text-xs">End Date</p>
                                      <p className="text-foreground">{new Date(order.rentalDetails.endDate).toLocaleDateString()}</p>
                                    </div>
                                  )}
                                  {order.rentalDetails.rentalDays && (
                                    <div>
                                      <p className="text-muted-foreground text-xs">Rental Days</p>
                                      <p className="text-foreground">{order.rentalDetails.rentalDays} days</p>
                                    </div>
                                  )}
                                  {order.rentalDetails.rentalPricePerDay && (
                                    <div>
                                      <p className="text-muted-foreground text-xs">Price Per Day</p>
                                      <p className="text-foreground">${order.rentalDetails.rentalPricePerDay}</p>
                                    </div>
                                  )}
                                  {dueDate && (
                                    <div>
                                      <p className="text-muted-foreground text-xs">Return Due</p>
                                      <p className={overdue ? "text-red-600 font-medium" : "text-foreground"}>
                                        {dueDate.toLocaleDateString()}
                                        {overdue && " · Overdue"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                  <div>
                                    <p className="text-muted-foreground text-xs">Deposit</p>
                                    <p className="text-foreground">${order.deposit || 100}</p>
                                  </div>
                                  {order.depositRefunded && (
                                    <div>
                                      <p className="text-muted-foreground text-xs">Deposit Refunded</p>
                                      <p className="text-emerald-600 font-medium">${order.refundAmount}</p>
                                    </div>
                                  )}
                                  {order.returnRequested && (
                                    <div>
                                      <p className="text-muted-foreground text-xs">Return Status</p>
                                      <p className="text-amber-600 font-medium capitalize">{order.rentalStatus?.replace("_", " ") || "pending"}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Rental Return Roadmap - 10 Step Lifecycle */}
                            <div className="bg-background rounded-sm p-4 mb-4 border border-border">
                              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Return Roadmap</p>
                              <div className="overflow-x-auto pb-2">
                                <div className="flex items-start min-w-[720px] relative">
                                  {rentalStatusSteps.map((step, idx) => {
                                    const isCompleted = idx <= currentRentalStep;
                                    const isCurrent = idx === currentRentalStep;
                                    return (
                                      <div key={step.id} className="relative flex-1 flex flex-col items-center text-center">
                                        {idx < rentalStatusSteps.length - 1 && (
                                          <div
                                            className={`absolute top-3.5 left-1/2 w-full h-[2px] -translate-y-1/2 z-0 ${
                                              idx < currentRentalStep ? "bg-ink" : "bg-border"
                                            }`}
                                          />
                                        )}
                                        <div
                                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors z-10 relative ring-4 ring-background ${
                                            isCompleted
                                              ? "bg-ink text-cream"
                                              : isCurrent
                                              ? "bg-ink/20 text-ink border-2 border-ink"
                                              : "bg-secondary text-muted-foreground border border-border"
                                          }`}
                                        >
                                          {isCompleted ? (
                                            <Check className="w-3.5 h-3.5 stroke-[2.2]" />
                                          ) : typeof step.icon === "function" || typeof step.icon === "object" ? (
                                            <step.icon className="w-3.5 h-3.5 stroke-[1.8]" />
                                          ) : (
                                            step.icon
                                          )}
                                        </div>
                                        <span
                                          className={`text-[9px] mt-2 text-center leading-tight line-clamp-2 max-w-[68px] ${
                                            isCurrent ? "text-foreground font-semibold" : "text-muted-foreground"
                                          }`}
                                        >
                                          {step.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            <OrderDetailPanel order={order} showCustomer={true} />
                            <div className="flex gap-3 mt-4 pt-4 border-t border-border flex-wrap">
                              {order.rentalDetails && order.returnRequested && ["pending_return", "awaiting_inspection"].includes(order.rentalStatus) && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); inspectOrder(order.id, "passed", ""); }}
                                    className="text-xs bg-emerald-600 text-white px-3 py-2 rounded-sm hover:bg-emerald-700 transition-colors"
                                  >
                                    Inspect – Pass
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); inspectOrder(order.id, "damaged", "Item damaged"); }}
                                    className="text-xs bg-red-600 text-white px-3 py-2 rounded-sm hover:bg-red-700 transition-colors"
                                  >
                                    Inspect – Damaged
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); inspectOrder(order.id, "partial_refund", "Partial damage"); }}
                                    className="text-xs bg-amber-600 text-white px-3 py-2 rounded-sm hover:bg-amber-700 transition-colors"
                                  >
                                    Inspect – Partial Refund
                                  </button>
                                </>
                              )}
                              {order.rentalDetails && order.returnRequested && order.status === "delivered" && order.rentalStatus === "pending_return" && (
                                (order.returnPhotos || []).length > 0 ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); confirmReturn(order.id); }}
                                    className="text-xs bg-emerald-600 text-white px-3 py-2 rounded-sm hover:bg-emerald-700 transition-colors"
                                  >
                                    Confirm Return Received
                                  </button>
                                ) : (
                                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-sm">
                                    Awaiting customer return photos
                                  </span>
                                )
                              )}
                              {order.status === "return_requested" && (
                                (order.returnPhotos || []).length > 0 ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); confirmReturn(order.id); }}
                                    className="text-xs bg-emerald-600 text-white px-3 py-2 rounded-sm hover:bg-emerald-700 transition-colors"
                                  >
                                    Review Photos & Confirm Return
                                  </button>
                                ) : (
                                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-sm">
                                    Awaiting customer return photos
                                  </span>
                                )
                              )}
                              {rentalStatusSteps.map((step) => {
                                const currentRentalStepId = order.rentalStatus || order.status;
                                const currentIdx = rentalStatusSteps.findIndex((s) => s.id === currentRentalStepId);
                                const stepIdx = rentalStatusSteps.findIndex((s) => s.id === step.id);
                                const isCurrentOrPast = stepIdx <= currentIdx;
                                const isNext = stepIdx === currentIdx + 1;
                                return (
                                  <button
                                    key={step.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isNext) {
                                        if (step.id === "dispatched") {
                                          setDispatchModalOrder(order);
                                          return;
                                        }
                                        handleNextRentalStatus(order.id, currentRentalStepId);
                                      }
                                    }}
                                    disabled={!isNext}
                                    className={`text-xs tracking-wider uppercase px-3 py-2 rounded-sm transition-colors ${
                                      isCurrentOrPast
                                        ? "bg-ink/10 text-ink border border-ink/30"
                                        : isNext
                                        ? "border border-ink text-ink hover:bg-ink hover:text-cream"
                                        : "border border-border text-muted-foreground"
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                  >
                                    {step.label}
                                  </button>
                                );
                              })}
                              {(order.rentalStatus === "dispatched" || order.status === "dispatched") && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDispatchModalOrder(order);
                                  }}
                                  className="text-xs text-amber-800 bg-amber-50 border border-amber-300 px-3 py-2 rounded-sm hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                                >
                                  <Truck size={12} />
                                  <span>{order.trackingUrl ? "Edit Tracking Link" : "+ Add Tracking Link"}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {sortedVendorRentalOrders.length === 0 && (
              <div className="px-6 py-12">
                <EmptyState icon={Repeat} title="No rental orders found" description="No rental orders match your search criteria." />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEarnings = () => {
    const maxEarning = Math.max(...monthlyEarningsData.map((m) => m.sales + m.rental), 0);

    return (
      <div className="space-y-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-secondary border border-border/60 rounded-sm p-6">
            <p className="eyebrow mb-3">Total Earnings</p>
            <p className="text-display text-3xl">{parsePrice(totalNetAllTime)}</p>
            {grossMonthChangePct !== 0 ? (
              <p className={`text-xs mt-2 flex items-center gap-1 ${grossMonthChangePct > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {grossMonthChangePct > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {grossMonthChangePct > 0 ? `+${grossMonthChangePct}%` : `${grossMonthChangePct}%`} from last month
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">All-time net earnings</p>
            )}
          </div>
          <div className="bg-secondary border border-border/60 rounded-sm p-6">
            <p className="eyebrow mb-3">This Month</p>
            <p className="text-display text-3xl">{parsePrice(totalSalesThisMonth + totalRentalThisMonth)}</p>
            <p className="text-xs text-muted-foreground mt-2">Sales + Rentals</p>
          </div>
          <div className="bg-secondary border border-border/60 rounded-sm p-6">
            <p className="eyebrow mb-3">Commission Paid</p>
            <p className="text-display text-3xl">{parsePrice(totalCommissionThisMonth)}</p>
            <p className="text-xs text-muted-foreground mt-2">{vendor.commission}% rate</p>
          </div>
          <div className="bg-secondary border border-border/60 rounded-sm p-6">
            <p className="eyebrow mb-3">Net Earnings (Month)</p>
            <p className="text-display text-3xl">{parsePrice(totalNetThisMonth)}</p>
            {netMonthChangePct !== 0 ? (
              <p className={`text-xs mt-2 flex items-center gap-1 ${netMonthChangePct > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {netMonthChangePct > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {netMonthChangePct > 0 ? `+${netMonthChangePct}%` : `${netMonthChangePct}%`} from last month
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">After platform commission</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="eyebrow">Monthly Revenue Breakdown</h2>
            <button
              onClick={handleExportReport}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Download size={12} />
              Export Report
            </button>
          </div>
          <div className="bg-secondary border border-border/60 rounded-sm p-6">
            <div className="flex items-end gap-6 h-64 mb-4">
              {monthlyEarningsData.map((month) => {
                const monthTotal = month.sales + month.rental;
                const barHeightPct = maxEarning > 0 ? (monthTotal / maxEarning) * 100 : 0;
                const salesShare = monthTotal > 0 ? (month.sales / monthTotal) * 100 : 0;
                const rentalShare = monthTotal > 0 ? (month.rental / monthTotal) * 100 : 0;

                return (
                  <div key={month.fullLabel} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    {monthTotal > 0 ? (
                      <div className="w-full flex flex-col gap-0.5" style={{ height: `${barHeightPct}%` }}>
                        {month.sales > 0 && (
                          <div
                            className="w-full bg-ink rounded-t-sm transition-all"
                            style={{ height: `${salesShare}%` }}
                            title={`Sales: ${parsePrice(month.sales)}`}
                          />
                        )}
                        {month.rental > 0 && (
                          <div
                            className="w-full bg-crimson rounded-b-sm transition-all"
                            style={{ height: `${rentalShare}%` }}
                            title={`Rentals: ${parsePrice(month.rental)}`}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-[2px] bg-border/60 rounded-full" title={`${month.fullLabel}: ${parsePrice(0)}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              {monthlyEarningsData.map((m) => (
                <span key={m.fullLabel} className="flex-1 text-center truncate px-1">{m.month}</span>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border/40">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-ink rounded-sm" />
                <span className="text-xs text-muted-foreground">Product Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-crimson rounded-sm" />
                <span className="text-xs text-muted-foreground">Rental Income</span>
              </div>
            </div>
            {maxEarning === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                No revenue recorded yet for the past 7 months.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="eyebrow mb-6">Detailed Earnings</h2>
          <div className="bg-secondary border border-border/60 rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Month</th>
                    <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Product Sales</th>
                    <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Rental Income</th>
                    <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Commission</th>
                    <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Net Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyEarningsData.map((month) => (
                    <tr key={month.fullLabel} className="border-b border-border/30 hover:bg-cream/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{month.fullLabel}</td>
                      <td className="py-3 px-4 text-right text-foreground">{parsePrice(month.sales)}</td>
                      <td className="py-3 px-4 text-right text-foreground">{parsePrice(month.rental)}</td>
                      <td className="py-3 px-4 text-right text-crimson">
                        {month.commission > 0 ? `-${parsePrice(month.commission)}` : parsePrice(0)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">
                        {parsePrice(month.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border/60 font-medium">
                    <td className="py-3 px-4 text-foreground">Total (Last 7 Months)</td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {parsePrice(monthlyEarningsData.reduce((s, m) => s + m.sales, 0))}
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {parsePrice(monthlyEarningsData.reduce((s, m) => s + m.rental, 0))}
                    </td>
                    <td className="py-3 px-4 text-right text-crimson">
                      {monthlyEarningsData.reduce((s, m) => s + m.commission, 0) > 0
                        ? `-${parsePrice(monthlyEarningsData.reduce((s, m) => s + m.commission, 0))}`
                        : parsePrice(0)}
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {parsePrice(monthlyEarningsData.reduce((s, m) => s + m.net, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWithdrawals = () => (
    <div className="space-y-10">
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-secondary border border-border/60 rounded-sm p-6">
          <p className="eyebrow mb-3">Available Balance</p>
          <p className="text-display text-3xl">{parsePrice(availableBalance)}</p>
        </div>
        <div className="bg-secondary border border-border/60 rounded-sm p-6">
          <p className="eyebrow mb-3">Total Withdrawn</p>
          <p className="text-display text-3xl">{parsePrice(totalCompletedWithdrawn)}</p>
        </div>
        <div className="bg-secondary border border-border/60 rounded-sm p-6">
          <p className="eyebrow mb-3">Processing</p>
          <p className="text-display text-3xl">{parsePrice(totalProcessingWithdrawn)}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="eyebrow">Request Withdrawal</h2>
          <button
            onClick={() => setShowWithdrawalForm(!showWithdrawalForm)}
            className="btn-ink px-5 py-2.5 text-xs tracking-widest uppercase flex items-center gap-2"
          >
            <Plus size={14} />
            New Withdrawal
          </button>
        </div>

        <AnimatePresence>
          {showWithdrawalForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleWithdrawalRequest} className="bg-secondary border border-border/60 rounded-sm p-6 space-y-5 mb-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Amount (€)</label>
                    <input
                      type="number"
                      min={1}
                      max={availableBalance}
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                      placeholder="0.00"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Max: {parsePrice(availableBalance)}</p>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Method</label>
                    <select
                      value={withdrawalMethod}
                      onChange={(e) => setWithdrawalMethod(e.target.value)}
                      className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                    >
                      <option value="bank">Bank Transfer {profileForm.bankAccount || currentUser?.bankAccount ? `(****${(profileForm.bankAccount || currentUser?.bankAccount).slice(-4)})` : ""}</option>
                      <option value="paypal">PayPal ({currentUser?.email || "Account Email"})</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-ink px-6 py-2.5 text-xs tracking-widest uppercase">
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWithdrawalForm(false)}
                    className="btn-ink-hover px-6 py-2.5 text-xs tracking-widest uppercase border border-border/60 text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <h2 className="eyebrow mb-6">Withdrawal History</h2>
        <div className="bg-secondary border border-border/60 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">ID</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Method</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Account</th>
                  <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Amount</th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                      No withdrawal requests yet.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-border/30">
                      <td className="py-3 px-4 text-foreground">
                        {new Date(w.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{w.id}</td>
                      <td className="py-3 px-4 text-foreground">{w.method}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{w.account}</td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">{parsePrice(w.amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={w.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => {
    if (!profileForm.firstName) initProfile();

    return (
      <div className="max-w-2xl space-y-10">
        <form onSubmit={handleSaveProfile} className="space-y-8">
          <div>
            <h2 className="eyebrow mb-6">Personal Information</h2>
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                    className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                    className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 pt-8">
            <h2 className="eyebrow mb-6">Store Information</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Store Name</label>
                <input
                  type="text"
                  value={profileForm.storeName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, storeName: e.target.value }))}
                  className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Store Description</label>
                <textarea
                  value={profileForm.storeDescription}
                  onChange={(e) => setProfileForm((p) => ({ ...p, storeDescription: e.target.value }))}
                  rows={4}
                  className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Store Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-cream border border-border/60 rounded-sm flex items-center justify-center overflow-hidden">
                    {profileForm.storeLogo ? (
                      <img src={profileForm.storeLogo} alt="Store logo" className="w-full h-full object-cover" />
                    ) : (
                      <Image size={24} className="text-muted-foreground" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="text-xs tracking-widest uppercase py-2 px-4 border border-border/60 text-muted-foreground hover:text-foreground hover:border-ink/30 transition-colors"
                  >
                    Upload Logo
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setProfileForm((p) => ({ ...p, storeLogo: ev.target.result }));
                      };
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 pt-8">
            <h2 className="eyebrow mb-6">Payment Details</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Bank Account</label>
                <input
                  type="text"
                  value={profileForm.bankAccount}
                  onChange={(e) => setProfileForm((p) => ({ ...p, bankAccount: e.target.value }))}
                  className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                  placeholder="IBAN or account number"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Tax ID / VAT Number</label>
                <input
                  type="text"
                  value={profileForm.taxId}
                  onChange={(e) => setProfileForm((p) => ({ ...p, taxId: e.target.value }))}
                  className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                  placeholder="FR12345678901"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" className="btn-ink px-8 py-3 text-xs tracking-widest uppercase">
              Save Changes
            </button>
            <AnimatePresence>
              {profileSaved && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-emerald-600 flex items-center gap-1.5"
                >
                  <CheckCircle size={14} />
                  Saved
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </form>

        <div className="border-t border-border/60 pt-8">
          <h2 className="eyebrow mb-6">Commission & Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary border border-border/60 rounded-sm p-5">
              <p className="text-xs text-muted-foreground mb-1">Commission Rate</p>
              <p className="font-serif text-foreground text-lg">{vendor.commission}%</p>
            </div>
            <div className="bg-secondary border border-border/60 rounded-sm p-5">
              <p className="text-xs text-muted-foreground mb-1">Member Since</p>
              <p className="font-serif text-foreground">
                {new Date(vendor.joinedAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="bg-secondary border border-border/60 rounded-sm p-5">
              <p className="text-xs text-muted-foreground mb-1">Total Products</p>
              <p className="font-serif text-foreground">{vendorProducts.length}</p>
            </div>
            <div className="bg-secondary border border-border/60 rounded-sm p-5">
              <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
              <p className="font-serif text-foreground">{vendorOrders.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAds = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Promotion tools</p>
          <h2 className="font-serif text-2xl text-foreground mt-1">Your advertisements</h2>
        </div>
        <button
          onClick={() => (showAdForm ? closeAdForm() : setShowAdForm(true))}
          className="btn-ink px-5 py-2.5 text-xs uppercase tracking-widest flex items-center gap-2"
        >
          <Plus size={14} /> New Ad
        </button>
      </div>

      {showAdForm && (
        <div className="bg-cream border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="eyebrow">{editingAdId ? "— Edit Advertisement" : "— New Advertisement"}</p>
            <button onClick={closeAdForm} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Close">
              <X size={16} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">Ad Title <span className="text-crimson">*</span></label>
              <input
                value={adForm.title}
                onChange={(e) => setAdForm((form) => ({ ...form, title: e.target.value }))}
                placeholder="e.g. Winter Atelier Sale"
                className="w-full px-4 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-ink/40"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">Offer Subtitle (Optional)</label>
              <input
                value={adForm.subtitle}
                onChange={(e) => setAdForm((form) => ({ ...form, subtitle: e.target.value }))}
                placeholder="e.g. Up to 40% Off on Selected Styles"
                className="w-full px-4 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-ink/40"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">Ad Format</label>
              <select
                value={adForm.type}
                onChange={(e) => setAdForm((form) => ({ ...form, type: e.target.value }))}
                className="w-full px-4 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-ink/40"
              >
                <option value="slide">Homepage Slide</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">Placement Position</label>
              <select
                value={adForm.position}
                onChange={(e) => setAdForm((form) => ({ ...form, position: e.target.value }))}
                className="w-full px-4 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-ink/40"
              >
                <option value="homepage-top">Homepage Slider</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">Ad Image <span className="text-crimson">*</span></label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAdImage(e.target.files?.[0])}
                  className="w-full px-3 py-2 bg-background border border-border text-xs"
                />
              </div>
              <input
                type="text"
                value={adForm.image}
                onChange={(e) => setAdForm((form) => ({ ...form, image: e.target.value }))}
                placeholder="Or paste image URL (e.g. /assets/dress-hero.png)"
                className="w-full px-3 py-2 mt-2 bg-background border border-border text-xs focus:outline-none focus:border-ink/40"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">Button Call to Action</label>
              <input
                value={adForm.buttonText}
                onChange={(e) => setAdForm((form) => ({ ...form, buttonText: e.target.value }))}
                placeholder="e.g. Shop Now"
                className="w-full px-4 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-ink/40"
              />
              <div className="mt-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">Target Link</label>
                <input
                  value={adForm.link}
                  onChange={(e) => setAdForm((form) => ({ ...form, link: e.target.value }))}
                  placeholder="/collection"
                  className="w-full px-4 py-2 bg-background border border-border text-xs focus:outline-none focus:border-ink/40"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">Start Date (Optional)</label>
              <input
                type="date"
                value={adForm.startDate}
                onChange={(e) => setAdForm((form) => ({ ...form, startDate: e.target.value }))}
                className="w-full px-4 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-ink/40"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={adForm.endDate}
                onChange={(e) => setAdForm((form) => ({ ...form, endDate: e.target.value }))}
                className="w-full px-4 py-2.5 bg-background border border-border text-sm focus:outline-none focus:border-ink/40"
              />
            </div>
          </div>

          {adForm.image && (
            <div className="pt-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Image Preview</p>
              <img src={adForm.image} alt="Advertisement preview" className="h-32 w-56 object-cover border border-border rounded-sm shadow-sm" />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={submitAd}
              disabled={!adForm.title.trim() || !adForm.image}
              className="btn-ink px-6 py-2.5 text-xs uppercase tracking-widest disabled:opacity-40 transition-opacity"
            >
              {editingAdId ? "Save Changes" : "Create Ad"}
            </button>
            <button
              onClick={closeAdForm}
              className="px-6 py-2.5 border border-border text-xs uppercase tracking-widest hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {vendorAds.map((ad) => {
          const ownedByVendor = ad.vendorId === currentUser.id;
          return (
            <div key={ad.id} className="bg-cream border border-border p-5 flex flex-col sm:flex-row gap-5 sm:items-center">
              <div className="w-full sm:w-40 h-28 bg-secondary flex-shrink-0 border border-border/50 overflow-hidden rounded-sm">
                {ad.image ? (
                  <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full grid place-items-center text-muted-foreground">
                    <Image size={22} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-serif text-lg text-foreground font-medium">{ad.title}</h3>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${
                    ad.active ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"
                  }`}>
                    {ad.active ? "Active" : "Paused"}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-1">{ad.subtitle || "No subtitle"} · Homepage Slider</p>

                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
                  <span className="uppercase tracking-wider font-medium">
                    {ownedByVendor ? "Your campaign" : "Store-wide campaign"}
                  </span>
                  {ad.startDate && <span>• Runs from {ad.startDate} {ad.endDate ? `to ${ad.endDate}` : ""}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {ownedByVendor ? (
                  <>
                    <button
                      onClick={() => startEditAd(ad)}
                      className="px-3.5 py-2 border border-border text-xs uppercase inline-flex items-center gap-1.5 hover:bg-secondary transition-colors"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => updateVendorAd(ad)}
                      className="px-3.5 py-2 border border-border text-xs uppercase hover:bg-secondary transition-colors"
                    >
                      {ad.active ? "Pause" : "Activate"}
                    </button>
                    <button
                      onClick={() => removeVendorAd(ad.id)}
                      className="p-2 text-crimson hover:bg-crimson/10 rounded-sm transition-colors"
                      title="Delete ad"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-1.5 bg-secondary border border-border/60 rounded-sm">
                    Admin Managed
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {vendorAds.length === 0 && (
          <div className="border border-dashed border-border p-12 text-center text-muted-foreground space-y-2">
            <p className="font-serif text-base text-foreground">No advertisements yet</p>
            <p className="text-xs">Add a banner or homepage slide to promote your store and products to customers.</p>
          </div>
        )}
      </div>
    </div>
  );

  const tabContent = {
    overview: renderOverview,
    products: renderProducts,
    rentals: renderRentals,
    inventory: renderInventory,
    orders: renderOrders,
    rentalOrders: renderRentalOrders,
    earnings: renderEarnings,
    ads: renderAds,
    withdrawals: renderWithdrawals,
    profile: renderProfile,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden bg-secondary border-b border-border/60 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-serif text-xl text-foreground">{vendor.storeName}</h1>
            <p className="text-xs text-muted-foreground">Vendor Dashboard</p>
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to Store
          </Link>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs tracking-wider uppercase whitespace-nowrap rounded-sm transition-colors ${
                activeTab === key
                  ? "bg-ink text-cream"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-140px)] lg:min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-secondary border-r border-border/60 p-6 flex-shrink-0 sticky top-[76px] h-[calc(100vh-76px)] self-start overflow-y-auto">
          <div className="mb-8 shrink-0">
            <p className="eyebrow mb-2">Dashboard</p>
            <h1 className="font-serif text-xl text-foreground leading-tight">{vendor.storeName}</h1>
            <p className="text-xs text-muted-foreground mt-1">{vendor.description}</p>
          </div>
          <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wide transition-colors rounded-sm ${
                  activeTab === key
                    ? "bg-ink text-cream"
                    : "text-muted-foreground hover:text-foreground hover:bg-cream/50"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
          <div className="pt-6 mt-4 border-t border-border/60 shrink-0">
            <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Store
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {tabContent[activeTab]()}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Product Submission / Action Popup Modal */}
      <AnimatePresence>
        {productModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-background border border-border/80 p-8 shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setProductModal(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div
                className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center border ${
                  productModal.type === "error"
                    ? "bg-red-50 text-crimson border-red-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200/80"
                }`}
              >
                {productModal.type === "error" ? (
                  <AlertCircle className="w-7 h-7 stroke-[1.8]" />
                ) : (
                  <CheckCircle className="w-7 h-7 stroke-[1.8]" />
                )}
              </div>

              <p className="eyebrow text-crimson mb-1.5">— Verification Status</p>
              <h3 className="font-serif text-2xl text-foreground">
                {productModal.title}
              </h3>

              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {productModal.message}
              </p>

              {productModal.product && (
                <div className="mt-5 p-3.5 bg-secondary/60 border border-border/60 rounded-sm flex items-center gap-3 text-left">
                  {productModal.product.img && (
                    <img
                      src={productModal.product.img}
                      alt={productModal.product.name}
                      className="w-12 h-14 object-cover rounded-sm border border-border/50 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-serif font-medium text-foreground truncate">
                      {productModal.product.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      €{productModal.product.price} · {productModal.product.category}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                    Pending Review
                  </span>
                </div>
              )}

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setProductModal(null)}
                  className="btn-ink w-full justify-center py-3 text-xs tracking-widest uppercase"
                >
                  Got It, Thanks
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <DispatchModal
        order={dispatchModalOrder}
        onClose={() => setDispatchModalOrder(null)}
        onConfirm={async (data) => {
          await updateOrderStatusApi(dispatchModalOrder.id, data);
          setExpandedVendorOrder(null);
          setExpandedVendorRentalOrder(null);
        }}
      />
    </div>
  );
}
