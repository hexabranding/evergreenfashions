import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Package,
  MapPin,
  Heart,
  LogOut,
  Edit2,
  Plus,
  Trash2,
  Check,
  Star,
  Calendar,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";
import { authApi } from "@/api/auth";
import { parsePrice } from "@/data/products";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "orders", label: "Orders", icon: Package },
  { id: "rentals", label: "Rental Orders", icon: Calendar },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "wishlist", label: "Wishlist", icon: Heart },
];

const statusColors = {
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-amber-100 text-amber-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
  returned: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
  return_requested: "bg-amber-100 text-amber-700",
  pending_return: "bg-amber-100 text-amber-700",
  awaiting_inspection: "bg-yellow-100 text-yellow-700",
  inspected: "bg-blue-100 text-blue-700",
  deposit_refunded: "bg-emerald-100 text-emerald-700",
  completed: "bg-gray-100 text-gray-700",
};

const statusSteps = ["confirmed", "preparing", "shipped", "delivered"];

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3, ease: "easeInOut" },
};

const listStagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const listItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

export default function Account() {
  const { currentUser: user, updateProfile, addAddress, removeAddress, setDefaultAddress, logout } = useAuth();
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const { getOrdersByUser, fetchCustomerOrders, customerApiOrders, cancelOrderApi, requestReturn, rentalStatusSteps } = useOrders();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: "",
    street: "",
    city: "",
    zip: "",
    country: "",
    isDefault: false,
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [returnOrderId, setReturnOrderId] = useState(null);
  const [returnReason, setReturnReason] = useState("");

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCustomerOrders();
      const interval = setInterval(() => fetchCustomerOrders(), 15000);
      return () => clearInterval(interval);
    }
  }, [user, fetchCustomerOrders]);

  const orders = useMemo(() => {
    const localOrders = getOrdersByUser(user?.id) || [];
    const apiOrders = (customerApiOrders || []).filter((o) => {
      const uid = o.userId || o.user;
      return uid === user?.id;
    });
    const byId = {};
    [...localOrders, ...apiOrders].forEach((o) => {
      const key = o.id || o._id;
      if (key && !byId[key]) byId[key] = o;
    });
    return Object.values(byId).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [getOrdersByUser, customerApiOrders, user]);

  const rentalOrders = useMemo(() => orders.filter((o) => o.rentalDetails), [orders]);
  const normalOrders = useMemo(() => orders.filter((o) => !o.rentalDetails), [orders]);

  if (!user) return null;

  const handleProfileSave = () => {
    updateProfile(profileForm);
    setEditingProfile(false);
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (editingAddress) {
      addAddress({ ...addressForm, id: editingAddress.id });
    } else {
      addAddress(addressForm);
    }
    resetAddressForm();
  };

  const resetAddressForm = () => {
    setAddressForm({ label: "", street: "", city: "", zip: "", country: "", isDefault: false });
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const handleEditAddress = (addr) => {
    setAddressForm(addr);
    setEditingAddress(addr);
    setShowAddressForm(true);
  };

  const handleMoveToCart = (item) => {
    addToCart(item);
    toggleWishlist(item);
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError("Both current and new password are required");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (err) {
      setPasswordError(err.message || "Failed to change password");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="eyebrow mb-2">My Account</p>
          <h1 className="font-serif text-display text-3xl sm:text-4xl text-foreground">
            Welcome back, {user.firstName}
          </h1>
        </motion.div>

        {/* Tabs */}
        <div className="flex overflow-x-auto pb-px mb-8 border-b border-border -mx-4 px-4 sm:mx-0 sm:px-0 sm:gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-crimson whitespace-nowrap ml-auto"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div key="profile" {...fadeSlide}>
              <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-2xl text-foreground">Personal Information</h2>
                  <button
                    onClick={() => setEditingProfile(!editingProfile)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 size={14} />
                    {editingProfile ? "Cancel" : "Edit"}
                  </button>
                </div>

                <div className="bg-secondary rounded-sm p-6 sm:p-8 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                        First Name
                      </label>
                      {editingProfile ? (
                        <input
                          type="text"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ink transition-colors"
                        />
                      ) : (
                        <p className="text-foreground text-sm">{user.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                        Last Name
                      </label>
                      {editingProfile ? (
                        <input
                          type="text"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ink transition-colors"
                        />
                      ) : (
                        <p className="text-foreground text-sm">{user.lastName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                        Email
                      </label>
                      {editingProfile ? (
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ink transition-colors"
                        />
                      ) : (
                        <p className="text-foreground text-sm">{user.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                        Phone
                      </label>
                      {editingProfile ? (
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ink transition-colors"
                        />
                      ) : (
                        <p className="text-foreground text-sm">{user.phone || "Not set"}</p>
                      )}
                    </div>
                  </div>

                  {editingProfile && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <button
                        onClick={handleProfileSave}
                        className="btn-ink px-6 py-2 text-sm rounded-sm"
                      >
                        Save Changes
                      </button>
                    </motion.div>
                  )}
                </div>

                <div className="mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-2xl text-foreground">Change Password</h2>
                    <button
                      onClick={() => { setShowPasswordChange(!showPasswordChange); setPasswordError(""); setPasswordSuccess(""); }}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Lock size={14} />
                      {showPasswordChange ? "Cancel" : "Change Password"}
                    </button>
                  </div>

                  {showPasswordChange && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-secondary rounded-sm p-6 sm:p-8 space-y-5"
                    >
                      {passwordError && (
                        <div className="bg-crimson/10 border border-crimson/20 px-4 py-3 text-sm text-crimson">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                          {passwordSuccess}
                        </div>
                      )}
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ink transition-colors"
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ink transition-colors"
                          placeholder="Enter new password (min 6 characters)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ink transition-colors"
                          placeholder="Confirm new password"
                        />
                      </div>
                      <button
                        onClick={handlePasswordChange}
                        className="btn-ink px-6 py-2 text-sm rounded-sm"
                      >
                        Update Password
                      </button>
                    </motion.div>
                  )}
                </div>

                {(user.role === "vendor" || user.role === "admin") && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-serif text-2xl text-foreground">Danger Zone</h2>
                    </div>
                    <div className="bg-crimson/5 border border-crimson/20 rounded-sm p-6 sm:p-8">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-serif text-lg text-foreground mb-1">Delete Account</h3>
                          <p className="text-sm text-muted-foreground">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                              authApi.deleteAccount().then(() => {
                                logout();
                                navigate("/");
                              }).catch(() => {
                                alert("Failed to delete account");
                              });
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 border border-crimson/30 text-crimson text-xs uppercase tracking-widest hover:bg-crimson/10 transition-colors whitespace-nowrap"
                        >
                          <Trash2 size={14} /> Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <motion.div key="orders" {...fadeSlide}>
              <h2 className="font-serif text-2xl text-foreground mb-6">Order History</h2>

              {normalOrders.length === 0 ? (
                <div className="bg-secondary rounded-sm p-10 text-center">
                  <Package size={40} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">No orders yet</p>
                  <Link to="/collection" className="btn-ink px-6 py-2 text-sm rounded-sm inline-block">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <motion.div variants={listStagger} initial="initial" animate="animate" className="space-y-4">
                  {normalOrders.map((order) => {
                    const isExpanded = expandedOrder === order.id;
                    const currentStep = statusSteps.indexOf(order.status);
                    return (
                      <motion.div
                        key={order.id}
                        variants={listItem}
                        className="bg-secondary rounded-sm overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="w-full p-5 flex flex-col sm:flex-row sm:items-center gap-3 text-left hover:bg-secondary/80 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-medium text-foreground">
                                Order #{order.id}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-sm text-foreground font-medium">
                              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {parsePrice(order.total)}
                            </p>
                          </div>
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
                              <div className="px-5 pb-5 border-t border-border pt-4">
                                {/* Status Timeline */}
                                <div className="flex items-center gap-0 mb-6">
                                  {statusSteps.map((step, i) => (
                                    <div key={step} className="flex-1 flex items-center">
                                      <div className="flex flex-col items-center flex-shrink-0">
                                        <div
                                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                            i <= currentStep
                                              ? "bg-ink text-cream"
                                              : "bg-border text-muted-foreground"
                                          }`}
                                        >
                                          {i <= currentStep ? <Check size={12} /> : i + 1}
                                        </div>
                                        <span className="text-[10px] mt-1 capitalize text-muted-foreground hidden sm:block">
                                          {step}
                                        </span>
                                      </div>
                                      {i < statusSteps.length - 1 && (
                                        <div
                                          className={`flex-1 h-px mx-1 ${
                                            i < currentStep ? "bg-ink" : "bg-border"
                                          }`}
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Order Items */}
                                <div className="space-y-3 mb-4">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                      <div className="w-12 h-14 bg-background rounded-sm overflow-hidden flex-shrink-0">
                                        {item.image && (
                                          <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                          />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground truncate">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Qty: {item.quantity}{(item.selectedSize || item.size) && ` · Size: ${item.selectedSize || item.size}`}{(item.selectedColor || item.color) && ` · ${item.selectedColor || item.color}`} · {parsePrice(item.price)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Timeline History */}
                                {order.timeline && order.timeline.length > 0 && (
                                  <div className="mb-6">
                                    <h4 className="text-xs font-serif uppercase tracking-widest text-muted-foreground mb-4">Order History & Updates</h4>
                                    <div className="space-y-4">
                                      {order.timeline.map((event, idx) => (
                                        <div key={idx} className="flex gap-4">
                                          <div className="relative flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 rounded-full bg-ink flex-shrink-0 mt-1" />
                                            {idx !== order.timeline.length - 1 && (
                                              <div className="w-px h-full bg-border absolute top-3.5" />
                                            )}
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-foreground capitalize">{event.status.replace(/_/g, " ")}</p>
                                            {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                                            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                                              {new Date(event.date).toLocaleString()}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                  <p className="text-sm font-medium text-foreground">
                                    Total: {parsePrice(order.total)}
                                  </p>
                                  <div className="flex items-center gap-3">
                                    {order.status !== "cancelled" && order.status !== "delivered" && order.status !== "returned" && order.status !== "return_requested" && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setCancelOrderId(order.id); setCancelReason(""); }}
                                        className="text-xs text-crimson hover:text-crimson/80 transition-colors underline"
                                      >
                                        Cancel Delivery
                                      </button>
                                    )}
                                    {order.status === "delivered" && !order.returnRequested && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setReturnOrderId(order.id); setReturnReason(""); }}
                                        className="text-xs text-crimson hover:text-crimson/80 transition-colors underline"
                                      >
                                        Request Return
                                      </button>
                                    )}
                                    {order.status === "return_requested" && (
                                      <span className="text-xs text-amber-600 font-medium">Return Requested — Awaiting Confirmation</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Rental Orders Tab */}
          {activeTab === "rentals" && (
            <motion.div key="rentals" {...fadeSlide}>
              <h2 className="font-serif text-2xl text-foreground mb-6">Rental Orders</h2>

              {rentalOrders.length === 0 ? (
                <div className="bg-secondary rounded-sm p-10 text-center">
                  <Calendar size={40} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">No rental orders yet</p>
                  <Link to="/rentals" className="btn-ink px-6 py-2 text-sm rounded-sm inline-block">
                    Browse Rentals
                  </Link>
                </div>
              ) : (
                <motion.div variants={listStagger} initial="initial" animate="animate" className="space-y-4">
                  {rentalOrders.map((order) => {
                    const isExpanded = expandedOrder === order.id;
                    const rentalStepIds = rentalStatusSteps.map((s) => s.id);
                    const currentRentalStep = rentalStepIds.indexOf(order.rentalStatus || order.status);
                    return (
                      <motion.div
                        key={order.id}
                        variants={listItem}
                        className="bg-secondary rounded-sm overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="w-full p-5 flex flex-col sm:flex-row sm:items-center gap-3 text-left hover:bg-secondary/80 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-medium text-foreground">
                                Rental #{order.id}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[order.rentalStatus || order.status] || "bg-gray-100 text-gray-600"}`}>
                                {(order.rentalStatus || order.status)?.replace("_", " ")}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-sm text-foreground font-medium">
                              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {parsePrice(order.total)}
                            </p>
                          </div>
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
                              <div className="px-5 pb-5 border-t border-border pt-4">
                                {/* Rental Details */}
                                {order.rentalDetails && (
                                  <div className="bg-background rounded-sm p-4 mb-4">
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
                                          <p className="text-foreground">{parsePrice(order.rentalDetails.pricePerDay)}</p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                      <div>
                                        <p className="text-muted-foreground text-xs">Security Deposit</p>
                                        <p className="text-foreground">{parsePrice(order.deposit || 100)}</p>
                                      </div>
                                      {order.depositRefunded && (
                                        <div>
                                          <p className="text-muted-foreground text-xs">Deposit Refunded</p>
                                          <p className="text-emerald-600 font-medium">{parsePrice(order.refundAmount)}</p>
                                        </div>
                                      )}
                                      {order.returnRequested && (
                                        <div>
                                          <p className="text-muted-foreground text-xs">Rental Status</p>
                                          <p className="text-amber-600 font-medium capitalize">{order.rentalStatus?.replace("_", " ") || "pending_return"}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Rental Return Roadmap - 10 Step Lifecycle */}
                                <div className="mb-6">
                                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Return Roadmap</p>
                                  <div className="flex items-center gap-0 overflow-x-auto pb-2">
                                    {rentalStatusSteps.map((step, i) => {
                                      const isCompleted = i <= currentRentalStep;
                                      const isCurrent = i === currentRentalStep;
                                      return (
                                        <div key={step.id} className="flex-1 min-w-[70px] flex items-center">
                                          <div className="flex flex-col items-center flex-shrink-0">
                                            <div
                                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
                                                isCompleted
                                                  ? "bg-ink text-cream"
                                                  : isCurrent
                                                  ? "bg-ink/20 text-ink border-2 border-ink"
                                                  : "bg-border text-muted-foreground"
                                              }`}
                                            >
                                              {isCompleted ? <Check size={12} /> : step.icon}
                                            </div>
                                            <span className={`text-[9px] mt-1 text-center leading-tight hidden sm:block ${isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                              {step.label}
                                            </span>
                                          </div>
                                          {i < rentalStatusSteps.length - 1 && (
                                            <div
                                              className={`flex-1 h-px mx-0.5 ${
                                                i < currentRentalStep ? "bg-ink" : "bg-border"
                                              }`}
                                            />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-3 mb-4">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                      <div className="w-12 h-14 bg-background rounded-sm overflow-hidden flex-shrink-0">
                                        {item.image && (
                                          <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                          />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground truncate">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Qty: {item.quantity}{(item.selectedSize || item.size) && ` · Size: ${item.selectedSize || item.size}`}{(item.selectedColor || item.color) && ` · ${item.selectedColor || item.color}`} · {parsePrice(item.price)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Timeline History */}
                                {order.timeline && order.timeline.length > 0 && (
                                  <div className="mb-6">
                                    <h4 className="text-xs font-serif uppercase tracking-widest text-muted-foreground mb-4">Order History & Updates</h4>
                                    <div className="space-y-4">
                                      {order.timeline.map((event, idx) => (
                                        <div key={idx} className="flex gap-4">
                                          <div className="relative flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 rounded-full bg-ink flex-shrink-0 mt-1" />
                                            {idx !== order.timeline.length - 1 && (
                                              <div className="w-px h-full bg-border absolute top-3.5" />
                                            )}
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-foreground capitalize">{event.status.replace(/_/g, " ")}</p>
                                            {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                                            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                                              {new Date(event.date).toLocaleString()}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                  <p className="text-sm font-medium text-foreground">
                                    Total: {parsePrice(order.total)}
                                  </p>
                                  <div className="flex items-center gap-3">
                                    {order.status !== "cancelled" && order.status !== "delivered" && order.status !== "returned" && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setCancelOrderId(order.id); setCancelReason(""); }}
                                        className="text-xs text-crimson hover:text-crimson/80 transition-colors underline"
                                      >
                                        Cancel Delivery
                                      </button>
                                    )}
                                    {order.status === "delivered" && !order.returnRequested && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setReturnOrderId(order.id); setReturnReason(""); }}
                                        className="text-xs text-crimson hover:text-crimson/80 transition-colors underline"
                                      >
                                        Request Return
                                      </button>
                                    )}
                                    {order.returnRequested && (
                                      <span className="text-xs text-amber-600 font-medium">Return Requested — Awaiting Inspection</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <motion.div key="addresses" {...fadeSlide}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl text-foreground">Saved Addresses</h2>
                {!showAddressForm && (
                  <button
                    onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                    className="flex items-center gap-1.5 btn-ink px-4 py-2 text-sm rounded-sm"
                  >
                    <Plus size={14} />
                    Add Address
                  </button>
                )}
              </div>

              {/* Address Form */}
              <AnimatePresence>
                {showAddressForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddressSubmit}
                    className="bg-secondary rounded-sm p-6 mb-6 overflow-hidden"
                  >
                    <h3 className="font-serif text-lg text-foreground mb-4">
                      {editingAddress ? "Edit Address" : "New Address"}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                          Label
                        </label>
                        <input
                          type="text"
                          placeholder="Home, Office..."
                          value={addressForm.label}
                          onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                          required
                          className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ink transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                          Street
                        </label>
                        <input
                          type="text"
                          value={addressForm.street}
                          onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                          required
                          className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ink transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                          City
                        </label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          required
                          className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ink transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                          ZIP / Postal Code
                        </label>
                        <input
                          type="text"
                          value={addressForm.zip}
                          onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                          required
                          className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ink transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                          Country
                        </label>
                        <input
                          type="text"
                          value={addressForm.country}
                          onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                          required
                          className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ink transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-6 mb-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                          className="w-4 h-4 accent-ink"
                        />
                        <span className="text-sm text-foreground">Set as default</span>
                      </label>
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="btn-ink px-5 py-2 text-sm rounded-sm">
                        {editingAddress ? "Update Address" : "Save Address"}
                      </button>
                      <button
                        type="button"
                        onClick={resetAddressForm}
                        className="px-5 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Address List */}
              {!user.addresses || user.addresses.length === 0 ? (
                <div className="bg-secondary rounded-sm p-10 text-center">
                  <MapPin size={40} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No saved addresses</p>
                </div>
              ) : (
                <motion.div
                  variants={listStagger}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {user.addresses.map((addr) => (
                    <motion.div
                      key={addr.id}
                      variants={listItem}
                      className={`bg-secondary rounded-sm p-5 relative ${
                        addr.isDefault ? "ring-1 ring-ink" : ""
                      }`}
                    >
                      {addr.isDefault && (
                        <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider bg-ink text-cream px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                        {addr.label}
                      </p>
                      <p className="text-sm text-foreground">{addr.street}</p>
                      <p className="text-sm text-foreground">
                        {addr.city}, {addr.zip}
                      </p>
                      <p className="text-sm text-foreground mb-4">{addr.country}</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEditAddress(addr)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => removeAddress(addr.id)}
                          className="text-xs text-muted-foreground hover:text-crimson transition-colors flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                        {!addr.isDefault && (
                          <button
                            onClick={() => setDefaultAddress(addr.id)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 ml-auto"
                          >
                            <Star size={12} />
                            Set Default
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Wishlist Tab */}
          {activeTab === "wishlist" && (
            <motion.div key="wishlist" {...fadeSlide}>
              <h2 className="font-serif text-2xl text-foreground mb-6">Wishlist</h2>

              {wishlist.length === 0 ? (
                <div className="bg-secondary rounded-sm p-10 text-center">
                  <Heart size={40} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
                  <Link to="/collection" className="btn-ink px-6 py-2 text-sm rounded-sm inline-block">
                    Browse Collection
                  </Link>
                </div>
              ) : (
                <motion.div
                  variants={listStagger}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {wishlist.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={listItem}
                      layout
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-secondary rounded-sm overflow-hidden group"
                    >
                      <Link to={`/product/${item.id}`} className="block aspect-[3/4] bg-background overflow-hidden">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </Link>
                      <div className="p-4">
                        <Link
                          to={`/product/${item.id}`}
                          className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors block truncate"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-0.5">{parsePrice(item.price)}</p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleMoveToCart(item)}
                            className="btn-ink px-3 py-1.5 text-xs rounded-sm flex-1"
                          >
                            Move to Cart
                          </button>
                          <button
                            onClick={() => toggleWishlist(item)}
                            className="p-1.5 text-muted-foreground hover:text-crimson border border-border rounded-sm transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cancel Order Modal */}
      <AnimatePresence>
        {cancelOrderId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
            onClick={() => setCancelOrderId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-border w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-4">
                <h3 className="font-serif text-lg text-foreground">Cancel Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Please provide a reason for cancelling this order. This helps us improve our service.
                </p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation..."
                  rows={3}
                  className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ink transition-colors resize-none"
                />
              </div>
              <div className="flex border-t border-border">
                <button
                  onClick={() => setCancelOrderId(null)}
                  className="flex-1 px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={() => {
                    cancelOrderApi(cancelOrderId, cancelReason);
                    setCancelOrderId(null);
                    setCancelReason("");
                  }}
                  className="flex-1 px-4 py-3 text-xs uppercase tracking-widest text-crimson hover:bg-crimson/5 transition-colors border-l border-border"
                >
                  Confirm Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return Request Modal */}
      <AnimatePresence>
        {returnOrderId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
            onClick={() => setReturnOrderId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-border w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-4">
                <h3 className="font-serif text-lg text-foreground">Request Return</h3>
                <p className="text-sm text-muted-foreground">
                  Please provide a reason for returning this order. Our team will review your request.
                </p>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Reason for return..."
                  rows={3}
                  className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ink transition-colors resize-none"
                />
              </div>
              <div className="flex border-t border-border">
                <button
                  onClick={() => setReturnOrderId(null)}
                  className="flex-1 px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    requestReturn(returnOrderId, returnReason);
                    setReturnOrderId(null);
                    setReturnReason("");
                  }}
                  className="flex-1 px-4 py-3 text-xs uppercase tracking-widest text-crimson hover:bg-crimson/5 transition-colors border-l border-border"
                >
                  Confirm Return
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
