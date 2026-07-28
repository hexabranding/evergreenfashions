import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { allProducts, parsePrice } from "@/data/products";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AddProductForm from "@/components/AddProductForm";
import { adsApi } from "@/api/ads";
import { productsApi } from "@/api/products";
import { authApi } from "@/api/auth";
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
  MessageSquare,
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
  Settings,
  Inbox,
  Mail,
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
} from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "products", label: "Products", icon: Package },
  { key: "rentals", label: "Rentals", icon: Repeat },
  { key: "inventory", label: "Inventory", icon: Tag },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "rentalOrders", label: "Rental Orders", icon: RefreshCw },
  { key: "messages", label: "Messages", icon: MessageSquare },
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

const ORDER_STATUS_FLOW = ["confirmed", "preparing", "shipped", "delivered"];
const RENTAL_STATUS_FLOW = ["pending", "approved", "shipped", "active", "returned"];
const STATUS_COLORS = {
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-amber-100 text-amber-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  returned: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  active: "bg-purple-100 text-purple-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-emerald-100 text-emerald-800",
  processing: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const MOCK_MESSAGES = [
  {
    id: "msg-1",
    customerName: "Isabelle Moreau",
    customerEmail: "isabelle@example.com",
    subject: "Size availability for Noir Blazer",
    message: "Hi, I wanted to check if the Noir Blazer will be available in size M soon? It seems to be out of stock.",
    date: "2026-07-24T10:30:00Z",
    read: false,
    replies: [],
    productId: "noir-blazer",
  },
  {
    id: "msg-2",
    customerName: "Luca Bianchi",
    customerEmail: "luca@example.com",
    subject: "Rental return question",
    message: "What's the process for returning the Silk Evening Gown? Do I need to dry clean it first?",
    date: "2026-07-23T14:15:00Z",
    read: true,
    replies: [
      {
        id: "reply-1",
        message: "Hi Luca, you can return the gown as-is. We handle professional cleaning. Just ensure it's in the garment bag provided.",
        date: "2026-07-23T15:00:00Z",
      },
    ],
    productId: "silk-evening-gown",
  },
  {
    id: "msg-3",
    customerName: "Amara Keita",
    customerEmail: "amara@example.com",
    subject: "Custom order inquiry",
    message: "Do you offer custom sizing for the Cashmere Wrap Coat? I need a size between S and M.",
    date: "2026-07-22T09:45:00Z",
    read: true,
    replies: [],
    productId: "cashmere-wrap-coat",
  },
];

const MOCK_RENTAL_ORDERS = [
  {
    id: "RNT-001",
    customerName: "Sophia Laurent",
    items: [{ name: "Silk Evening Gown", size: "M", rentalDays: 3 }],
    rentalStart: "2026-07-20",
    rentalEnd: "2026-07-23",
    total: 297,
    status: "active",
    deposit: 150,
    date: "2026-07-18T10:00:00Z",
  },
  {
    id: "RNT-002",
    customerName: "Marco Rossi",
    items: [{ name: "Velvet Dinner Jacket", size: "L", rentalDays: 2 }],
    rentalStart: "2026-07-25",
    rentalEnd: "2026-07-27",
    total: 180,
    status: "approved",
    deposit: 100,
    date: "2026-07-22T11:30:00Z",
  },
  {
    id: "RNT-003",
    customerName: "Ava Chen",
    items: [{ name: "Tulle Cocktail Dress", size: "S", rentalDays: 1 }],
    rentalStart: "2026-07-10",
    rentalEnd: "2026-07-11",
    total: 85,
    status: "returned",
    deposit: 75,
    date: "2026-07-08T09:00:00Z",
  },
];

const MOCK_WITHDRAWALS = [
  { id: "wd-1", date: "2026-07-20", amount: 3200, status: "completed", method: "Bank Transfer", account: "****4521" },
  { id: "wd-2", date: "2026-07-05", amount: 2800, status: "completed", method: "Bank Transfer", account: "****4521" },
  { id: "wd-3", date: "2026-06-20", amount: 4100, status: "completed", method: "PayPal", account: "vendor@atelier.com" },
  { id: "wd-4", date: "2026-07-25", amount: 1500, status: "processing", method: "Bank Transfer", account: "****4521" },
];

const MONTHLY_EARNINGS = [
  { month: "Jan", sales: 12400, rental: 2800, commission: 2280 },
  { month: "Feb", sales: 14200, rental: 3100, commission: 2595 },
  { month: "Mar", sales: 11800, rental: 2400, commission: 2130 },
  { month: "Apr", sales: 16500, rental: 4200, commission: 3105 },
  { month: "May", sales: 18900, rental: 5100, commission: 3600 },
  { month: "Jun", sales: 21200, rental: 6300, commission: 4125 },
  { month: "Jul", sales: 15800, rental: 4800, commission: 3090 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function deterministicProductStats(productId) {
  const h = simpleHash(productId);
  return {
    views: (h % 600) + 200,
    orders: (h % 35) + 5,
    revenueMultiplier: (h % 25) + 5,
    totalRentals: (h % 15) + 5,
    estMonthlyRentals: (h % 12) + 3,
  };
}

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
    reviews,
    getReviewsByProduct,
    replyToReview,
  } = useOrders();
  const navigate = useNavigate();

  const logoInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [orderFilter, setOrderFilter] = useState("all");
  const [rentalFilter, setRentalFilter] = useState("all");
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState("bank");
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawals, setWithdrawals] = useState(MOCK_WITHDRAWALS);
  const [rentalOrders, setRentalOrders] = useState(MOCK_RENTAL_ORDERS);
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
  const [earningsPeriod, setEarningsPeriod] = useState("7months");

  const [newProductForm, setNewProductForm] = useState(false);
  const [vendorProductsList, setVendorProductsList] = useState([]);
  const [vendorAds, setVendorAds] = useState([]);
  const [showAdForm, setShowAdForm] = useState(false);
  const [adForm, setAdForm] = useState({ title: "", subtitle: "", type: "slide", position: "homepage-top", image: "", link: "/collection", buttonText: "Shop Now", startDate: "", endDate: "" });
  const [editingProduct, setEditingProduct] = useState(null);

  const [localInventory, setLocalInventory] = useState({});

  useEffect(() => {
    if (!currentUser?.id) return;
    adsApi.getForVendor(currentUser.id).then((data) => setVendorAds(data.map((ad) => ({ ...ad, id: ad._id })))).catch(() => setVendorAds([]));
  }, [currentUser?.id]);
  useEffect(() => {
    if (!currentUser?.id) return;
    // Vendors use the same catalogue as the admin dashboard. Products created by an
    // admin are therefore visible immediately, even before a vendor is assigned.
    productsApi.getAll().then((data) => setVendorProductsList(data.map((product) => ({ ...product, id: product._id || product.id, stock: Object.fromEntries((product.inventory || []).map((item) => [item.size, item.stock])) })))).catch(() => setVendorProductsList(allProducts.map((product) => ({ ...product, stock: product.stock || {} }))));
  }, [currentUser?.id]);

  const handleAdImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please select an image file.");
    const reader = new FileReader();
    reader.onload = () => setAdForm((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };
  const submitAd = async () => {
    if (!adForm.title.trim() || !adForm.image) return;
    try {
      const saved = await adsApi.create(adForm);
      setVendorAds((prev) => [{ ...saved, id: saved._id }, ...prev]);
      setAdForm({ title: "", subtitle: "", type: "slide", position: "homepage-top", image: "", link: "/collection", buttonText: "Shop Now", startDate: "", endDate: "" });
      setShowAdForm(false);
    } catch (error) { alert(error.message || "Could not create advertisement."); }
  };
  const updateVendorAd = async (ad) => {
    try { const saved = await adsApi.update(ad.id, { active: !ad.active }); setVendorAds((prev) => prev.map((item) => item.id === ad.id ? { ...saved, id: saved._id } : item)); }
    catch { alert("Could not update this advertisement."); }
  };
  const removeVendorAd = async (id) => {
    if (!window.confirm("Delete this advertisement?")) return;
    try { await adsApi.remove(id); setVendorAds((prev) => prev.filter((ad) => ad.id !== id)); }
    catch { alert("Could not delete this advertisement."); }
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

  const vendorProducts = vendorProductsList;

  const vendorOrders = getOrdersByVendor(vendor.id);
  const recentOrders = [...vendorOrders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const filteredOrders = orderFilter === "all"
    ? vendorOrders
    : vendorOrders.filter((o) => o.status === orderFilter);
  const sortedFilteredOrders = [...filteredOrders].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredRentalOrders = rentalFilter === "all"
    ? rentalOrders
    : rentalOrders.filter((o) => o.status === rentalFilter);
  const sortedRentalOrders = [...filteredRentalOrders].sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalRevenue = vendor.totalEarnings;
  const pendingOrders = vendorOrders.filter((o) => o.status !== "delivered" && o.status !== "returned").length;
  const rentalProducts = vendorProducts.filter((p) => p.rentalAvailable);
  const unreadMessages = messages.filter((m) => !m.read).length;

  const totalSalesThisMonth = MONTHLY_EARNINGS[MONTHLY_EARNINGS.length - 1].sales;
  const totalRentalThisMonth = MONTHLY_EARNINGS[MONTHLY_EARNINGS.length - 1].rental;
  const totalCommissionThisMonth = MONTHLY_EARNINGS[MONTHLY_EARNINGS.length - 1].commission;

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
      updateOrderStatus(orderId, ORDER_STATUS_FLOW[idx + 1]);
    }
  };

  const handleNextRentalStatus = (orderId, currentStatus) => {
    const idx = RENTAL_STATUS_FLOW.indexOf(currentStatus);
    if (idx >= 0 && idx < RENTAL_STATUS_FLOW.length - 1) {
      setRentalOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: RENTAL_STATUS_FLOW[idx + 1] } : o
        )
      );
    }
  };

  const handleSendMessage = (msgId) => {
    if (!replyText.trim()) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              replies: [
                ...m.replies,
                {
                  id: `reply-${Date.now()}`,
                  message: replyText,
                  date: new Date().toISOString(),
                },
              ],
            }
          : m
      )
    );
    setReplyText("");
  };

  const handleMarkRead = (msgId) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, read: true } : m))
    );
  };

  const handleWithdrawalRequest = (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount <= 0) return;
    if (amount > vendor.pendingPayout) return;
    const newWithdrawal = {
      id: `wd-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      amount,
      status: "processing",
      method: withdrawalMethod === "bank" ? "Bank Transfer" : "PayPal",
      account: withdrawalMethod === "bank" ? "****4521" : "vendor@atelier.com",
    };
    setWithdrawals((prev) => [newWithdrawal, ...prev]);
    setWithdrawalAmount("");
    setShowWithdrawalForm(false);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setNewProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProductForm(true);
    setActiveTab("products");
    setExpandedProduct(null);
  };

  const handleSaveNewProduct = async (product) => {
    const inventory = Object.entries(product.stock || {}).map(([size, stock]) => ({ size, stock }));
    const payload = { ...product, inventory };
    try {
      const saved = editingProduct
        ? await productsApi.update(editingProduct.id, payload)
        : await productsApi.create(payload);
      const mapped = { ...saved, id: saved._id };
      setVendorProductsList((prev) => editingProduct ? prev.map((item) => item.id === mapped.id ? mapped : item) : [mapped, ...prev]);
      setNewProductForm(false);
      setEditingProduct(null);
    } catch (error) { alert(error.message || "Could not save product."); }
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
    const header = "Month,Product Sales,Rental Income,Commission,Net Earnings\n";
    const rows = MONTHLY_EARNINGS.map((m) =>
      `${m.month},${m.sales},${m.rental},${m.commission},${m.sales + m.rental - m.commission}`
    ).join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnings-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRentalEdit = (product) => {
    alert(`Edit rental for "${product.name}" — Rental price: €${product.rentalPricePerDay}/day. Use the Products tab to edit details.`);
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
        <StatCard icon={TrendingUp} label="Total Sales" value={vendor.totalSales.toLocaleString()} change={12} changeType="up" index={0} />
        <StatCard icon={DollarSign} label="Revenue" value={parsePrice(totalRevenue)} change={8} changeType="up" index={1} />
        <StatCard icon={Clock} label="Pending Orders" value={pendingOrders} index={2} />
        <StatCard icon={Package} label="Active Products" value={vendorProducts.length} index={3} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard icon={Repeat} label="Rental Items" value={rentalProducts.length} index={4} />
        <StatCard icon={MessageSquare} label="Unread Messages" value={unreadMessages} index={5} />
        <StatCard icon={Banknote} label="Pending Payout" value={parsePrice(vendor.pendingPayout)} index={6} />
        <StatCard icon={Star} label="Avg Rating" value="4.8" index={7} />
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
                      <span className="font-medium text-foreground text-sm">{order.id}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.items.map((i) => i.name).join(", ")} — {parsePrice(order.total)}
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
              <span className="text-xs text-emerald-600 mb-1">this month</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Product Sales</span>
                <span className="text-sm font-medium text-foreground">{parsePrice(totalSalesThisMonth)}</span>
              </div>
              <div className="w-full bg-cream h-2 rounded-full overflow-hidden">
                <div
                  className="bg-ink h-full rounded-full"
                  style={{ width: `${(totalSalesThisMonth / (totalSalesThisMonth + totalRentalThisMonth)) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rental Income</span>
                <span className="text-sm font-medium text-foreground">{parsePrice(totalRentalThisMonth)}</span>
              </div>
              <div className="w-full bg-cream h-2 rounded-full overflow-hidden">
                <div
                  className="bg-crimson h-full rounded-full"
                  style={{ width: `${(totalRentalThisMonth / (totalSalesThisMonth + totalRentalThisMonth)) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <span className="text-sm text-muted-foreground">Commission ({vendor.commission}%)</span>
                <span className="text-sm font-medium text-foreground">-{parsePrice(totalCommissionThisMonth)}</span>
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
        <button
          onClick={handleAddProduct}
          className="btn-ink px-5 py-2.5 text-xs tracking-widest uppercase flex items-center gap-2"
        >
          <Plus size={14} />
          Add Product
        </button>
      </div>

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

      {vendorProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Products Yet"
          description="Start adding your products to the marketplace."
          action="Add First Product"
          onAction={handleAddProduct}
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {vendorProducts.map((product) => {
            const productStock = getStockForProduct(product);
            const totalStock = Object.values(productStock).reduce((a, b) => a + b, 0);
            const isExpanded = expandedProduct === product.id;
            const stats = deterministicProductStats(product.id);
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
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs font-medium bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-full ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
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
                      <span className="font-medium text-foreground">{parsePrice(Math.floor(product.price * stats.revenueMultiplier / 10))}</span>
                      <p>Revenue</p>
                    </div>
                  </div>

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
                    >
                      <Trash2 size={12} />
                    </button>
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
        <h2 className="eyebrow">Rental Listings</h2>
        <button
          onClick={handleAddProduct}
          className="btn-ink px-5 py-2.5 text-xs tracking-widest uppercase flex items-center gap-2"
        >
          <Plus size={14} />
          Add Rental Item
        </button>
      </div>

      {rentalProducts.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No Rental Listings"
          description="Add rental availability to your products to start earning from rentals."
          action="Add Rental Item"
          onAction={handleAddProduct}
        />
      ) : (
        <div className="space-y-4">
          {rentalProducts.map((product) => {
            const productStock = getStockForProduct(product);
            const totalStock = Object.values(productStock).reduce((a, b) => a + b, 0);
            const rentalCount = MOCK_RENTAL_ORDERS.filter(
              (ro) => ro.items.some((i) => i.name === product.name) && ro.status === "active"
            ).length;
            const stats = deterministicProductStats(product.id);

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary border border-border/60 rounded-sm p-5"
              >
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="w-24 h-32 flex-shrink-0 overflow-hidden rounded-sm">
                    <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
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
                        <p className="text-sm font-medium text-foreground">{rentalCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Rentals</p>
                        <p className="text-sm font-medium text-foreground">{stats.totalRentals}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Est. Monthly</p>
                        <p className="text-sm font-medium text-foreground">{parsePrice(product.rentalPricePerDay * stats.estMonthlyRentals)}</p>
                      </div>
                    </div>
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

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="eyebrow mr-4">Order Management</h2>
        {["all", "confirmed", "preparing", "shipped", "delivered"].map((status) => (
          <button
            key={status}
            onClick={() => setOrderFilter(status)}
            className={`text-xs tracking-wider uppercase px-4 py-2 rounded-full border transition-colors ${
              orderFilter === status
                ? "bg-ink text-cream border-ink"
                : "bg-transparent text-muted-foreground border-border/60 hover:border-ink/30"
            }`}
          >
            {status}
            {status !== "all" && (
              <span className="ml-1.5 text-[10px]">
                ({vendorOrders.filter((o) => o.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-secondary border border-border/60 rounded-sm p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
          <p className="text-display text-xl">{vendorOrders.length}</p>
        </div>
        <div className="bg-secondary border border-border/60 rounded-sm p-4">
          <p className="text-xs text-muted-foreground mb-1">Pending</p>
          <p className="text-display text-xl text-amber-600">{vendorOrders.filter((o) => o.status === "confirmed" || o.status === "preparing").length}</p>
        </div>
        <div className="bg-secondary border border-border/60 rounded-sm p-4">
          <p className="text-xs text-muted-foreground mb-1">Shipped</p>
          <p className="text-display text-xl text-indigo-600">{vendorOrders.filter((o) => o.status === "shipped").length}</p>
        </div>
        <div className="bg-secondary border border-border/60 rounded-sm p-4">
          <p className="text-xs text-muted-foreground mb-1">Delivered</p>
          <p className="text-display text-xl text-emerald-600">{vendorOrders.filter((o) => o.status === "delivered").length}</p>
        </div>
      </div>

      {sortedFilteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Orders Found"
          description="No orders match the current filter."
        />
      ) : (
        <div className="space-y-3">
          {sortedFilteredOrders.map((order) => {
            const nextStatus =
              ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(order.status) + 1] || null;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary border border-border/60 rounded-sm p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-foreground text-sm">{order.id}</span>
                      <StatusBadge status={order.status} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {order.shipping && (
                      <p className="text-xs text-muted-foreground">
                        {order.shipping.firstName} {order.shipping.lastName}
                        {order.shipping.address ? `, ${order.shipping.address}` : ""}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-cream px-2.5 py-1 rounded-sm text-ink"
                        >
                          {item.name} × {item.qty}
                          {item.selectedSize ? ` (${item.selectedSize})` : ""}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 lg:flex-shrink-0">
                    <p className="text-display text-xl">{parsePrice(order.total)}</p>
                    {nextStatus && (
                      <button
                        onClick={() => handleNextStatus(order.id, order.status)}
                        className="btn-ink px-4 py-2 text-xs tracking-widest uppercase whitespace-nowrap"
                      >
                        Mark as {nextStatus}
                      </button>
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

  const renderRentalOrders = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="eyebrow mr-4">Rental Orders</h2>
        {["all", "pending", "approved", "active", "returned"].map((status) => (
          <button
            key={status}
            onClick={() => setRentalFilter(status)}
            className={`text-xs tracking-wider uppercase px-4 py-2 rounded-full border transition-colors ${
              rentalFilter === status
                ? "bg-ink text-cream border-ink"
                : "bg-transparent text-muted-foreground border-border/60 hover:border-ink/30"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-secondary border border-border/60 rounded-sm p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Rentals</p>
          <p className="text-display text-xl">{rentalOrders.length}</p>
        </div>
        <div className="bg-secondary border border-border/60 rounded-sm p-4">
          <p className="text-xs text-muted-foreground mb-1">Active</p>
          <p className="text-display text-xl text-purple-600">{rentalOrders.filter((o) => o.status === "active").length}</p>
        </div>
        <div className="bg-secondary border border-border/60 rounded-sm p-4">
          <p className="text-xs text-muted-foreground mb-1">Pending Approval</p>
          <p className="text-display text-xl text-yellow-600">{rentalOrders.filter((o) => o.status === "pending").length}</p>
        </div>
        <div className="bg-secondary border border-border/60 rounded-sm p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Deposits</p>
          <p className="text-display text-xl">{parsePrice(rentalOrders.reduce((sum, o) => sum + o.deposit, 0))}</p>
        </div>
      </div>

      {sortedRentalOrders.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No Rental Orders"
          description="No rental orders match the current filter."
        />
      ) : (
        <div className="space-y-3">
          {sortedRentalOrders.map((order) => {
            const nextStatus =
              RENTAL_STATUS_FLOW[RENTAL_STATUS_FLOW.indexOf(order.status) + 1] || null;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary border border-border/60 rounded-sm p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-foreground text-sm">{order.id}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-foreground">{order.customerName}</p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="text-xs bg-cream px-2.5 py-1 rounded-sm text-ink">
                          {item.name} ({item.size}) — {item.rentalDays} days
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(order.rentalStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        {" → "}
                        {new Date(order.rentalEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                      <span>Deposit: {parsePrice(order.deposit)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 lg:flex-shrink-0">
                    <p className="text-display text-xl">{parsePrice(order.total)}</p>
                    {nextStatus && (
                      <button
                        onClick={() => handleNextRentalStatus(order.id, order.status)}
                        className="btn-ink px-4 py-2 text-xs tracking-widest uppercase whitespace-nowrap"
                      >
                        {nextStatus === "approved" ? "Approve" : `Mark ${nextStatus}`}
                      </button>
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

  const renderMessages = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow">Customer Messages</h2>
        <span className="text-xs text-muted-foreground">{unreadMessages} unread</span>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6 min-h-[500px]">
        <div className="bg-secondary border border-border/60 rounded-sm overflow-hidden">
          <div className="p-4 border-b border-border/60">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full bg-cream border border-border/60 rounded-sm pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ink/30"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[440px]">
            {messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => {
                  setSelectedMessage(msg);
                  handleMarkRead(msg.id);
                }}
                className={`w-full text-left p-4 border-b border-border/30 transition-colors hover:bg-cream/50 ${
                  selectedMessage?.id === msg.id ? "bg-cream/70" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-ink text-cream flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {msg.customerName.split(" ").map((n) => n[0]).join("")}
                    </div>
                    {!msg.read && (
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-crimson rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-foreground truncate">{msg.customerName}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {new Date(msg.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-secondary border border-border/60 rounded-sm flex flex-col">
          {selectedMessage ? (
            <>
              <div className="p-5 border-b border-border/60">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-lg text-foreground">{selectedMessage.subject}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-muted-foreground">{selectedMessage.customerName}</span>
                      <span className="text-xs text-muted-foreground">{selectedMessage.customerEmail}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(selectedMessage.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="bg-cream/50 rounded-sm p-4">
                  <p className="text-sm text-foreground leading-relaxed">{selectedMessage.message}</p>
                </div>
                {selectedMessage.replies.map((reply) => (
                  <div key={reply.id} className="bg-ink/5 rounded-sm p-4 ml-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-foreground">You</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(reply.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{reply.message}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border/60">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage(selectedMessage.id)}
                    className="flex-1 bg-cream border border-border/60 rounded-sm px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ink/30"
                  />
                  <button
                    onClick={() => handleSendMessage(selectedMessage.id)}
                    disabled={!replyText.trim()}
                    className="btn-ink px-5 py-3 text-xs tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send size={14} />
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center mb-4">
                <Mail size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Select a message to read and reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderEarnings = () => {
    const maxEarning = Math.max(...MONTHLY_EARNINGS.map((m) => m.sales + m.rental));

    return (
      <div className="space-y-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-secondary border border-border/60 rounded-sm p-6">
            <p className="eyebrow mb-3">Total Earnings</p>
            <p className="text-display text-3xl">{parsePrice(vendor.totalEarnings)}</p>
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
              <ArrowUpRight size={12} /> +8% from last month
            </p>
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
            <p className="text-display text-3xl">
              {parsePrice(totalSalesThisMonth + totalRentalThisMonth - totalCommissionThisMonth)}
            </p>
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
              <ArrowUpRight size={12} /> +12% from last month
            </p>
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
              {MONTHLY_EARNINGS.map((month, i) => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full flex flex-col gap-0.5" style={{ height: `${((month.sales + month.rental) / maxEarning) * 100}%` }}>
                    <div
                      className="w-full bg-ink rounded-t-sm"
                      style={{ height: `${(month.sales / (month.sales + month.rental)) * 100}%` }}
                      title={`Sales: ${parsePrice(month.sales)}`}
                    />
                    <div
                      className="w-full bg-crimson rounded-b-sm"
                      style={{ height: `${(month.rental / (month.sales + month.rental)) * 100}%` }}
                      title={`Rentals: ${parsePrice(month.rental)}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              {MONTHLY_EARNINGS.map((m) => (
                <span key={m.month} className="flex-1 text-center">{m.month}</span>
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
                  {MONTHLY_EARNINGS.map((month) => (
                    <tr key={month.month} className="border-b border-border/30 hover:bg-cream/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{month.month} 2026</td>
                      <td className="py-3 px-4 text-right text-foreground">{parsePrice(month.sales)}</td>
                      <td className="py-3 px-4 text-right text-foreground">{parsePrice(month.rental)}</td>
                      <td className="py-3 px-4 text-right text-crimson">-{parsePrice(month.commission)}</td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">
                        {parsePrice(month.sales + month.rental - month.commission)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border/60 font-medium">
                    <td className="py-3 px-4 text-foreground">Total</td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {parsePrice(MONTHLY_EARNINGS.reduce((s, m) => s + m.sales, 0))}
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {parsePrice(MONTHLY_EARNINGS.reduce((s, m) => s + m.rental, 0))}
                    </td>
                    <td className="py-3 px-4 text-right text-crimson">
                      -{parsePrice(MONTHLY_EARNINGS.reduce((s, m) => s + m.commission, 0))}
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {parsePrice(
                        MONTHLY_EARNINGS.reduce((s, m) => s + m.sales + m.rental - m.commission, 0)
                      )}
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
          <p className="text-display text-3xl">{parsePrice(vendor.pendingPayout)}</p>
        </div>
        <div className="bg-secondary border border-border/60 rounded-sm p-6">
          <p className="eyebrow mb-3">Total Withdrawn</p>
          <p className="text-display text-3xl">
            {parsePrice(withdrawals.filter((w) => w.status === "completed").reduce((s, w) => s + w.amount, 0))}
          </p>
        </div>
        <div className="bg-secondary border border-border/60 rounded-sm p-6">
          <p className="eyebrow mb-3">Processing</p>
          <p className="text-display text-3xl">
            {parsePrice(withdrawals.filter((w) => w.status === "processing").reduce((s, w) => s + w.amount, 0))}
          </p>
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
                      max={vendor.pendingPayout}
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                      placeholder="0.00"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Max: {parsePrice(vendor.pendingPayout)}</p>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Method</label>
                    <select
                      value={withdrawalMethod}
                      onChange={(e) => setWithdrawalMethod(e.target.value)}
                      className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                    >
                      <option value="bank">Bank Transfer (****4521)</option>
                      <option value="paypal">PayPal (vendor@atelier.com)</option>
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
                {withdrawals.map((w) => (
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
                ))}
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
      <div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Promotion tools</p><h2 className="font-serif text-2xl text-foreground mt-1">Your advertisements</h2></div><button onClick={() => setShowAdForm((show) => !show)} className="btn-ink px-5 py-2.5 text-xs uppercase tracking-widest"><Plus size={14} /> New Ad</button></div>
      {showAdForm && <div className="bg-cream border border-border p-6 space-y-4"><div className="grid sm:grid-cols-2 gap-4">
        <input value={adForm.title} onChange={(e) => setAdForm((form) => ({ ...form, title: e.target.value }))} placeholder="Advertisement title (required)" className="px-4 py-3 bg-background border border-border text-sm" />
        <input value={adForm.subtitle} onChange={(e) => setAdForm((form) => ({ ...form, subtitle: e.target.value }))} placeholder="Offer subtitle (optional)" className="px-4 py-3 bg-background border border-border text-sm" />
        <select value={adForm.type} onChange={(e) => setAdForm((form) => ({ ...form, type: e.target.value }))} className="px-4 py-3 bg-background border border-border text-sm"><option value="slide">Homepage Slide</option><option value="banner">Banner</option><option value="sidebar">Sidebar</option></select>
        <input type="file" accept="image/*" onChange={(e) => handleAdImage(e.target.files?.[0])} className="px-3 py-2 bg-background border border-border text-sm" required />
        <input value={adForm.buttonText} onChange={(e) => setAdForm((form) => ({ ...form, buttonText: e.target.value }))} placeholder="Button text" className="px-4 py-3 bg-background border border-border text-sm" />
        <input value={adForm.link} onChange={(e) => setAdForm((form) => ({ ...form, link: e.target.value }))} placeholder="/collection" className="px-4 py-3 bg-background border border-border text-sm" />
      </div>{adForm.image && <img src={adForm.image} alt="Advertisement preview" className="h-36 w-56 object-cover border border-border" />}<div className="flex gap-3"><button onClick={submitAd} disabled={!adForm.title.trim() || !adForm.image} className="btn-ink px-5 py-2.5 text-xs uppercase tracking-widest disabled:opacity-40">Create Ad</button><button onClick={() => setShowAdForm(false)} className="px-5 py-2.5 border border-border text-xs uppercase tracking-widest">Cancel</button></div></div>}
      <div className="grid gap-4">{vendorAds.map((ad) => <div key={ad.id} className="bg-cream border border-border p-4 flex flex-col sm:flex-row gap-4 sm:items-center"><div className="w-full sm:w-36 h-24 bg-secondary flex-shrink-0">{ad.image ? <img src={ad.image} alt="" className="w-full h-full object-cover" /> : <div className="h-full grid place-items-center text-muted-foreground"><Image size={20} /></div>}</div><div className="flex-1"><h3 className="font-serif text-lg">{ad.title}</h3><p className="text-sm text-muted-foreground">{ad.subtitle || "No subtitle"} · {ad.type}</p></div><div className="flex gap-2"><button onClick={() => updateVendorAd(ad)} className="px-3 py-2 border border-border text-xs uppercase">{ad.active ? "Pause" : "Activate"}</button><button onClick={() => removeVendorAd(ad.id)} className="p-2 text-crimson hover:bg-crimson/10"><Trash2 size={16} /></button></div></div>)}{vendorAds.length === 0 && <div className="border border-dashed border-border p-10 text-center text-muted-foreground">No advertisements yet. Add a slide to feature your store on the homepage.</div>}</div>
    </div>
  );

  const tabContent = {
    overview: renderOverview,
    products: renderProducts,
    rentals: renderRentals,
    inventory: renderInventory,
    orders: renderOrders,
    rentalOrders: renderRentalOrders,
    messages: renderMessages,
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
              {key === "messages" && unreadMessages > 0 && (
                <span className="w-4 h-4 rounded-full bg-crimson text-cream text-[9px] flex items-center justify-center font-medium">
                  {unreadMessages}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-140px)] lg:min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-secondary border-r border-border/60 p-6 flex-shrink-0">
          <div className="mb-10">
            <p className="eyebrow mb-2">Dashboard</p>
            <h1 className="font-serif text-xl text-foreground leading-tight">{vendor.storeName}</h1>
            <p className="text-xs text-muted-foreground mt-1">{vendor.description}</p>
          </div>
          <nav className="space-y-1 flex-1">
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
                {key === "messages" && unreadMessages > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-crimson text-cream text-[10px] flex items-center justify-center font-medium">
                    {unreadMessages}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="pt-6 border-t border-border/60">
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
    </div>
  );
}
