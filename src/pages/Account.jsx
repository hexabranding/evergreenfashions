import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";
import { parsePrice } from "@/data/products";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "orders", label: "Orders", icon: Package },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "wishlist", label: "Wishlist", icon: Heart },
];

const statusColors = {
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-amber-100 text-amber-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
  returned: "bg-red-100 text-red-700",
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
  const { getOrdersByUser } = useOrders();
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

  if (!user) return null;

  const orders = getOrdersByUser(user.id);

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
              </div>
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <motion.div key="orders" {...fadeSlide}>
              <h2 className="font-serif text-2xl text-foreground mb-6">Order History</h2>

              {orders.length === 0 ? (
                <div className="bg-secondary rounded-sm p-10 text-center">
                  <Package size={40} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">No orders yet</p>
                  <Link to="/shop" className="btn-ink px-6 py-2 text-sm rounded-sm inline-block">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <motion.div variants={listStagger} initial="initial" animate="animate" className="space-y-4">
                  {orders.map((order) => {
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
                                          Qty: {item.quantity} &middot; {parsePrice(item.price)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                  <p className="text-sm font-medium text-foreground">
                                    Total: {parsePrice(order.total)}
                                  </p>
                                  {order.status === "delivered" && (
                                    <button className="text-xs text-crimson hover:text-crimson/80 transition-colors underline">
                                      Request Return
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
                  <Link to="/shop" className="btn-ink px-6 py-2 text-sm rounded-sm inline-block">
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
    </div>
  );
}
