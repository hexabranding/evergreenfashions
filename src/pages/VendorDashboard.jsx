import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { allProducts, parsePrice } from "@/data/products";
import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "products", label: "Products", icon: Package },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "payouts", label: "Payouts", icon: DollarSign },
  { key: "settings", label: "Settings", icon: Edit2 },
];

const ORDER_STATUS_FLOW = ["confirmed", "preparing", "shipped", "delivered"];
const STATUS_COLORS = {
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-amber-100 text-amber-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  returned: "bg-red-100 text-red-800",
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

function StatCard({ icon: Icon, label, value, index }) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="bg-secondary border border-border/60 rounded-sm p-6 flex flex-col gap-3"
    >
      <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">
        <Icon size={18} className="text-ink" />
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
      {status}
    </span>
  );
}

function StockLevelInput({ size, qty, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground w-8">{size}</span>
      <input
        type="number"
        min={0}
        value={qty}
        onChange={(e) => onChange(size, parseInt(e.target.value) || 0)}
        className="w-20 bg-cream border border-border/60 rounded-sm px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ink/30"
      />
    </div>
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
  } = useOrders();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [orderFilter, setOrderFilter] = useState("all");
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [payoutRequested, setPayoutRequested] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    storeName: "",
    description: "",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

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

  const vendor = getVendorByUserId(currentUser.id);
  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-6 text-crimson" />
          <h1 className="text-display text-4xl mb-4">Vendor Not Found</h1>
          <p className="text-muted-foreground mb-8">
            Your vendor profile could not be located.
          </p>
          <Link to="/" className="btn-ink px-8 py-3 text-sm tracking-widest uppercase">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const vendorProducts = allProducts.filter((p) => p.vendorId === vendor.id);
  const vendorOrders = getOrdersByVendor(vendor.id);
  const recentOrders = [...vendorOrders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const filteredOrders = orderFilter === "all"
    ? vendorOrders
    : vendorOrders.filter((o) => o.status === orderFilter);
  const sortedFilteredOrders = [...filteredOrders].sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalRevenue = vendor.totalEarnings;
  const pendingOrders = vendorOrders.filter((o) => o.status !== "delivered" && o.status !== "returned").length;

  const mockPayouts = [
    { id: "po-1", date: "2026-06-28", amount: 4200, status: "completed" },
    { id: "po-2", date: "2026-06-14", amount: 3850, status: "completed" },
    { id: "po-3", date: "2026-05-30", amount: 5100, status: "completed" },
    { id: "po-4", date: "2026-05-15", amount: 2900, status: "completed" },
    { id: "po-5", date: "2026-04-30", amount: 3400, status: "completed" },
  ];

  const initSettings = () => {
    if (!settingsForm.storeName) {
      setSettingsForm({
        storeName: currentUser.vendorStore?.name || vendor.storeName,
        description: currentUser.vendorStore?.description || vendor.description,
      });
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateProfile({
      vendorStore: {
        ...currentUser.vendorStore,
        name: settingsForm.storeName,
        description: settingsForm.description,
      },
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleStockChange = (productId, size, qty) => {
    inventory[productId] = { ...inventory[productId], [size]: qty };
  };

  const handleNextStatus = (orderId, currentStatus) => {
    const idx = ORDER_STATUS_FLOW.indexOf(currentStatus);
    if (idx >= 0 && idx < ORDER_STATUS_FLOW.length - 1) {
      updateOrderStatus(orderId, ORDER_STATUS_FLOW[idx + 1]);
    }
  };

  const renderOverview = () => (
    <div className="space-y-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard icon={TrendingUp} label="Total Sales" value={vendor.totalSales.toLocaleString()} index={0} />
        <StatCard icon={DollarSign} label="Revenue" value={parsePrice(totalRevenue)} index={1} />
        <StatCard icon={Clock} label="Pending Orders" value={pendingOrders} index={2} />
        <StatCard icon={Package} label="Active Products" value={vendorProducts.length} index={3} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
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

      <div className="flex flex-wrap gap-4 pt-4 border-t border-border/60">
        <button onClick={() => setActiveTab("products")} className="btn-ink px-6 py-2.5 text-xs tracking-widest uppercase">
          View Products
        </button>
        <button onClick={() => setActiveTab("orders")} className="btn-ink-hover px-6 py-2.5 text-xs tracking-widest uppercase border border-border/60 text-foreground">
          View Orders
        </button>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <h2 className="eyebrow">Your Products</h2>
      {vendorProducts.length === 0 ? (
        <p className="text-muted-foreground text-sm">No products found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {vendorProducts.map((product) => {
            const stock = inventory[product.slug || product.id] || {};
            const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);
            const isExpanded = expandedProduct === product.id;
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
                      <span className="font-medium text-foreground">{Math.floor(Math.random() * 800 + 200)}</span>
                      <p>Views</p>
                    </div>
                    <div>
                      <ShoppingBag size={14} className="mx-auto mb-1 opacity-60" />
                      <span className="font-medium text-foreground">{Math.floor(Math.random() * 40 + 5)}</span>
                      <p>Orders</p>
                    </div>
                    <div>
                      <DollarSign size={14} className="mx-auto mb-1 opacity-60" />
                      <span className="font-medium text-foreground">{parsePrice(Math.floor(product.price * (Math.random() * 30 + 5)))}</span>
                      <p>Revenue</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                    className="w-full text-xs tracking-widest uppercase py-2 border border-border/60 text-muted-foreground hover:text-foreground hover:border-ink/30 transition-colors"
                  >
                    {isExpanded ? "Collapse" : "Manage Stock"}
                  </button>

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
                          <p className="text-xs font-medium text-foreground uppercase tracking-wider">Stock Levels</p>
                          {product.sizes.map((size) => (
                            <StockLevelInput
                              key={size}
                              size={size}
                              qty={stock[size] ?? 0}
                              onChange={(s, q) => handleStockChange(product.id, s, q)}
                            />
                          ))}
                          <div className="flex items-center justify-between pt-3">
                            <span className="text-xs text-muted-foreground">
                              Rental: {product.rentalAvailable ? `€${product.rentalPricePerDay}/day` : "Not available"}
                            </span>
                            <button className="text-xs text-crimson underline underline-offset-2">
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

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="eyebrow mr-4">Orders</h2>
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
          </button>
        ))}
      </div>

      {sortedFilteredOrders.length === 0 ? (
        <p className="text-muted-foreground text-sm">No orders match this filter.</p>
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

  const renderPayouts = () => (
    <div className="space-y-10">
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-secondary border border-border/60 rounded-sm p-6">
          <p className="eyebrow mb-3">Total Earnings</p>
          <p className="text-display text-3xl">{parsePrice(vendor.totalEarnings)}</p>
        </div>
        <div className="bg-secondary border border-border/60 rounded-sm p-6">
          <p className="eyebrow mb-3">Pending Payout</p>
          <p className="text-display text-3xl">{parsePrice(vendor.pendingPayout)}</p>
        </div>
        <div className="bg-secondary border border-border/60 rounded-sm p-6">
          <p className="eyebrow mb-3">Commission Rate</p>
          <p className="text-display text-3xl">{vendor.commission}%</p>
        </div>
      </div>

      <div>
        <h2 className="eyebrow mb-6">Payout History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Date</th>
                <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Payout ID</th>
                <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockPayouts.map((payout) => (
                <tr key={payout.id} className="border-b border-border/30">
                  <td className="py-3 px-4 text-foreground">
                    {new Date(payout.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{payout.id}</td>
                  <td className="py-3 px-4 text-foreground">{parsePrice(payout.amount)}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 capitalize">
                      <CheckCircle size={12} />
                      {payout.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={() => setPayoutRequested(true)}
          className="btn-ink px-8 py-3 text-xs tracking-widest uppercase"
        >
          Request Payout
        </button>
      </div>

      <AnimatePresence>
        {payoutRequested && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-8 right-8 bg-ink text-cream px-6 py-4 rounded-sm shadow-2xl flex items-center gap-3 z-50"
          >
            <CheckCircle size={20} className="text-emerald-400" />
            <div>
              <p className="font-medium text-sm">Payout Requested</p>
              <p className="text-xs text-cream/70">Your payout request has been submitted for review.</p>
            </div>
            <button onClick={() => setPayoutRequested(false)} className="ml-4 text-cream/50 hover:text-cream">
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderSettings = () => {
    if (!settingsForm.storeName) initSettings();

    return (
      <div className="max-w-2xl space-y-10">
        <form onSubmit={handleSaveSettings} className="space-y-8">
          <div>
            <h2 className="eyebrow mb-6">Store Information</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Store Name</label>
                <input
                  type="text"
                  value={settingsForm.storeName}
                  onChange={(e) => setSettingsForm((p) => ({ ...p, storeName: e.target.value }))}
                  className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Description</label>
                <textarea
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm((p) => ({ ...p, description: e.target.value }))}
                  rows={4}
                  className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" className="btn-ink px-8 py-3 text-xs tracking-widest uppercase">
              Save Changes
            </button>
            <AnimatePresence>
              {settingsSaved && (
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
          <h2 className="eyebrow mb-6">Commission</h2>
          <div className="bg-secondary border border-border/60 rounded-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platform Commission Rate</p>
                <p className="text-display text-2xl mt-1">{vendor.commission}%</p>
              </div>
              <span className="text-xs text-muted-foreground bg-cream px-3 py-1.5 rounded-full">Read-only</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 pt-8">
          <h2 className="eyebrow mb-6">Store Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="bg-secondary border border-border/60 rounded-sm p-5">
              <p className="text-xs text-muted-foreground mb-1">Avg. Order Value</p>
              <p className="font-serif text-foreground">
                {vendorOrders.length > 0
                  ? parsePrice(Math.round(totalRevenue / vendorOrders.length))
                  : "€0"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const tabContent = {
    overview: renderOverview,
    products: renderProducts,
    orders: renderOrders,
    payouts: renderPayouts,
    settings: renderSettings,
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
