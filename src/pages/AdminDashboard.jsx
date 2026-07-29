import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { allProducts, parsePrice } from "@/data/products";
import { motion, AnimatePresence } from "framer-motion";
import AddProductForm from "@/components/AddProductForm";
import OrderDetailPanel from "@/components/OrderDetailPanel";
import { adsApi } from "@/api/ads";
import { productsApi } from "@/api/products";
import { authApi } from "@/api/auth";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Edit2,
  Check,
  X,
  Search,
  Star,
  BarChart3,
  Repeat,
  Tag,
  Megaphone,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Plus,
  Download,
  Filter,
  Ban,
  ChevronDown,
  ChevronUp,
  Image,
  Send,
  GripVertical,
  PieChart,
  RefreshCw,
  Globe,
  Sparkles,
  Shield,
  Store,
  Banknote,
  TrendingDown,
  Settings,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Layers,
  MousePointerClick,
  User,
  Lock,
} from "lucide-react";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "rentalOrders", label: "Rental Orders", icon: Repeat },
  { id: "users", label: "Users", icon: Users },
  { id: "vendors", label: "Vendors", icon: Store },
  { id: "products", label: "All Products", icon: Package },
  { id: "rentals", label: "Rentals", icon: Repeat },
  { id: "categories", label: "Categories", icon: Layers },
  { id: "featured", label: "Featured", icon: Star },
  { id: "ads", label: "Advertisements", icon: Megaphone },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

const MOCK_CATEGORIES = [
  { id: "cat-1", name: "Dresses", icon: "👗", productCount: 24, active: true },
  { id: "cat-2", name: "Outerwear", icon: "🧥", productCount: 18, active: true },
  { id: "cat-3", name: "Knitwear", icon: "🧶", productCount: 12, active: true },
  { id: "cat-4", name: "Accessories", icon: "👜", productCount: 31, active: true },
  { id: "cat-5", name: "Footwear", icon: "👠", productCount: 15, active: true },
  { id: "cat-6", name: "Evening Wear", icon: "✨", productCount: 9, active: true },
  { id: "cat-7", name: "Bridal", icon: "👰", productCount: 6, active: false },
  { id: "cat-8", name: "Menswear", icon: "👔", productCount: 14, active: true },
];

const MOCK_ADS = [
  {
    id: "ad-1",
    title: "Summer Collection Banner",
    type: "banner",
    position: "homepage-top",
    active: true,
    impressions: 12480,
    clicks: 892,
    startDate: "2026-06-01",
    endDate: "2026-08-31",
  },
  {
    id: "ad-2",
    title: "Rental Launch Sidebar",
    type: "sidebar",
    position: "category-page",
    active: true,
    impressions: 8920,
    clicks: 445,
    startDate: "2026-07-01",
    endDate: "2026-09-30",
  },
  {
    id: "ad-3",
    title: "Atelier Paris Popup",
    type: "popup",
    position: "product-page",
    active: false,
    impressions: 5230,
    clicks: 187,
    startDate: "2026-05-15",
    endDate: "2026-06-30",
  },
];

const MOCK_RENTAL_PRODUCTS = [
  {
    id: "rent-1",
    name: "Silk Evening Gown",
    vendor: "Atelier Paris",
    pricePerDay: 95,
    totalRentals: 18,
    activeRentals: 3,
    revenue: 3420,
    status: "active",
  },
  {
    id: "rent-2",
    name: "Velvet Dinner Jacket",
    vendor: "Atelier Paris",
    pricePerDay: 75,
    totalRentals: 12,
    activeRentals: 1,
    revenue: 2100,
    status: "active",
  },
  {
    id: "rent-3",
    name: "Tulle Cocktail Dress",
    vendor: "Atelier Paris",
    pricePerDay: 60,
    totalRentals: 8,
    activeRentals: 0,
    revenue: 960,
    status: "paused",
  },
];

const MONTHLY_DATA = [
  { month: "Jan", revenue: 12400, orders: 48, users: 12, vendors: 1 },
  { month: "Feb", revenue: 14200, orders: 56, users: 18, vendors: 1 },
  { month: "Mar", revenue: 11800, orders: 42, users: 14, vendors: 2 },
  { month: "Apr", revenue: 16500, orders: 64, users: 22, vendors: 2 },
  { month: "May", revenue: 18900, orders: 71, users: 28, vendors: 3 },
  { month: "Jun", revenue: 21200, orders: 82, users: 35, vendors: 3 },
  { month: "Jul", revenue: 15800, orders: 58, users: 20, vendors: 2 },
];

const statusColors = {
  Confirmed: "bg-blue-100 text-blue-800",
  Preparing: "bg-amber-100 text-amber-800",
  Shipped: "bg-indigo-100 text-indigo-800",
  Delivered: "bg-emerald-100 text-emerald-800",
  Returned: "bg-gray-100 text-gray-800",
  active: "bg-emerald-100 text-emerald-800",
  paused: "bg-gray-100 text-gray-800",
  pending: "bg-amber-100 text-amber-800",
  suspended: "bg-red-100 text-red-800",
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

function StatCard({ icon: Icon, label, value, change, changeType, index }) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="bg-cream border border-border p-6 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center">
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
      <p className="font-serif text-display text-3xl text-foreground">{value}</p>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[status] || "bg-gray-100 text-gray-800"}`}>
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

function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = "Confirm" }) {
  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-background border border-border w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <h3 className="font-serif text-lg text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex border-t border-border">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 text-xs uppercase tracking-widest text-crimson hover:bg-crimson/5 transition-colors border-l border-border"
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser: user, users: authUsers, isAuthenticated } = useAuth();
  const { orders: contextOrders, vendors: authVendors, updateOrderStatus, adminApiOrders, adminOrdersLoading, fetchAdminOrders, updateOrderStatusApi, inspectOrder } = useOrders();

  const [users, setUsers] = useState(authUsers || []);
  const [vendors, setVendors] = useState(authVendors || []);
  const [products, setProducts] = useState([]);

  const orders = useMemo(() => {
    const merged = [...contextOrders];
    const seen = new Set(contextOrders.map((o) => o.id));
    for (const o of adminApiOrders) {
      if (!seen.has(o.id)) {
        merged.push(o);
        seen.add(o.id);
      }
    }
    return merged;
  }, [contextOrders, adminApiOrders]);

  const normalOrders = useMemo(() => orders.filter((o) => !o.rentalDetails), [orders]);
  const rentalOrders = useMemo(() => orders.filter((o) => o.rentalDetails), [orders]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [accessDenied, setAccessDenied] = useState(false);

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ firstName: "", lastName: "", email: "", role: "" });
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    firstName: "", lastName: "", email: "", password: "", role: "vendor",
  });
  const [vendorSearch, setVendorSearch] = useState("");
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendorForm, setNewVendorForm] = useState({
    firstName: "", lastName: "", email: "", password: "",
  });
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);
  const [editVendorForm, setEditVendorForm] = useState({ storeName: "", description: "", commission: 15 });
  const [resetPasswordVendor, setResetPasswordVendor] = useState(null);
  const [vendorNewPassword, setVendorNewPassword] = useState("");
  const [vendorDetailTab, setVendorDetailTab] = useState("info");
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [rentalProducts, setRentalProducts] = useState(MOCK_RENTAL_PRODUCTS);
  const [rentalFilter, setRentalFilter] = useState("All");
  const [rentalSearch, setRentalSearch] = useState("");
  const [selectedRental, setSelectedRental] = useState(null);
  const [editingRental, setEditingRental] = useState(null);
  const [editRentalForm, setEditRentalForm] = useState({ name: "", pricePerDay: 0, status: "active" });
  const [ads, setAds] = useState([]);
  const [productCommission, setProductCommission] = useState(15);
  const [rentalCommission, setRentalCommission] = useState(20);
  const [featuredProducts, setFeaturedProducts] = useState(allProducts.slice(0, 4));
  const [availableProducts, setAvailableProducts] = useState(allProducts.slice(4, 12));
  const [reportPeriod, setReportPeriod] = useState("Jul 2026");
  const [previewAd, setPreviewAd] = useState(null);
  const [newAdForm, setNewAdForm] = useState({ title: "", subtitle: "", type: "slide", position: "homepage-top", image: "", link: "/collection", buttonText: "Shop Now", startDate: "", endDate: "" });
  const [showNewAdForm, setShowNewAdForm] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("All");
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductForm, setEditProductForm] = useState({ name: "", category: "", price: 0, vendor: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", onConfirm: null, confirmLabel: "Confirm" });
  const [expandedAdminOrder, setExpandedAdminOrder] = useState(null);
  const [adminOrderStatusFilter, setAdminOrderStatusFilter] = useState("All");
  const [expandedAdminRentalOrder, setExpandedAdminRentalOrder] = useState(null);
  const [adminRentalOrderStatusFilter, setAdminRentalOrderStatusFilter] = useState("All");

  useEffect(() => {
    setUsers(authUsers || []);
  }, [authUsers]);

  useEffect(() => {
    setVendors(authVendors || []);
  }, [authVendors]);

  useEffect(() => {
    adsApi.getAll().then((data) => setAds(data.map((ad) => ({ ...ad, id: ad._id })))).catch(() => setAds([]));
  }, []);

  useEffect(() => {
    productsApi.getAll().then((data) => setProducts(data.map((product) => ({ ...product, id: product._id })))).catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    fetchAdminOrders();
  }, []);

  useEffect(() => {
    authApi.admin.getUsers().then((data) => {
      const mappedUsers = data.map((u) => ({
        id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        phone: u.phone || "",
        createdAt: u.createdAt,
        addresses: u.addresses || [],
        vendorStore: u.vendorStore,
      }));
      setUsers(mappedUsers);
      const vendorUsers = mappedUsers.filter((u) => u.role === "vendor");
      setVendors(vendorUsers.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        storeName: u.vendorStore?.name || `${u.firstName} ${u.lastName}`,
        description: u.vendorStore?.description || "",
        commission: u.vendorStore?.commission || 15,
        suspended: false,
        totalProducts: 0,
        totalSales: 0,
        totalEarnings: 0,
        pendingPayout: 0,
        joinedAt: u.createdAt?.slice(0, 10) || "N/A",
      })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      setAccessDenied(true);
      const timer = setTimeout(() => navigate("/login"), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, navigate]);

  if (accessDenied || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-crimson/10 flex items-center justify-center">
            <X className="w-10 h-10 text-crimson" />
          </div>
          <h1 className="font-serif text-display text-foreground text-3xl">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You do not have permission to view this page. Redirecting...
          </p>
          <Link
            to="/login"
            className="inline-block btn-ink px-8 py-3 text-sm uppercase tracking-widest"
          >
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  const totalRevenue = orders.reduce(
    (sum, o) => sum + (o.total || o.totalAmount || 0),
    0
  );

  const totalRentalRevenue = rentalProducts.reduce((sum, r) => sum + r.revenue, 0);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.shippingAddress?.name?.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === "All" || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = (users || []).filter((u) => {
    const matchesSearch =
      `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === "All" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredVendors = (vendors || []).filter((v) => {
    return (v.storeName || v.name || "").toLowerCase().includes(vendorSearch.toLowerCase());
  });

  const filteredRentals = rentalProducts.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(rentalSearch.toLowerCase());
    const matchesFilter = rentalFilter === "All" || r.status === rentalFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredAllProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.vendor?.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilter === "All" || p.category === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  const userCounts = {
    total: (users || []).length,
    admins: (users || []).filter((u) => u.role === "admin").length,
    vendors: (users || []).filter((u) => u.role === "vendor").length,
    customers: (users || []).filter((u) => u.role === "customer").length,
  };

  const vendorStats = {
    total: (vendors || []).length,
    activeSellers: (vendors || []).filter((v) => v.totalSales > 0).length,
    totalEarnings: (vendors || []).reduce((sum, v) => sum + (v.totalEarnings || 0), 0),
    pendingPayouts: (vendors || []).reduce((sum, v) => sum + (v.pendingPayout || 0), 0),
  };

  const maxRevenue = Math.max(...MONTHLY_DATA.map((d) => d.revenue));

  const adStats = {
    active: ads.filter((a) => a.active).length,
    totalImpressions: ads.reduce((sum, a) => sum + a.impressions, 0),
    totalClicks: ads.reduce((sum, a) => sum + a.clicks, 0),
    avgCTR: ads.length > 0 ? ((ads.reduce((sum, a) => sum + (a.clicks / a.impressions) * 100, 0)) / ads.length).toFixed(1) : "0",
  };

  const getInitials = (u) => {
    const first = (u.firstName || "").charAt(0).toUpperCase();
    const last = (u.lastName || "").charAt(0).toUpperCase();
    return first + last || u.email?.charAt(0).toUpperCase() || "?";
  };

  const openConfirm = (title, message, onConfirm, confirmLabel = "Confirm") => {
    setConfirmModal({ open: true, title, message, onConfirm, confirmLabel });
  };

  const closeConfirm = () => {
    setConfirmModal({ open: false, title: "", message: "", onConfirm: null, confirmLabel: "Confirm" });
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    setCategories((prev) => [
      ...prev,
      {
        id: `cat-${Date.now()}`,
        name: newCategoryName.trim(),
        icon: "📦",
        productCount: 0,
        active: true,
      },
    ]);
    setNewCategoryName("");
  };

  const toggleCategory = (id) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  const deleteCategory = (id) => {
    openConfirm("Delete Category", "Are you sure you want to delete this category? This cannot be undone.", () => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      closeConfirm();
    }, "Delete");
  };

  const startEditCategory = (cat) => {
    setEditingCategory(cat.id);
    setEditCategoryName(cat.name);
  };

  const saveEditCategory = (id) => {
    if (!editCategoryName.trim()) return;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: editCategoryName.trim() } : c)));
    setEditingCategory(null);
    setEditCategoryName("");
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryName("");
  };

  const banUser = (userId) => {
    openConfirm("Ban User", "Are you sure you want to ban this user? They will be removed from the user list.", async () => {
      try { await authApi.admin.deleteUser(userId); } catch {}
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSelectedUser(null);
      closeConfirm();
    }, "Ban User");
  };

  const startEditUser = (u) => {
    setEditingUser(u.id);
    setEditUserForm({ firstName: u.firstName || "", lastName: u.lastName || "", email: u.email || "", role: u.role || "customer" });
  };

  const saveEditUser = async () => {
    try {
      await authApi.admin.updateUser(editingUser, editUserForm);
    } catch {}
    setUsers((prev) => prev.map((u) =>
      u.id === editingUser ? { ...u, ...editUserForm } : u
    ));
    setSelectedUser((prev) => (prev && prev.id === editingUser ? { ...prev, ...editUserForm } : prev));
    setEditingUser(null);
  };

  const cancelEditUser = () => {
    setEditingUser(null);
  };

  const banVendor = (vendorId) => {
    openConfirm("Ban Vendor", "Are you sure you want to ban this vendor? Their store will be suspended.", () => {
      setVendors((prev) => prev.map((v) =>
        v.id === vendorId ? { ...v, suspended: true } : v
      ));
      setSelectedVendor((prev) => (prev && prev.id === vendorId ? { ...prev, suspended: true } : prev));
      closeConfirm();
    }, "Ban Vendor");
  };

  const startEditVendor = (v) => {
    setEditingVendor(v.id);
    setEditVendorForm({ storeName: v.storeName || v.name || "", description: v.description || "", commission: v.commission || 15 });
  };

  const saveEditVendor = async () => {
    try {
      await authApi.admin.updateUser(editingVendor, {
        firstName: selectedVendor.firstName,
        lastName: selectedVendor.lastName,
        email: selectedVendor.email,
        vendorStore: {
          name: editVendorForm.storeName,
          description: editVendorForm.description,
          commission: editVendorForm.commission,
        },
      });
    } catch {}
    setVendors((prev) => prev.map((v) =>
      v.id === editingVendor ? { ...v, ...editVendorForm } : v
    ));
    setSelectedVendor((prev) => (prev && prev.id === editingVendor ? { ...prev, ...editVendorForm } : prev));
    setEditingVendor(null);
  };

  const cancelEditVendor = () => {
    setEditingVendor(null);
  };

  const handleResetPassword = async (userId) => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    try {
      await authApi.admin.resetPassword(userId, newPassword);
      alert("Password reset successfully");
      setResetPasswordUser(null);
      setNewPassword("");
    } catch (err) {
      alert(err.message || "Failed to reset password");
    }
  };

  const handleResetVendorPassword = async (vendorId) => {
    if (!vendorNewPassword || vendorNewPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    try {
      await authApi.admin.resetPassword(vendorId, vendorNewPassword);
      alert("Password reset successfully");
      setResetPasswordVendor(null);
      setVendorNewPassword("");
    } catch (err) {
      alert(err.message || "Failed to reset password");
    }
  };

  const handleAddVendor = async () => {
    const { firstName, lastName, email, password } = newVendorForm;
    if (!firstName || !lastName || !email || !password) return;

    try {
      const data = await authApi.admin.createUser({ firstName, lastName, email, password, role: "vendor" });

      setVendors((prev) => [...prev, {
        id: data._id, firstName: data.firstName, lastName: data.lastName, email: data.email,
        storeName: data.vendorStore?.name || `${firstName} ${lastName}`,
        description: data.vendorStore?.description || "",
        commission: data.vendorStore?.commission || 15,
        suspended: false, totalProducts: 0, totalSales: 0, totalEarnings: 0, pendingPayout: 0,
        joinedAt: data.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      }]);
      setNewVendorForm({ firstName: "", lastName: "", email: "", password: "" });
      setShowAddVendor(false);
    } catch {
      alert("Failed to connect to server");
    }
  };

  const handleAddUser = async () => {
    const { firstName, lastName, email, password, role } = newUserForm;
    if (!firstName || !lastName || !email || !password) return;

    try {
      if (role === "vendor") {
        const data = await authApi.admin.createUser({ firstName, lastName, email, password, role: "vendor" });

        const newUser = {
          id: data._id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: "vendor",
          phone: null,
          createdAt: data.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          addresses: [],
        };

        setVendors((prev) => [...prev, {
          ...newUser,
          storeName: data.vendorStore?.name || `${firstName} ${lastName}`,
          description: data.vendorStore?.description || "",
          commission: data.vendorStore?.commission || 15,
          suspended: false,
          totalProducts: 0,
          totalSales: 0,
          totalEarnings: 0,
          pendingPayout: 0,
          joinedAt: newUser.createdAt,
        }]);

        setUsers((prev) => [...prev, newUser]);
      } else {
        const data = await authApi.admin.createUser({ firstName, lastName, email, password, role: "customer" });
        const newUser = {
          id: data._id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
          phone: data.phone || null,
          createdAt: data.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          addresses: data.addresses || [],
        };
        setUsers((prev) => [...prev, newUser]);
      }

      setNewUserForm({ firstName: "", lastName: "", email: "", password: "", role: "vendor" });
      setShowAddUser(false);
    } catch {
      alert("Failed to connect to server");
    }
  };

  const addFeatured = (product) => {
    if (featuredProducts.find((p) => p.id === product.id)) return;
    setFeaturedProducts((prev) => [...prev, product]);
    setAvailableProducts((prev) => prev.filter((p) => p.id !== product.id));
  };

  const removeFeatured = (product) => {
    setFeaturedProducts((prev) => prev.filter((p) => p.id !== product.id));
    setAvailableProducts((prev) => [product, ...prev]);
  };

  const toggleAd = async (id) => {
    const ad = ads.find((item) => item.id === id);
    if (!ad) return;
    try {
      const saved = await adsApi.update(id, { active: !ad.active });
      setAds((prev) => prev.map((item) => (item.id === id ? { ...saved, id: saved._id } : item)));
    } catch { alert("Could not update this advertisement."); }
  };

  const addNewAd = async () => {
    if (!newAdForm.title.trim() || !newAdForm.image) return;
    try {
      const saved = await adsApi.create(newAdForm);
      setAds((prev) => [{ ...saved, id: saved._id }, ...prev]);
      setNewAdForm({ title: "", subtitle: "", type: "slide", position: "homepage-top", image: "", link: "/collection", buttonText: "Shop Now", startDate: "", endDate: "" });
      setShowNewAdForm(false);
    } catch (error) { alert(error.message || "Could not create advertisement."); }
  };

  const handleAdImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please select an image file.");
    const reader = new FileReader();
    reader.onload = () => setNewAdForm((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const deleteAd = (id) => {
    openConfirm("Delete Ad", "Are you sure you want to delete this advertisement?", () => {
      adsApi.remove(id).then(() => { setAds((prev) => prev.filter((a) => a.id !== id)); closeConfirm(); }).catch(() => alert("Could not delete this advertisement."));
    }, "Delete");
  };

  const deleteProduct = (id) => {
    openConfirm("Delete Product", "Are you sure you want to delete this product?", () => {
      productsApi.delete(id).then(() => { setProducts((prev) => prev.filter((p) => p.id !== id)); closeConfirm(); }).catch((error) => alert(error.message || "Could not delete product."));
    }, "Delete");
  };

  const startEditProduct = (p) => {
    setEditingProduct(p);
    setShowAddForm(true);
  };

  const startEditRental = (r) => {
    setEditingRental(r.id);
    setEditRentalForm({ name: r.name || "", pricePerDay: r.pricePerDay || 0, status: r.status || "active" });
  };

  const saveEditRental = () => {
    setRentalProducts((prev) => prev.map((r) =>
      r.id === editingRental ? { ...r, ...editRentalForm } : r
    ));
    setEditingRental(null);
  };

  const cancelEditRental = () => {
    setEditingRental(null);
  };

  const handleSaveProduct = async (payload) => {
    try {
      const inventory = Object.entries(payload.stock || {}).map(([size, stock]) => ({ size, stock }));
      const dataToSave = { ...payload, inventory };
      
      let saved;
      if (editingProduct) {
        saved = await productsApi.update(editingProduct.id, dataToSave);
        setProducts((prev) => prev.map((product) => product.id === editingProduct.id ? { ...saved, id: saved._id || saved.id } : product));
      } else {
        saved = await productsApi.create(dataToSave);
        setProducts((prev) => [{ ...saved, id: saved._id || saved.id }, ...prev]);
      }
      setShowAddForm(false);
      setEditingProduct(null);
    } catch (error) { alert(error.message || "Could not save product."); }
  };

  const handleExport = () => {
    setExporting(true);
    const header = "Month,Revenue,Orders,Users,Vendors\n";
    const rows = MONTHLY_DATA.map((d) => `${d.month} 2026,${d.revenue},${d.orders},${d.users},${d.vendors}`).join("\n");
    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "evergreen-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 1000);
  };

  const renderDashboard = () => {
    const recentOrders = [...normalOrders].reverse().slice(0, 8);
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Revenue" value={`$${(totalRevenue + totalRentalRevenue).toLocaleString()}`} change={12} changeType="up" index={0} />
          <StatCard icon={ShoppingCart} label="Orders" value={normalOrders.length} change={normalOrders.length - 8 > 0 ? 8 : 0} changeType="up" index={1} />
          <StatCard icon={Repeat} label="Rental Orders" value={rentalOrders.length} change={15} changeType="up" index={2} />
          <StatCard icon={Store} label="Vendors" value={(vendors || []).length} index={3} />
          <StatCard icon={Users} label="Users" value={(users || []).length} change={15} changeType="up" index={4} />
          <StatCard icon={Package} label="Products" value={products.length} index={5} />
          <StatCard icon={Repeat} label="Active Rentals" value={rentalProducts.filter((r) => r.activeRentals > 0).length} index={6} />
          <StatCard icon={Megaphone} label="Active Ads" value={adStats.active} index={7} />
        </div>

        <div className="bg-cream border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="eyebrow">Revenue Overview</p>
              <h3 className="font-serif text-display text-xl text-foreground mt-1">Monthly Revenue</h3>
            </div>
            <span className="text-sm text-muted-foreground">Jan - Jul 2026</span>
          </div>
          <div className="flex items-end gap-3 h-48">
            {MONTHLY_DATA.map((d, i) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">${(d.revenue / 1000).toFixed(1)}k</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: "easeOut" }}
                  className="w-full bg-ink/80 hover:bg-crimson transition-colors cursor-pointer min-h-[4px]"
                  title={`$${d.revenue.toLocaleString()}`}
                />
                <span className="text-xs text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="font-serif text-display text-xl text-foreground mb-4">Recent Orders</h2>
            <div className="bg-cream border border-border divide-y divide-border">
              <AnimatePresence>
                {recentOrders.map((order, i) => (
                  <motion.div
                    key={order.id}
                    variants={fadeUp}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center justify-between px-6 py-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-muted-foreground font-mono">{order.id?.slice(-8)}</span>
                      <span className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString()}</span>
                      <span className="text-sm text-foreground">{order.items?.length || 0} items</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-serif text-foreground">${(order.total || order.totalAmount || 0).toLocaleString()}</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {recentOrders.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">No orders yet</div>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-serif text-display text-xl text-foreground mb-4">Quick Actions</h2>
            <div className="bg-cream border border-border divide-y divide-border">
              <button onClick={() => setActiveTab("vendors")} className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-secondary/50 transition-colors">
                <Store size={18} className="text-ink" />
                <div>
                  <p className="text-sm text-foreground font-serif">Manage Vendors</p>
                  <p className="text-xs text-muted-foreground">{vendorStats.pendingPayouts > 0 ? `$${vendorStats.pendingPayouts.toLocaleString()} pending payouts` : "No pending payouts"}</p>
                </div>
              </button>
              <button onClick={() => setActiveTab("featured")} className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-secondary/50 transition-colors">
                <Star size={18} className="text-ink" />
                <div>
                  <p className="text-sm text-foreground font-serif">Featured Listings</p>
                  <p className="text-xs text-muted-foreground">{featuredProducts.length} products featured</p>
                </div>
              </button>
              <button onClick={() => setActiveTab("ads")} className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-secondary/50 transition-colors">
                <Megaphone size={18} className="text-ink" />
                <div>
                  <p className="text-sm text-foreground font-serif">Manage Advertisements</p>
                  <p className="text-xs text-muted-foreground">{adStats.active} active campaigns</p>
                </div>
              </button>
              <button onClick={() => setActiveTab("reports")} className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-secondary/50 transition-colors">
                <BarChart3 size={18} className="text-ink" />
                <div>
                  <p className="text-sm text-foreground font-serif">View Reports</p>
                  <p className="text-xs text-muted-foreground">Analytics and insights</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={userCounts.total} index={0} />
        <StatCard icon={Shield} label="Admins" value={userCounts.admins} index={1} />
        <StatCard icon={Store} label="Vendors" value={userCounts.vendors} index={2} />
        <StatCard icon={User} label="Customers" value={userCounts.customers} index={3} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors"
          />
        </div>
        <select
          value={userRoleFilter}
          onChange={(e) => setUserRoleFilter(e.target.value)}
          className="px-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors appearance-none cursor-pointer"
        >
          {["All", "admin", "vendor", "customer"].map((r) => (
            <option key={r} value={r}>{r === "All" ? "All Roles" : r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        <button
          onClick={() => setShowAddUser(!showAddUser)}
          className="btn-ink px-5 py-3 text-xs tracking-widest uppercase flex items-center gap-2"
        >
          <Plus size={14} />
          {showAddUser ? "Close" : "Add User"}
        </button>
      </div>

      <AnimatePresence>
        {showAddUser && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-cream border border-border overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <p className="eyebrow">Add New User</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-1.5">Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm((p) => ({ ...p, role: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 appearance-none cursor-pointer"
                  >
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-1.5">First Name</label>
                  <input type="text" value={newUserForm.firstName} onChange={(e) => setNewUserForm((p) => ({ ...p, firstName: e.target.value }))} className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-1.5">Last Name</label>
                  <input type="text" value={newUserForm.lastName} onChange={(e) => setNewUserForm((p) => ({ ...p, lastName: e.target.value }))} className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-1.5">Email</label>
                  <input type="email" value={newUserForm.email} onChange={(e) => setNewUserForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-1.5">Password</label>
                  <input type="password" value={newUserForm.password} onChange={(e) => setNewUserForm((p) => ({ ...p, password: e.target.value }))} className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleAddUser} disabled={!newUserForm.firstName || !newUserForm.lastName || !newUserForm.email || !newUserForm.password} className="btn-ink px-6 py-2.5 text-xs tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed">
                  Create {newUserForm.role === "vendor" ? "Vendor" : "Customer"}
                </button>
                <button onClick={() => setShowAddUser(false)} className="px-6 py-2.5 text-xs tracking-widest uppercase border border-border text-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-cream border border-border overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-serif">
          <div className="col-span-1"></div>
          <div className="col-span-3">User</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Joined</div>
          <div className="col-span-1">Actions</div>
        </div>
        <div className="divide-y divide-border">
          <AnimatePresence>
            {filteredUsers.map((u, i) => (
              <motion.div
                key={u.id || i}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-secondary/50 transition-colors items-center"
              >
                <div className="md:col-span-1">
                  <div className="w-9 h-9 rounded-full bg-ink/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-ink">{getInitials(u)}</span>
                  </div>
                </div>
                <div className="md:col-span-3 text-sm font-serif text-foreground">
                  {u.firstName ? `${u.firstName} ${u.lastName || ""}` : "N/A"}
                </div>
                <div className="md:col-span-3 text-sm text-muted-foreground truncate">{u.email}</div>
                <div className="md:col-span-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    u.role === "admin"
                      ? "bg-crimson/15 text-crimson border border-crimson/30"
                      : u.role === "vendor"
                      ? "bg-ink/10 text-ink border border-ink/20"
                      : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}>
                    {u.role}
                  </span>
                </div>
                <div className="md:col-span-2 text-sm text-muted-foreground">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                </div>
                <div className="md:col-span-1 flex items-center gap-1">
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="p-2 hover:bg-ink/5 rounded transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => startEditUser(u)}
                    className="p-2 hover:bg-ink/5 rounded transition-colors"
                    title="Edit user"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => banUser(u.id)}
                    className="p-2 hover:bg-crimson/10 rounded transition-colors"
                    title="Ban user"
                  >
                    <Ban className="w-4 h-4 text-crimson" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredUsers.length === 0 && (
            <EmptyState icon={Users} title="No users found" description="No users match your search criteria." />
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
            onClick={() => { setSelectedUser(null); setEditingUser(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="font-serif text-lg text-foreground">User Details</h3>
                <button onClick={() => { setSelectedUser(null); setEditingUser(null); }} className="p-2 hover:bg-secondary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {editingUser === selectedUser.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">First Name</label>
                      <input
                        type="text"
                        value={editUserForm.firstName}
                        onChange={(e) => setEditUserForm((prev) => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Last Name</label>
                      <input
                        type="text"
                        value={editUserForm.lastName}
                        onChange={(e) => setEditUserForm((prev) => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Email</label>
                      <input
                        type="email"
                        value={editUserForm.email}
                        onChange={(e) => setEditUserForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Role</label>
                      <select
                        value={editUserForm.role}
                        onChange={(e) => setEditUserForm((prev) => ({ ...prev, role: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 appearance-none cursor-pointer"
                      >
                        <option value="admin">Admin</option>
                        <option value="vendor">Vendor</option>
                        <option value="customer">Customer</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <button onClick={saveEditUser} className="flex-1 btn-ink btn-ink-hover py-2.5 text-xs">
                        <Check size={14} /> Save Changes
                      </button>
                      <button onClick={cancelEditUser} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-widest hover:bg-secondary transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-ink/10 flex items-center justify-center">
                        <span className="text-lg font-medium text-ink">{getInitials(selectedUser)}</span>
                      </div>
                      <div>
                        <h4 className="font-serif text-lg text-foreground">{selectedUser.firstName} {selectedUser.lastName}</h4>
                        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      </div>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Role</span>
                        <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${
                          selectedUser.role === "admin" ? "bg-crimson/15 text-crimson" :
                          selectedUser.role === "vendor" ? "bg-ink/10 text-ink" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>{selectedUser.role}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="text-foreground">{selectedUser.phone || "Not provided"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Joined</span>
                        <span className="text-foreground">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "N/A"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Addresses</span>
                        <span className="text-foreground">{selectedUser.addresses?.length || 0}</span>
                      </div>
                      {selectedUser.role === "customer" && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Orders</span>
                            <span className="text-foreground font-serif">{orders.filter((o) => o.userId === selectedUser.id || o.user === selectedUser.id).length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Spent</span>
                            <span className="text-foreground font-serif">${orders.filter((o) => o.userId === selectedUser.id || o.user === selectedUser.id).reduce((sum, o) => sum + (o.total || o.totalAmount || 0), 0).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                      {selectedUser.role === "vendor" && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Store Name</span>
                            <span className="text-foreground">{selectedUser.vendorStore?.name || "N/A"}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Commission</span>
                            <span className="text-foreground">{selectedUser.vendorStore?.commission || 15}%</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <button
                        onClick={() => startEditUser(selectedUser)}
                        className="flex-1 btn-ink btn-ink-hover py-2.5 text-xs"
                      >
                        <Edit2 size={14} /> Edit User
                      </button>
                      <button
                        onClick={() => banUser(selectedUser.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-crimson/30 text-crimson text-xs uppercase tracking-widest hover:bg-crimson/5 transition-colors"
                      >
                        <Ban size={14} /> Ban User
                      </button>
                    </div>
                    {resetPasswordUser === selectedUser.id ? (
                      <div className="pt-4 border-t border-border space-y-3">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif">Reset Password</p>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (min 6 characters)"
                          className="w-full px-4 py-2.5 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                        />
                        <div className="flex gap-3">
                          <button onClick={() => handleResetPassword(selectedUser.id)} className="flex-1 btn-ink btn-ink-hover py-2.5 text-xs">
                            <Check size={14} /> Reset Password
                          </button>
                          <button onClick={() => { setResetPasswordUser(null); setNewPassword(""); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-widest hover:bg-secondary transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setResetPasswordUser(selectedUser.id); setNewPassword(""); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-widest hover:bg-secondary transition-colors mt-3"
                      >
                        <Lock size={14} /> Reset Password
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderVendors = () => {
    const vendorProducts = selectedVendor
      ? products.filter((p) => p.vendor === (selectedVendor.storeName || selectedVendor.name))
      : [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Store} label="Total Vendors" value={vendorStats.total} index={0} />
          <StatCard icon={TrendingUp} label="Active Sellers" value={vendorStats.activeSellers} index={1} />
          <StatCard icon={DollarSign} label="Total Earnings" value={`$${vendorStats.totalEarnings.toLocaleString()}`} index={2} />
          <StatCard icon={Banknote} label="Pending Payouts" value={`$${vendorStats.pendingPayouts.toLocaleString()}`} index={3} />
        </div>

        <div className="flex items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowAddVendor(!showAddVendor)}
            className="btn-ink px-5 py-3 text-xs tracking-widest uppercase flex items-center gap-2 ml-4"
          >
            <Plus size={14} />
            {showAddVendor ? "Close" : "Add Vendor"}
          </button>
        </div>

        <AnimatePresence>
          {showAddVendor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-cream border border-border overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <p className="eyebrow">Add New Vendor</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-1.5">First Name</label>
                    <input type="text" value={newVendorForm.firstName} onChange={(e) => setNewVendorForm((p) => ({ ...p, firstName: e.target.value }))} className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-1.5">Last Name</label>
                    <input type="text" value={newVendorForm.lastName} onChange={(e) => setNewVendorForm((p) => ({ ...p, lastName: e.target.value }))} className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-1.5">Email</label>
                    <input type="email" value={newVendorForm.email} onChange={(e) => setNewVendorForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-1.5">Password</label>
                    <input type="password" value={newVendorForm.password} onChange={(e) => setNewVendorForm((p) => ({ ...p, password: e.target.value }))} className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleAddVendor} disabled={!newVendorForm.firstName || !newVendorForm.lastName || !newVendorForm.email || !newVendorForm.password} className="btn-ink px-6 py-2.5 text-xs tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed">
                    Create Vendor
                  </button>
                  <button onClick={() => setShowAddVendor(false)} className="px-6 py-2.5 text-xs tracking-widest uppercase border border-border text-foreground hover:bg-secondary transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredVendors.map((vendor, i) => (
              <motion.div
                key={vendor.id || i}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                animate="visible"
                className="bg-cream border border-border p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-display text-lg text-foreground">{vendor.storeName || vendor.name}</h3>
                      {vendor.suspended && <StatusBadge status="suspended" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{vendor.description || "No description"}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-ink/10 flex items-center justify-center flex-shrink-0">
                    <Store size={16} className="text-ink" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div className="text-center p-3 bg-secondary/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Products</p>
                    <p className="font-serif text-lg text-foreground mt-1">{products.filter((p) => p.vendor === (vendor.storeName || vendor.name)).length}</p>
                  </div>
                  <div className="text-center p-3 bg-secondary/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Sales</p>
                    <p className="font-serif text-lg text-foreground mt-1">{(vendor.totalSales || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-secondary/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Earnings</p>
                    <p className="font-serif text-lg text-foreground mt-1">${(vendor.totalEarnings || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-secondary/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending</p>
                    <p className="font-serif text-lg text-crimson mt-1">${(vendor.pendingPayout || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Commission Rate</span>
                  <span className="text-foreground font-serif">{vendor.commission || 15}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="text-foreground font-serif">{vendor.joinedAt || "N/A"}</span>
                </div>
                <div className="flex gap-2 pt-3 border-t border-border">
                  <button onClick={() => setSelectedVendor(vendor)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-border text-xs uppercase tracking-wider text-foreground hover:bg-secondary transition-colors">
                    <Eye size={14} /> View
                  </button>
                  <button onClick={() => startEditVendor(vendor)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-border text-xs uppercase tracking-wider text-foreground hover:bg-secondary transition-colors">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => banVendor(vendor.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 border border-crimson/30 text-crimson text-xs uppercase tracking-wider hover:bg-crimson/5 transition-colors"
                  >
                    <Ban size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredVendors.length === 0 && (
            <div className="md:col-span-2">
              <EmptyState icon={Store} title="No vendors found" description="No vendors match your search." />
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedVendor && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
              onClick={() => { setSelectedVendor(null); setEditingVendor(null); setVendorDetailTab("info"); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-background border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h3 className="font-serif text-lg text-foreground">Vendor Details</h3>
                  <button onClick={() => { setSelectedVendor(null); setEditingVendor(null); setVendorDetailTab("info"); }} className="p-2 hover:bg-secondary transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex border-b border-border">
                  <button
                    onClick={() => setVendorDetailTab("info")}
                    className={`flex-1 px-4 py-3 text-xs uppercase tracking-widest font-serif transition-colors border-b-2 ${vendorDetailTab === "info" ? "border-ink text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    Info
                  </button>
                  <button
                    onClick={() => setVendorDetailTab("products")}
                    className={`flex-1 px-4 py-3 text-xs uppercase tracking-widest font-serif transition-colors border-b-2 ${vendorDetailTab === "products" ? "border-ink text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    Products ({vendorProducts.length})
                  </button>
                </div>

                <div className="p-6">
                  {vendorDetailTab === "info" && (
                    <>
                      {editingVendor === selectedVendor.id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Store Name</label>
                            <input
                              type="text"
                              value={editVendorForm.storeName}
                              onChange={(e) => setEditVendorForm((prev) => ({ ...prev, storeName: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Description</label>
                            <input
                              type="text"
                              value={editVendorForm.description}
                              onChange={(e) => setEditVendorForm((prev) => ({ ...prev, description: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Commission (%)</label>
                            <input
                              type="number"
                              min="5"
                              max="40"
                              value={editVendorForm.commission}
                              onChange={(e) => setEditVendorForm((prev) => ({ ...prev, commission: parseInt(e.target.value) || 15 }))}
                              className="w-full px-4 py-2.5 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                            />
                          </div>
                          <div className="flex gap-3 pt-4 border-t border-border">
                            <button onClick={saveEditVendor} className="flex-1 btn-ink btn-ink-hover py-2.5 text-xs">
                              <Check size={14} /> Save Changes
                            </button>
                            <button onClick={cancelEditVendor} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-widest hover:bg-secondary transition-colors">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-ink/10 flex items-center justify-center">
                              <Store size={20} className="text-ink" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-serif text-lg text-foreground">{selectedVendor.storeName || selectedVendor.name}</h4>
                                {selectedVendor.suspended && <StatusBadge status="suspended" />}
                              </div>
                              <p className="text-sm text-muted-foreground">{selectedVendor.description}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-4 bg-secondary/50">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Sales</p>
                              <p className="font-serif text-xl text-foreground mt-1">{(selectedVendor.totalSales || 0).toLocaleString()}</p>
                            </div>
                            <div className="text-center p-4 bg-secondary/50">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Earnings</p>
                              <p className="font-serif text-xl text-foreground mt-1">${(selectedVendor.totalEarnings || 0).toLocaleString()}</p>
                            </div>
                            <div className="text-center p-4 bg-secondary/50">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Products</p>
                              <p className="font-serif text-xl text-foreground mt-1">{vendorProducts.length}</p>
                            </div>
                            <div className="text-center p-4 bg-secondary/50">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending Payout</p>
                              <p className="font-serif text-xl text-crimson mt-1">${(selectedVendor.pendingPayout || 0).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Commission Rate</span>
                              <span className="text-foreground">{selectedVendor.commission || 15}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Joined</span>
                              <span className="text-foreground">{selectedVendor.joinedAt || "N/A"}</span>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-4 border-t border-border">
                            <button onClick={() => startEditVendor(selectedVendor)} className="flex-1 btn-ink btn-ink-hover py-2.5 text-xs">
                              <Edit2 size={14} /> Edit Vendor
                            </button>
                            <button onClick={() => banVendor(selectedVendor.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-crimson/30 text-crimson text-xs uppercase tracking-widest hover:bg-crimson/5 transition-colors">
                              <Ban size={14} /> Ban Vendor
                            </button>
                          </div>
                          {resetPasswordVendor === selectedVendor.id ? (
                            <div className="pt-4 border-t border-border space-y-3">
                              <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif">Reset Vendor Password</p>
                              <input
                                type="password"
                                value={vendorNewPassword}
                                onChange={(e) => setVendorNewPassword(e.target.value)}
                                placeholder="New password (min 6 characters)"
                                className="w-full px-4 py-2.5 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                              />
                              <div className="flex gap-3">
                                <button onClick={() => handleResetVendorPassword(selectedVendor.id)} className="flex-1 btn-ink btn-ink-hover py-2.5 text-xs">
                                  <Check size={14} /> Reset Password
                                </button>
                                <button onClick={() => { setResetPasswordVendor(null); setVendorNewPassword(""); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-widest hover:bg-secondary transition-colors">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setResetPasswordVendor(selectedVendor.id); setVendorNewPassword(""); }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-widest hover:bg-secondary transition-colors mt-3"
                            >
                              <Lock size={14} /> Reset Vendor Password
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {vendorDetailTab === "products" && (
                    <div className="space-y-4">
                      {vendorProducts.length === 0 ? (
                        <div className="text-center py-8">
                          <Package size={24} className="text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">No products from this vendor yet.</p>
                        </div>
                      ) : (
                        vendorProducts.map((p) => (
                          <div key={p.id} className="flex items-center gap-4 p-4 bg-cream border border-border">
                            <div className="w-12 h-12 bg-secondary border border-border flex-shrink-0 flex items-center justify-center">
                              {p.images?.[0] ? (
                                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <Image size={16} className="text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-serif text-foreground truncate">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.category}</p>
                            </div>
                            <span className="text-sm font-serif text-foreground">${parsePrice(p.price)}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditProduct(p)}
                                className="p-1.5 hover:bg-ink/5 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => deleteProduct(p.id)}
                                className="p-1.5 hover:bg-crimson/10 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-crimson" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderProducts = () => {
    return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Package} label="Total Products" value={products.length} index={0} />
        <StatCard icon={Store} label="With Images" value={products.filter((p) => p.images?.length > 0).length} index={1} />
        <StatCard icon={CheckCircle} label="Categories" value={uniqueCategories.length} index={2} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filteredAllProducts.length} product{filteredAllProducts.length !== 1 ? "s" : ""} found</p>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-ink px-5 py-2.5 text-xs tracking-widest uppercase flex items-center gap-2"
        >
          <Plus size={14} />
          {showAddForm ? "Close Form" : "Add Product"}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <AddProductForm
            categories={MOCK_CATEGORIES.filter((c) => c.active)}
            vendors={vendors}
            editProduct={editingProduct}
            onSave={handleSaveProduct}
            onCancel={() => { setShowAddForm(false); setEditingProduct(null); }}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products by name or vendor..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors"
          />
        </div>
        <select
          value={productCategoryFilter}
          onChange={(e) => setProductCategoryFilter(e.target.value)}
          className="px-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors appearance-none cursor-pointer"
        >
          <option value="All">All Categories</option>
          {uniqueCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="bg-cream border border-border overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-serif">
          <div className="col-span-1"></div>
          <div className="col-span-3">Name</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-1">Price</div>
          <div className="col-span-2">Vendor</div>
          <div className="col-span-1">Stock</div>
          <div className="col-span-2">Actions</div>
        </div>
        <div className="divide-y divide-border">
          <AnimatePresence>
            {filteredAllProducts.map((p, i) => (
              <motion.div
                key={p.id}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-secondary/50 transition-colors items-center"
              >
                <div className="md:col-span-1">
                  <div className="w-10 h-10 bg-secondary border border-border flex items-center justify-center">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Image size={14} className="text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="md:col-span-3 text-sm font-serif text-foreground truncate">{p.name}</div>
                <div className="md:col-span-2 text-sm text-muted-foreground">{p.category || "N/A"}</div>
                <div className="md:col-span-1 text-sm text-foreground font-serif">${parsePrice(p.price)}</div>
                <div className="md:col-span-2 text-sm text-muted-foreground truncate">{p.vendor || "N/A"}</div>
                <div className="md:col-span-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.stock > 0 || p.stock === undefined ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {p.stock > 0 || p.stock === undefined ? "In Stock" : "Out"}
                  </span>
                </div>
                <div className="md:col-span-2 flex items-center gap-1">
                  <button
                    onClick={() => setPreviewProduct(p)}
                    className="p-2 hover:bg-ink/5 rounded transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => startEditProduct(p)}
                    className="p-2 hover:bg-ink/5 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="p-2 hover:bg-crimson/10 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-crimson" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredAllProducts.length === 0 && (
            <EmptyState icon={Package} title="No products found" description="No products match your search criteria." />
          )}
        </div>
      </div>


      <AnimatePresence>
        {previewProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
            onClick={() => setPreviewProduct(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="font-serif text-lg text-foreground">Product Preview</h3>
                <button onClick={() => setPreviewProduct(null)} className="p-2 hover:bg-secondary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="aspect-[3/4] bg-secondary border border-border flex items-center justify-center">
                  {previewProduct.images?.[0] ? (
                    <img src={previewProduct.images[0]} alt={previewProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Image size={32} className="text-muted-foreground" />
                  )}
                </div>
                <h4 className="font-serif text-lg text-foreground">{previewProduct.name}</h4>
                <p className="text-sm text-muted-foreground">{previewProduct.category}</p>
                <p className="font-serif text-xl text-foreground">${parsePrice(previewProduct.price)}</p>
                {previewProduct.description && (
                  <p className="text-sm text-muted-foreground">{previewProduct.description}</p>
                )}
                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vendor</span>
                    <span className="text-foreground">{previewProduct.vendor || "N/A"}</span>
                  </div>
                  {previewProduct.sizes && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sizes</span>
                      <span className="text-foreground">{previewProduct.sizes.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  };

  const renderRentals = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Rental Items" value={rentalProducts.length} index={0} />
        <StatCard icon={TrendingUp} label="Active Rentals" value={rentalProducts.reduce((sum, r) => sum + r.activeRentals, 0)} index={1} />
        <StatCard icon={Repeat} label="Total Bookings" value={rentalProducts.reduce((sum, r) => sum + r.totalRentals, 0)} index={2} />
        <StatCard icon={DollarSign} label="Rental Revenue" value={`$${totalRentalRevenue.toLocaleString()}`} index={3} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search rental items..."
            value={rentalSearch}
            onChange={(e) => setRentalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors"
          />
        </div>
        <select
          value={rentalFilter}
          onChange={(e) => setRentalFilter(e.target.value)}
          className="px-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors appearance-none cursor-pointer"
        >
          {["All", "active", "paused"].map((s) => (
            <option key={s} value={s}>{s === "All" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-cream border border-border overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-serif">
          <div className="col-span-3">Item</div>
          <div className="col-span-2">Vendor</div>
          <div className="col-span-1">Price/Day</div>
          <div className="col-span-1">Rentals</div>
          <div className="col-span-1">Active</div>
          <div className="col-span-1">Revenue</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Actions</div>
        </div>
        <div className="divide-y divide-border">
          <AnimatePresence>
            {filteredRentals.map((rental, i) => (
              <motion.div
                key={rental.id}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-secondary/50 transition-colors items-center"
              >
                <div className="md:col-span-3 text-sm font-serif text-foreground">{rental.name}</div>
                <div className="md:col-span-2 text-sm text-muted-foreground">{rental.vendor}</div>
                <div className="md:col-span-1 text-sm text-foreground">${rental.pricePerDay}</div>
                <div className="md:col-span-1 text-sm text-foreground">{rental.totalRentals}</div>
                <div className="md:col-span-1 text-sm text-foreground">{rental.activeRentals}</div>
                <div className="md:col-span-1 text-sm text-foreground font-serif">${rental.revenue.toLocaleString()}</div>
                <div className="md:col-span-1"><StatusBadge status={rental.status} /></div>
                <div className="md:col-span-2 flex items-center gap-1">
                  <button
                    onClick={() => setSelectedRental(rental)}
                    className="p-2 hover:bg-ink/5 rounded transition-colors"
                  >
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => startEditRental(rental)}
                    className="p-2 hover:bg-ink/5 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setSelectedRental(rental)}
                    className="p-2 hover:bg-ink/5 rounded transition-colors"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredRentals.length === 0 && (
            <div className="py-12">
              <EmptyState icon={Repeat} title="No rental items" description="No rental items match your criteria." />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editingRental && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
            onClick={cancelEditRental}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-border w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="font-serif text-lg text-foreground">Edit Rental</h3>
                <button onClick={cancelEditRental} className="p-2 hover:bg-secondary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Name</label>
                  <input
                    type="text"
                    value={editRentalForm.name}
                    onChange={(e) => setEditRentalForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Price Per Day ($)</label>
                  <input
                    type="number"
                    value={editRentalForm.pricePerDay}
                    onChange={(e) => setEditRentalForm((prev) => ({ ...prev, pricePerDay: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Status</label>
                  <select
                    value={editRentalForm.status}
                    onChange={(e) => setEditRentalForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 appearance-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4 border-t border-border">
                  <button onClick={saveEditRental} className="flex-1 btn-ink btn-ink-hover py-2.5 text-xs">
                    <Check size={14} /> Save
                  </button>
                  <button onClick={cancelEditRental} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-widest hover:bg-secondary transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRental && !editingRental && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
            onClick={() => setSelectedRental(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="font-serif text-lg text-foreground">Rental Details</h3>
                <button onClick={() => setSelectedRental(null)} className="p-2 hover:bg-secondary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-serif text-lg text-foreground">{selectedRental.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedRental.vendor}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-4 bg-secondary/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Price/Day</p>
                    <p className="font-serif text-xl text-foreground mt-1">${selectedRental.pricePerDay}</p>
                  </div>
                  <div className="text-center p-4 bg-secondary/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue</p>
                    <p className="font-serif text-xl text-foreground mt-1">${selectedRental.revenue.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-4 bg-secondary/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Rentals</p>
                    <p className="font-serif text-xl text-foreground mt-1">{selectedRental.totalRentals}</p>
                  </div>
                  <div className="text-center p-4 bg-secondary/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Active</p>
                    <p className="font-serif text-xl text-foreground mt-1">{selectedRental.activeRentals}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={selectedRental.status} />
                </div>
                <div className="flex gap-3 pt-4 border-t border-border">
                  <button onClick={() => { startEditRental(selectedRental); setSelectedRental(null); }} className="flex-1 btn-ink btn-ink-hover py-2.5 text-xs">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button onClick={() => setSelectedRental(null)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-widest hover:bg-secondary transition-colors">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Add new category..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            className="w-full px-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors"
          />
        </div>
        <button
          onClick={addCategory}
          disabled={!newCategoryName.trim()}
          className="flex items-center gap-2 px-5 py-3 bg-ink text-cream text-xs uppercase tracking-widest hover:bg-crimson transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={14} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-cream border border-border p-6 space-y-4"
            >
              <div className="flex items-end justify-end">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="text-foreground hover:text-ink transition-colors"
                  title={cat.active ? "Deactivate" : "Activate"}
                >
                  {cat.active ? <ToggleRight size={24} className="text-ink" /> : <ToggleLeft size={24} className="text-muted-foreground" />}
                </button>
              </div>
              <div>
                {editingCategory === cat.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEditCategory(cat.id); if (e.key === "Escape") cancelEditCategory(); }}
                      className="flex-1 px-3 py-1.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                      autoFocus
                    />
                    <button onClick={() => saveEditCategory(cat.id)} className="p-1.5 hover:bg-ink/10 rounded transition-colors">
                      <Check size={14} className="text-ink" />
                    </button>
                    <button onClick={cancelEditCategory} className="p-1.5 hover:bg-crimson/10 rounded transition-colors">
                      <X size={14} className="text-crimson" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-serif text-lg text-foreground">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground">{cat.productCount} products</p>
                  </>
                )}
              </div>
              <div className="flex gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => startEditCategory(cat)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-crimson/30 text-crimson text-xs hover:bg-crimson/5 transition-colors"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );


  const renderFeatured = () => (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Current Selection</p>
        <h3 className="font-serif text-display text-xl text-foreground mt-1">Featured Products ({featuredProducts.length})</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {featuredProducts.map((product, i) => (
            <motion.div
              key={product.id}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-cream border border-border"
            >
              <div className="aspect-[3/4] bg-secondary border-b border-border flex items-center justify-center">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Image size={24} className="text-muted-foreground" />
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-serif">#{i + 1}</span>
                  <GripVertical size={14} className="text-muted-foreground cursor-grab" />
                </div>
                <h4 className="font-serif text-sm text-foreground truncate">{product.name}</h4>
                <p className="text-sm text-muted-foreground">${parsePrice(product.price)}</p>
                <button
                  onClick={() => removeFeatured(product)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-crimson/30 text-crimson text-xs uppercase tracking-wider hover:bg-crimson/5 transition-colors"
                >
                  <X size={12} /> Remove
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="pt-6 border-t border-border">
        <p className="eyebrow">Available to Feature</p>
        <h3 className="font-serif text-display text-xl text-foreground mt-1 mb-6">Add Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {availableProducts.map((product, i) => (
              <motion.div
                key={product.id}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                animate="visible"
                className="bg-cream border border-border"
              >
                <div className="aspect-[3/4] bg-secondary border-b border-border flex items-center justify-center">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Image size={24} className="text-muted-foreground" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-serif text-sm text-foreground truncate">{product.name}</h4>
                  <p className="text-sm text-muted-foreground">${parsePrice(product.price)}</p>
                  <button
                    onClick={() => addFeatured(product)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-ink text-cream text-xs uppercase tracking-wider hover:bg-crimson transition-colors"
                  >
                    <Star size={12} /> Feature
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {availableProducts.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-4">
              <EmptyState icon={Star} title="All products featured" description="All available products are in the featured list." />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAds = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Megaphone} label="Active Ads" value={adStats.active} index={0} />
        <StatCard icon={Eye} label="Total Impressions" value={adStats.totalImpressions.toLocaleString()} index={1} />
        <StatCard icon={MousePointerClick} label="Total Clicks" value={adStats.totalClicks.toLocaleString()} index={2} />
        <StatCard icon={TrendingUp} label="Avg CTR" value={`${adStats.avgCTR}%`} index={3} />
      </div>

      <div className="flex items-center justify-between">
        <p className="eyebrow">Active Campaigns</p>
        <button
          onClick={() => setShowNewAdForm(!showNewAdForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-ink text-cream text-xs uppercase tracking-widest hover:bg-crimson transition-colors"
        >
          <Plus size={14} /> New Ad
        </button>
      </div>

      <AnimatePresence>
        {showNewAdForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-cream border border-border p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Title</label>
                  <input
                    type="text"
                    value={newAdForm.title}
                    onChange={(e) => setNewAdForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Ad title..."
                    className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Type</label>
                  <select
                    value={newAdForm.type}
                    onChange={(e) => setNewAdForm((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 appearance-none cursor-pointer"
                  >
                    <option value="banner">Banner</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="popup">Popup</option>
                    <option value="slide">Homepage Slide</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Subtitle</label>
                  <input type="text" value={newAdForm.subtitle} onChange={(e) => setNewAdForm((prev) => ({ ...prev, subtitle: e.target.value }))} placeholder="Optional offer or message" className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Position</label>
                  <select
                    value={newAdForm.position}
                    onChange={(e) => setNewAdForm((prev) => ({ ...prev, position: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 appearance-none cursor-pointer"
                  >
                    <option value="homepage-top">Homepage Top</option>
                    <option value="homepage-bottom">Homepage Bottom</option>
                    <option value="category-page">Category Page</option>
                    <option value="product-page">Product Page</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newAdForm.startDate}
                      onChange={(e) => setNewAdForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">End Date</label>
                    <input
                      type="date"
                      value={newAdForm.endDate}
                      onChange={(e) => setNewAdForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Advertisement Image</label>
                  <input type="file" accept="image/*" onChange={(e) => handleAdImage(e.target.files?.[0])} className="w-full px-3 py-2 bg-background border border-border text-sm" />
                  {newAdForm.image && <img src={newAdForm.image} alt="New advertisement preview" className="mt-3 h-24 w-40 object-cover border border-border" />}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Button Text</label><input type="text" value={newAdForm.buttonText} onChange={(e) => setNewAdForm((prev) => ({ ...prev, buttonText: e.target.value }))} className="w-full px-4 py-2.5 bg-background border border-border text-sm" /></div>
                  <div><label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">Link</label><input type="text" value={newAdForm.link} onChange={(e) => setNewAdForm((prev) => ({ ...prev, link: e.target.value }))} placeholder="/collection" className="w-full px-4 py-2.5 bg-background border border-border text-sm" /></div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={addNewAd}
                  disabled={!newAdForm.title.trim() || !newAdForm.image}
                  className="btn-ink btn-ink-hover px-6 py-2.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={14} /> Create Ad
                </button>
                <button
                  onClick={() => setShowNewAdForm(false)}
                  className="px-6 py-2.5 border border-border text-xs uppercase tracking-widest text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <AnimatePresence>
          {ads.map((ad, i) => (
            <motion.div
              key={ad.id}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              animate="visible"
              className="bg-cream border border-border p-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 flex items-center justify-center ${ad.type === "banner" ? "bg-ink/10" : ad.type === "sidebar" ? "bg-blush/30" : "bg-crimson/10"}`}>
                    <Megaphone size={18} className={ad.type === "banner" ? "text-ink" : ad.type === "sidebar" ? "text-crimson" : "text-crimson"} />
                  </div>
                  <div>
                    <h4 className="font-serif text-foreground">{ad.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs px-2.5 py-0.5 bg-ink/10 text-ink rounded-full capitalize">{ad.type}</span>
                      <span className="text-xs text-muted-foreground">{ad.position}</span>
                      <span className="text-xs text-muted-foreground">{ad.startDate} → {ad.endDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Impressions</p>
                        <p className="font-serif text-sm text-foreground">{ad.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                        <p className="font-serif text-sm text-foreground">{ad.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CTR</p>
                        <p className="font-serif text-sm text-foreground">{ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAd(ad.id)}
                      className={`p-2 transition-colors ${ad.active ? "bg-ink/10 text-ink" : "bg-secondary text-muted-foreground"}`}
                      title={ad.active ? "Deactivate" : "Activate"}
                    >
                      {ad.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button
                      onClick={() => deleteAd(ad.id)}
                      className="p-2 hover:bg-crimson/10 text-crimson transition-colors"
                      title="Delete ad"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="sm:hidden grid grid-cols-3 gap-4 text-center mt-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Impressions</p>
                  <p className="font-serif text-sm text-foreground">{ad.impressions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clicks</p>
                  <p className="font-serif text-sm text-foreground">{ad.clicks.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CTR</p>
                  <p className="font-serif text-sm text-foreground">{ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0}%</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {ads.length === 0 && (
          <EmptyState icon={Megaphone} title="No advertisements" description="Create your first ad campaign to get started." action="Create Ad" onAction={() => setShowNewAdForm(true)} />
        )}
      </div>
    </div>
  );

  const renderReports = () => {
    const currentMonth = MONTHLY_DATA[MONTHLY_DATA.length - 1];
    const prevMonth = MONTHLY_DATA[MONTHLY_DATA.length - 2];
    const revenueChange = prevMonth ? (((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100).toFixed(1) : 0;
    const ordersChange = prevMonth ? (((currentMonth.orders - prevMonth.orders) / prevMonth.orders) * 100).toFixed(1) : 0;

    const topProducts = [...products]
      .sort((a, b) => (b.price || 0) - (a.price || 0))
      .slice(0, 5);

    const revenueBreakdown = [
      { source: "Product Sales", amount: totalRevenue, percentage: totalRevenue + totalRentalRevenue > 0 ? ((totalRevenue / (totalRevenue + totalRentalRevenue)) * 100).toFixed(0) : 0 },
      { source: "Rental Income", amount: totalRentalRevenue, percentage: totalRevenue + totalRentalRevenue > 0 ? ((totalRentalRevenue / (totalRevenue + totalRentalRevenue)) * 100).toFixed(0) : 0 },
      { source: "Commission Fees", amount: Math.round(totalRevenue * (productCommission / 100)), percentage: productCommission },
      { source: "Rental Commission", amount: Math.round(totalRentalRevenue * (rentalCommission / 100)), percentage: rentalCommission },
    ];

    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Period</p>
            <h3 className="font-serif text-display text-xl text-foreground mt-1">Analytics & Insights</h3>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="px-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors appearance-none cursor-pointer"
            >
              {MONTHLY_DATA.map((d) => (
                <option key={d.month} value={`${d.month} 2026`}>{d.month} 2026</option>
              ))}
            </select>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-3 bg-ink text-cream text-xs uppercase tracking-widest hover:bg-crimson transition-colors"
            >
              {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              {exporting ? "Exporting..." : "Export"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Monthly Revenue" value={`$${currentMonth.revenue.toLocaleString()}`} change={Math.abs(revenueChange)} changeType={revenueChange >= 0 ? "up" : "down"} index={0} />
          <StatCard icon={ShoppingCart} label="Monthly Orders" value={currentMonth.orders} change={Math.abs(ordersChange)} changeType={ordersChange >= 0 ? "up" : "down"} index={1} />
          <StatCard icon={Users} label="New Users" value={currentMonth.users} index={2} />
          <StatCard icon={Store} label="Active Vendors" value={currentMonth.vendors} index={3} />
        </div>

        <div className="bg-cream border border-border p-6">
          <p className="eyebrow mb-4">Monthly Trend</p>
          <div className="h-64 flex items-end gap-2">
            {MONTHLY_DATA.map((d, i) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full relative group">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
                    className="w-full bg-ink/70 hover:bg-crimson transition-colors cursor-pointer"
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-ink text-cream text-xs px-2 py-1 whitespace-nowrap z-10">
                    ${d.revenue.toLocaleString()}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground mt-2">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-cream border border-border">
            <div className="px-6 py-4 border-b border-border">
              <p className="eyebrow">Revenue Breakdown</p>
            </div>
            <div className="divide-y divide-border">
              {revenueBreakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4">
                  <span className="text-sm text-foreground">{item.source}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                    <span className="font-serif text-sm text-foreground w-24 text-right">${item.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-cream border border-border">
            <div className="px-6 py-4 border-b border-border">
              <p className="eyebrow">Top Products</p>
            </div>
            <div className="divide-y divide-border">
              {topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono w-6">#{i + 1}</span>
                    <span className="text-sm text-foreground truncate max-w-[180px]">{product.name}</span>
                  </div>
                  <span className="font-serif text-sm text-foreground">${parsePrice(product.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-cream border border-border">
          <div className="px-6 py-4 border-b border-border">
            <p className="eyebrow">Top Vendors</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-serif">
                  <th className="text-left px-6 py-3">Rank</th>
                  <th className="text-left px-6 py-3">Vendor</th>
                  <th className="text-left px-6 py-3">Products</th>
                  <th className="text-left px-6 py-3">Total Sales</th>
                  <th className="text-left px-6 py-3">Earnings</th>
                  <th className="text-left px-6 py-3">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vendors.map((vendor, i) => (
                  <tr key={vendor.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">#{i + 1}</td>
                    <td className="px-6 py-4 text-sm font-serif text-foreground">{vendor.storeName || vendor.name}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{products.filter((p) => p.vendor === (vendor.storeName || vendor.name)).length}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{(vendor.totalSales || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-serif">${(vendor.totalEarnings || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{vendor.commission || productCommission}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    const orderStatusFilter = adminOrderStatusFilter;
    const filteredAdminOrders = orders.filter((o) => {
      if (o.rentalDetails) return false;
      const matchesSearch =
        (o.id || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.shipping?.name || `${o.shipping?.firstName || ""} ${o.shipping?.lastName || ""}`).toLowerCase().includes(orderSearch.toLowerCase());
      const matchesStatus = orderStatusFilter === "All" || o.status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
    const sortedAdminOrders = [...filteredAdminOrders].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    const orderStatusCounts = {
      All: filteredAdminOrders.length,
      confirmed: filteredAdminOrders.filter((o) => o.status === "confirmed").length,
      preparing: filteredAdminOrders.filter((o) => o.status === "preparing").length,
      shipped: filteredAdminOrders.filter((o) => o.status === "shipped").length,
      delivered: filteredAdminOrders.filter((o) => o.status === "delivered").length,
      cancelled: filteredAdminOrders.filter((o) => o.status === "cancelled").length,
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ShoppingCart} label="Total Orders" value={orders.length} index={0} />
          <StatCard icon={Clock} label="Pending" value={orderStatusCounts.confirmed + orderStatusCounts.preparing} index={1} />
          <StatCard icon={Package} label="Shipped" value={orderStatusCounts.shipped} index={2} />
          <StatCard icon={CheckCircle} label="Delivered" value={orderStatusCounts.delivered} index={3} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders by ID or customer name..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors"
            />
          </div>
          <select
            value={adminOrderStatusFilter}
            onChange={(e) => setAdminOrderStatusFilter(e.target.value)}
            className="px-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors appearance-none cursor-pointer"
          >
            {Object.keys(orderStatusCounts).map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {adminOrdersLoading && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading orders from server...</p>
          </div>
        )}

        <div className="bg-cream border border-border overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-serif">
            <div className="col-span-2">Order ID</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-2">Items</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Total</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Actions</div>
          </div>
          <div className="divide-y divide-border">
            <AnimatePresence>
              {sortedAdminOrders.map((order, i) => {
                const isExpanded = expandedAdminOrder === order.id;
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
                      onClick={() => setExpandedAdminOrder(isExpanded ? null : order.id)}
                    >
                      <div className="md:col-span-2 text-sm font-mono text-foreground">{(order.id || "").slice(-12)}</div>
                      <div className="md:col-span-2 text-sm text-foreground">{order.shipping?.firstName} {order.shipping?.lastName}</div>
                      <div className="md:col-span-2 text-sm text-muted-foreground">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}</div>
                      <div className="md:col-span-2 text-sm text-muted-foreground">
                        {new Date(order.date || order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="md:col-span-1 font-serif text-sm text-foreground">${(order.total || 0).toLocaleString()}</div>
                      <div className="md:col-span-1"><StatusBadge status={order.status} /></div>
                      <div className="md:col-span-2 flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedAdminOrder(isExpanded ? null : order.id); }}
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
                            <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                              {["confirmed", "preparing", "shipped", "delivered", "cancelled"].map((status) => (
                                <button
                                  key={status}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateOrderStatusApi(order.id, status);
                                    setExpandedAdminOrder(null);
                                  }}
                                  disabled={order.status === status}
                                  className={`text-xs tracking-wider uppercase px-3 py-2 rounded-sm transition-colors ${
                                    order.status === status
                                      ? "bg-ink/10 text-ink border border-ink/30"
                                      : "border border-border text-muted-foreground hover:text-foreground hover:border-ink/30"
                                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {sortedAdminOrders.length === 0 && (
              <div className="px-6 py-12">
                <EmptyState icon={ShoppingCart} title="No orders found" description="No orders match your search criteria." />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRentalOrders = () => {
    const rentalOrders = orders.filter((o) => o.rentalDetails);
    const filteredRentalOrders = rentalOrders.filter((o) => {
      const matchesSearch =
        (o.id || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.shipping?.name || `${o.shipping?.firstName || ""} ${o.shipping?.lastName || ""}`).toLowerCase().includes(orderSearch.toLowerCase());
      const matchesStatus = adminRentalOrderStatusFilter === "All" || o.status === adminRentalOrderStatusFilter;
      return matchesSearch && matchesStatus;
    });
    const sortedRentalOrders = [...filteredRentalOrders].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    const rentalStatusCounts = {
      All: rentalOrders.length,
      confirmed: rentalOrders.filter((o) => o.status === "confirmed").length,
      preparing: rentalOrders.filter((o) => o.status === "preparing").length,
      shipped: rentalOrders.filter((o) => o.status === "shipped").length,
      delivered: rentalOrders.filter((o) => o.status === "delivered").length,
      cancelled: rentalOrders.filter((o) => o.status === "cancelled").length,
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Repeat} label="Total Rental Orders" value={rentalOrders.length} index={0} />
          <StatCard icon={Clock} label="Pending" value={rentalStatusCounts.confirmed + rentalStatusCounts.preparing} index={1} />
          <StatCard icon={Package} label="Shipped" value={rentalStatusCounts.shipped} index={2} />
          <StatCard icon={CheckCircle} label="Delivered" value={rentalStatusCounts.delivered} index={3} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search rental orders by ID or customer name..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors"
            />
          </div>
          <select
            value={adminRentalOrderStatusFilter}
            onChange={(e) => setAdminRentalOrderStatusFilter(e.target.value)}
            className="px-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors appearance-none cursor-pointer"
          >
            {Object.keys(rentalStatusCounts).map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {adminOrdersLoading && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading rental orders from server...</p>
          </div>
        )}

        <div className="bg-cream border border-border overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-serif">
            <div className="col-span-2">Order ID</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-2">Items</div>
            <div className="col-span-2">Rental Period</div>
            <div className="col-span-1">Total</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Actions</div>
          </div>
          <div className="divide-y divide-border">
            <AnimatePresence>
              {sortedRentalOrders.map((order, i) => {
                const isExpanded = expandedAdminRentalOrder === order.id;
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
                      onClick={() => setExpandedAdminRentalOrder(isExpanded ? null : order.id)}
                    >
                      <div className="md:col-span-2 text-sm font-mono text-foreground">{(order.id || "").slice(-12)}</div>
                      <div className="md:col-span-2 text-sm text-foreground">{order.shipping?.firstName} {order.shipping?.lastName}</div>
                      <div className="md:col-span-2 text-sm text-muted-foreground">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}</div>
                      <div className="md:col-span-2 text-sm text-muted-foreground">
                        {order.rentalDetails?.startDate ? new Date(order.rentalDetails.startDate).toLocaleDateString() : "-"} →{" "}
                        {order.rentalDetails?.endDate ? new Date(order.rentalDetails.endDate).toLocaleDateString() : "-"}
                        {order.rentalDetails?.rentalDays ? ` (${order.rentalDetails.rentalDays}d)` : ""}
                      </div>
                      <div className="md:col-span-1 font-serif text-sm text-foreground">${(order.total || 0).toLocaleString()}</div>
                      <div className="md:col-span-1"><StatusBadge status={order.status} /></div>
                      <div className="md:col-span-2 flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedAdminRentalOrder(isExpanded ? null : order.id); }}
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
                                  {order.rentalDetails.pricePerDay && (
                                    <div>
                                      <p className="text-muted-foreground text-xs">Price Per Day</p>
                                      <p className="text-foreground">${order.rentalDetails.pricePerDay}</p>
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
                            <OrderDetailPanel order={order} showCustomer={true} />
                            <div className="flex gap-3 mt-4 pt-4 border-t border-border flex-wrap">
                              {order.rentalDetails && order.returnRequested && order.inspectionStatus === "pending" && (
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
                              {["confirmed", "preparing", "shipped", "delivered", "cancelled"].map((status) => (
                                <button
                                  key={status}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateOrderStatusApi(order.id, status);
                                    setExpandedAdminRentalOrder(null);
                                  }}
                                  disabled={order.status === status}
                                  className={`text-xs tracking-wider uppercase px-3 py-2 rounded-sm transition-colors ${
                                    order.status === status
                                      ? "bg-ink/10 text-ink border border-ink/30"
                                      : "border border-border text-muted-foreground hover:text-foreground hover:border-ink/30"
                                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {sortedRentalOrders.length === 0 && (
              <div className="px-6 py-12">
                <EmptyState icon={Repeat} title="No rental orders found" description="No rental orders match your search criteria." />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return renderDashboard();
      case "orders": return renderOrders();
      case "rentalOrders": return renderRentalOrders();
      case "users": return renderUsers();
      case "vendors": return renderVendors();
      case "products": return renderProducts();
      case "rentals": return renderRentals();
      case "categories": return renderCategories();
      case "featured": return renderFeatured();
      case "ads": return renderAds();
      case "reports": return renderReports();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row">
        {/* Mobile Tabs */}
        <div className="lg:hidden border-b border-border bg-cream overflow-x-auto">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm uppercase tracking-wider font-serif whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-ink text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-cream border-r border-border p-8 space-y-8 flex-shrink-0">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-serif">
              Admin Panel
            </span>
          </div>

          <nav className="space-y-1 flex-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  activeTab === tab.id
                    ? "btn-ink text-cream"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-serif uppercase tracking-wider text-xs">
                  {tab.label}
                </span>
              </button>
            ))}
          </nav>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm text-foreground font-serif truncate">
              {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.email}
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10 min-h-screen">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <h1 className="font-serif text-display text-2xl lg:text-3xl text-foreground">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your marketplace
              </p>
            </div>
            {renderContent()}
          </motion.div>
        </main>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
        confirmLabel={confirmModal.confirmLabel}
      />
    </div>
  );
}
