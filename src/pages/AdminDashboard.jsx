import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { allProducts, parsePrice } from "@/data/products";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "products", label: "Products", icon: Package },
  { id: "vendors", label: "Vendors", icon: TrendingUp },
  { id: "users", label: "Users", icon: Users },
];

const statusColors = {
  Confirmed: "bg-emerald-500/15 text-emerald-700 border border-emerald-200",
  Preparing: "bg-amber-500/15 text-amber-700 border border-amber-200",
  Shipped: "bg-blue-500/15 text-blue-700 border border-blue-200",
  Delivered: "bg-crimson/15 text-crimson border border-crimson/30",
  Returned: "bg-gray-500/15 text-gray-600 border border-gray-200",
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser: user, users, isAuthenticated } = useAuth();
  const { orders, vendors, updateOrderStatus } = useOrders();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [accessDenied, setAccessDenied] = useState(false);

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [localProducts, setLocalProducts] = useState(allProducts);

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

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.shippingAddress?.name
        ?.toLowerCase()
        .includes(orderSearch.toLowerCase());
    const matchesStatus =
      orderStatusFilter === "All" || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredProducts = localProducts.filter((p) =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredUsers = (users || []).filter((u) => {
    const matchesSearch =
      `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === "All" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const updateProduct = (id, updates) => {
    setLocalProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const updateProductSize = (productId, size, value) => {
    setLocalProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const newStock = { ...p.stock, [size]: Math.max(0, parseInt(value) || 0) };
        return { ...p, stock: newStock };
      })
    );
  };

  const StatCard = ({ icon: Icon, label, value, index }) => (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      animate="visible"
      className="bg-cream border border-border p-6 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center">
          <Icon className="w-5 h-5 text-ink" />
        </div>
        <span className="text-muted-foreground text-sm uppercase tracking-wider font-serif">
          {label}
        </span>
      </div>
      <p className="font-serif text-display text-3xl text-foreground">{value}</p>
    </motion.div>
  );

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          index={0}
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={orders.length}
          index={1}
        />
        <StatCard
          icon={TrendingUp}
          label="Active Vendors"
          value={(vendors || []).length}
          index={2}
        />
        <StatCard
          icon={Users}
          label="Registered Users"
          value={(users || []).length}
          index={3}
        />
      </div>

      <div>
        <h2 className="font-serif text-display text-xl text-foreground mb-4">
          Recent Orders
        </h2>
        <div className="bg-cream border border-border divide-y divide-border">
          <AnimatePresence>
            {orders
              .slice(-5)
              .reverse()
              .map((order, i) => (
                <motion.div
                  key={order.id}
                  variants={fadeUp}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center justify-between px-6 py-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-6">
                    <span className="text-sm text-muted-foreground font-mono">
                      {order.id?.slice(-8)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.date).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-foreground">
                      {order.items?.length || 0} items
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-serif text-foreground">
                      ${(order.total || order.totalAmount || 0).toLocaleString()}
                    </span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        statusColors[order.status] || ""
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors"
          />
        </div>
        <select
          value={orderStatusFilter}
          onChange={(e) => setOrderStatusFilter(e.target.value)}
          className="px-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors appearance-none cursor-pointer"
        >
          {["All", "Confirmed", "Preparing", "Shipped", "Delivered", "Returned"].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>
      </div>

      <div className="bg-cream border border-border overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-serif">
          <div className="col-span-2">Order ID</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1">Items</div>
          <div className="col-span-2">Total</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Actions</div>
        </div>

        <div className="divide-y divide-border">
          <AnimatePresence>
            {filteredOrders.map((order, i) => (
              <motion.div
                key={order.id}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                animate="visible"
              >
                <div
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-secondary/50 transition-colors items-center cursor-pointer"
                  onClick={() =>
                    setExpandedOrder(expandedOrder === order.id ? null : order.id)
                  }
                >
                  <div className="md:col-span-2 font-mono text-sm text-foreground">
                    {order.id?.slice(-8)}
                  </div>
                  <div className="md:col-span-2 text-sm text-muted-foreground">
                    {new Date(order.date).toLocaleDateString()}
                  </div>
                  <div className="md:col-span-1 text-sm text-foreground">
                    {order.items?.length || 0}
                  </div>
                  <div className="md:col-span-2 font-serif text-foreground">
                    ${(order.total || order.totalAmount || 0).toLocaleString()}
                  </div>
                  <div className="md:col-span-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        statusColors[order.status] || ""
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="md:col-span-3 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedOrder(
                          expandedOrder === order.id ? null : order.id
                        );
                      }}
                      className="p-2 hover:bg-ink/5 rounded transition-colors"
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <select
                      value={order.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateOrderStatus(order.id, e.target.value);
                      }}
                      className="px-2 py-1 bg-background border border-border text-xs text-foreground focus:outline-none focus:border-ink/30"
                    >
                      {[
                        "Confirmed",
                        "Preparing",
                        "Shipped",
                        "Delivered",
                        "Returned",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedOrder === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 py-6 bg-secondary/30 border-t border-border space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-serif mb-3">
                              Items
                            </h4>
                            <div className="space-y-2">
                              {order.items?.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="text-foreground">
                                    {item.name || item.productName}{" "}
                                    {item.size && `(Size ${item.size})`} x{item.quantity || 1}
                                  </span>
                                  <span className="text-muted-foreground">
                                    ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-serif mb-2">
                                Shipping Address
                              </h4>
                              <p className="text-sm text-foreground">
                                {order.shippingAddress?.name}
                                <br />
                                {order.shippingAddress?.address}
                                <br />
                                {order.shippingAddress?.city},{" "}
                                {order.shippingAddress?.state}{" "}
                                {order.shippingAddress?.zip}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-serif mb-2">
                                Payment
                              </h4>
                              <p className="text-sm text-foreground">
                                {order.paymentMethod || "Card ending in ****"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search products..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-cream border border-border text-foreground text-sm focus:outline-none focus:border-ink/30 transition-colors"
        />
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredProducts.map((product, i) => {
            const totalStock = product.stock
              ? Object.values(product.stock).reduce((a, b) => a + b, 0)
              : 0;
            const isLowStock = totalStock < 10;

            return (
              <motion.div
                key={product.id}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                animate="visible"
                className="bg-cream border border-border"
              >
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() =>
                    setExpandedProduct(
                      expandedProduct === product.id ? null : product.id
                    )
                  }
                >
                  <div className="w-14 h-14 bg-secondary border border-border overflow-hidden flex-shrink-0">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-foreground text-sm truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {product.category}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="font-serif text-foreground text-sm">
                      ${parsePrice(product.price)}
                    </p>
                    <p
                      className={`text-xs ${
                        isLowStock ? "text-crimson font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {isLowStock ? "Low Stock" : ""} {totalStock} units
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.rentalAvailable && (
                      <span className="text-xs px-2 py-1 bg-ink/10 text-ink rounded-full">
                        Rental
                      </span>
                    )}
                    {isLowStock && (
                      <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedProduct === product.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 py-6 bg-secondary/30 border-t border-border">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div>
                            <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">
                              Price
                            </label>
                            <input
                              type="number"
                              value={product.price}
                              onChange={(e) =>
                                updateProduct(product.id, {
                                  price: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                            />
                          </div>
                          {product.stock &&
                            Object.entries(product.stock).map(([size, qty]) => (
                              <div key={size}>
                                <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">
                                  Size {size}
                                </label>
                                <input
                                  type="number"
                                  value={qty}
                                  min="0"
                                  onChange={(e) =>
                                    updateProductSize(
                                      product.id,
                                      size,
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-ink/30"
                                />
                              </div>
                            ))}
                          <div>
                            <label className="text-xs uppercase tracking-wider text-muted-foreground font-serif block mb-2">
                              Rental Available
                            </label>
                            <button
                              onClick={() =>
                                updateProduct(product.id, {
                                  rentalAvailable: !product.rentalAvailable,
                                })
                              }
                              className={`flex items-center gap-2 px-3 py-2 border text-sm transition-colors ${
                                product.rentalAvailable
                                  ? "bg-ink text-cream border-ink"
                                  : "bg-background text-muted-foreground border-border hover:border-ink/30"
                              }`}
                            >
                              {product.rentalAvailable ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                              {product.rentalAvailable ? "Yes" : "No"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderVendors = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {(vendors || []).map((vendor, i) => (
          <motion.div
            key={vendor.id || i}
            variants={fadeUp}
            custom={i}
            initial="hidden"
            animate="visible"
            className="bg-cream border border-border p-6 space-y-4"
          >
            <div>
              <h3 className="font-serif text-display text-lg text-foreground">
                {vendor.storeName || vendor.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {vendor.owner || vendor.email}
              </p>
            </div>
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Products</span>
                <span className="text-foreground font-serif">
                  {vendor.productsCount || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Sales</span>
                <span className="text-foreground font-serif">
                  ${(vendor.totalSales || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Commission</span>
                <span className="text-foreground font-serif">
                  {vendor.commission || 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending Payout</span>
                <span className="text-crimson font-serif">
                  ${(vendor.pendingPayout || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
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
          {["All", "Admin", "Vendor", "Customer"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-cream border border-border overflow-hidden">
        <div className="hidden md:grid grid-cols-4 gap-4 px-6 py-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-serif">
          <div>Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Joined</div>
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
                className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 px-6 py-4 hover:bg-secondary/50 transition-colors items-center"
              >
                <div className="text-sm font-serif text-foreground">
                  {u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email}
                </div>
                <div className="text-sm text-muted-foreground">{u.email}</div>
                <div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      u.role === "admin"
                        ? "bg-crimson/15 text-crimson border border-crimson/30"
                        : u.role === "vendor"
                        ? "bg-ink/10 text-ink border border-ink/20"
                        : "bg-secondary text-muted-foreground border border-border"
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {u.joinedDate
                    ? new Date(u.joinedDate).toLocaleDateString()
                    : "N/A"}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "orders":
        return renderOrders();
      case "products":
        return renderProducts();
      case "vendors":
        return renderVendors();
      case "users":
        return renderUsers();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row">
        {/* Mobile Tabs */}
        <div className="lg:hidden border-b border-border bg-cream overflow-x-auto">
          <div className="flex">
            {tabs.map((tab) => (
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
            <span className="eyblock text-xs uppercase tracking-[0.25em] text-muted-foreground font-serif">
              Admin Panel
            </span>
          </div>

          <nav className="space-y-1 flex-1">
            {tabs.map((tab) => (
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
            <p className="text-xs text-muted-foreground">
              Signed in as
            </p>
            <p className="text-sm text-foreground font-serif truncate">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
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
                {tabs.find((t) => t.id === activeTab)?.label}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your marketplace
              </p>
            </div>
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
