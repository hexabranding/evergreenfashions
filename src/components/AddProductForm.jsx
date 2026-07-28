import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { colorMap, parsePrice } from "@/data/products";
import {
  Package,
  Image,
  X,
  Plus,
  Trash2,
  Check,
  Upload,
  DollarSign,
  Tag,
  Palette,
  Ruler,
  Hash,
  Repeat,
} from "lucide-react";

const ALL_COLORS = Object.keys(colorMap);

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL"];
const SHOE_SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
const MENSWEAR_SIZES = ["S", "M", "L", "XL", "XXL"];

const SIZE_PRESETS = {
  Standard: DEFAULT_SIZES,
  Shoes: SHOE_SIZES,
  Menswear: MENSWEAR_SIZES,
  OneSize: ["One Size"],
  Custom: [],
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

export default function AddProductForm({ categories, vendors, onSave, onCancel, editProduct }) {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: editProduct?.name || "",
    category: editProduct?.category || "",
    price: editProduct?.price || "",
    description: editProduct?.description || "",
    gender: editProduct?.gender || "Womenswear",
    rentalAvailable: editProduct?.rentalAvailable || false,
    rentalPricePerDay: editProduct?.rentalPricePerDay || "",
    sizes: editProduct?.sizes || [...DEFAULT_SIZES],
    sizePreset: "Standard",
    colors: editProduct?.colors || [],
    images: editProduct?.images || [],
    stock: editProduct?.stock || {},
    vendorId: editProduct?.vendorId || editProduct?.vendor || "",
  });

  const [imagePreviews, setImagePreviews] = useState(
    editProduct?.images?.map((img) => (typeof img === "string" ? img : null)).filter(Boolean) || []
  );
  const [customSize, setCustomSize] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target.result]);
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, ev.target.result],
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSizePreset = (preset) => {
    const sizes = SIZE_PRESETS[preset];
    setForm((prev) => ({
      ...prev,
      sizePreset: preset,
      sizes: sizes || prev.sizes,
      stock: sizes
        ? sizes.reduce((acc, s) => ({ ...acc, [s]: prev.stock[s] || 0 }), {})
        : prev.stock,
    }));
  };

  const addCustomSize = () => {
    if (!customSize.trim() || form.sizes.includes(customSize.trim())) return;
    const newSize = customSize.trim();
    setForm((prev) => ({
      ...prev,
      sizePreset: "Custom",
      sizes: [...prev.sizes, newSize],
      stock: { ...prev.stock, [newSize]: 0 },
    }));
    setCustomSize("");
  };

  const removeSize = (size) => {
    setForm((prev) => {
      const newStock = { ...prev.stock };
      delete newStock[size];
      return {
        ...prev,
        sizes: prev.sizes.filter((s) => s !== size),
        stock: newStock,
      };
    });
  };

  const toggleColor = (color) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
  };

  const updateStock = (size, qty) => {
    setForm((prev) => ({
      ...prev,
      stock: { ...prev.stock, [size]: Math.max(0, parseInt(qty) || 0) },
    }));
  };

  const totalStock = Object.values(form.stock).reduce((a, b) => a + b, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price || form.images.length === 0) return;

    const product = {
      id: editProduct?.id || `product-${Date.now()}`,
      name: form.name,
      category: form.category,
      price: parseFloat(form.price) || 0,
      description: form.description,
      gender: form.gender,
      colors: form.colors,
      sizes: form.sizes,
      stock: form.stock,
      rentalAvailable: form.rentalAvailable,
      rentalPricePerDay: form.rentalAvailable ? parseFloat(form.rentalPricePerDay) || 0 : 0,
      images: form.images,
      img: form.images[0] || null,
      tag: form.category,
      vendorId: form.vendorId || editProduct?.vendorId || "ef-main",
    };

    onSave(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="bg-secondary border border-border/60 rounded-sm p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-foreground">
            {editProduct ? "Edit Product" : "Add New Product"}
          </h3>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Product Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                placeholder="e.g. Silk Evening Gown"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                  required
                >
                  <option value="">Select category</option>
                  {categories?.map((cat) => (
                    <option key={cat.id || cat} value={cat.name || cat}>
                      {cat.name || cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                  className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                >
                  <option value="Womenswear">Womenswear</option>
                  <option value="Menswear">Menswear</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>
            </div>

            {vendors && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Vendor *</label>
                <select
                  value={form.vendorId}
                  onChange={(e) => setForm((p) => ({ ...p, vendorId: e.target.value }))}
                  className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                  required
                >
                  <option value="">Select vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id || v.userId} value={v.id || v.userId}>
                      {v.storeName || v.name || v.id}
                    </option>
                  ))}
                </select>
              </div>
            )}


            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Price (€) *</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  className="w-full bg-cream border border-border/60 rounded-sm pl-9 pr-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
                className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30 resize-none"
                placeholder="Describe the product..."
              />
            </div>

            <div className="border-t border-border/40 pt-6">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={form.rentalAvailable}
                  onChange={(e) => setForm((p) => ({ ...p, rentalAvailable: e.target.checked }))}
                  className="w-4 h-4 accent-ink"
                />
                <div className="flex items-center gap-2">
                  <Repeat size={14} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Available for Rental</span>
                </div>
              </label>
              <AnimatePresence>
                {form.rentalAvailable && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Rental Price per Day (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.rentalPricePerDay}
                      onChange={(e) => setForm((p) => ({ ...p, rentalPricePerDay: e.target.value }))}
                      className="w-full bg-cream border border-border/60 rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
                      placeholder="0"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Product Images *</label>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {imagePreviews.map((preview, i) => (
                  <div key={i} className="relative aspect-square bg-cream border border-border/60 rounded-sm overflow-hidden group">
                    <img src={preview} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-ink/80 text-cream rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-1 left-1 bg-ink text-cream text-[9px] px-1.5 py-0.5 rounded-sm font-medium">
                        Main
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square bg-cream border-2 border-dashed border-border/60 rounded-sm flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-ink/30 transition-colors"
                >
                  <Upload size={20} />
                  <span className="text-[10px] uppercase tracking-wider">Upload</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-[11px] text-muted-foreground">Upload at least one product photo. The first image will be the main image.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Palette size={12} />
                  Available Colors
                </label>
                <span className="text-xs text-muted-foreground">{form.colors.length} selected</span>
              </div>
              <div className="bg-cream border border-border/60 rounded-sm p-3">
                <div className="flex flex-wrap gap-2">
                  {ALL_COLORS.map((color) => {
                    const isSelected = form.colors.includes(color);
                    const hex = colorMap[color];
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleColor(color)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs border transition-all ${
                          isSelected
                            ? "border-ink bg-ink text-cream"
                            : "border-border/60 text-foreground hover:border-ink/30 bg-background"
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        {color}
                        {isSelected && <Check size={10} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Ruler size={12} />
                  Sizes & Stock
                </label>
                <span className="text-xs text-muted-foreground">Total: {totalStock} units</span>
              </div>

              <div className="flex gap-2 mb-3">
                {Object.keys(SIZE_PRESETS).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSizePreset(preset)}
                    className={`text-[10px] tracking-wider uppercase px-2.5 py-1.5 rounded-sm border transition-colors ${
                      form.sizePreset === preset
                        ? "bg-ink text-cream border-ink"
                        : "bg-transparent text-muted-foreground border-border/60 hover:border-ink/30"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="bg-cream border border-border/60 rounded-sm p-3 space-y-2">
                {form.sizes.map((size) => (
                  <div key={size} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground w-10">{size}</span>
                    <input
                      type="number"
                      min={0}
                      value={form.stock[size] ?? 0}
                      onChange={(e) => updateStock(size, e.target.value)}
                      className="w-20 bg-background border border-border/60 rounded-sm px-3 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ink/30"
                    />
                    <span className="text-[11px] text-muted-foreground">units</span>
                    <button
                      type="button"
                      onClick={() => removeSize(size)}
                      className="ml-auto p-1 text-muted-foreground hover:text-crimson transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {form.sizePreset === "Custom" && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                    <input
                      type="text"
                      value={customSize}
                      onChange={(e) => setCustomSize(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSize())}
                      placeholder="Add custom size..."
                      className="flex-1 bg-background border border-border/60 rounded-sm px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ink/30"
                    />
                    <button
                      type="button"
                      onClick={addCustomSize}
                      className="p-1.5 bg-ink text-cream rounded-sm"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-border/40">
          <div className="text-sm text-muted-foreground">
            {form.sizes.length} sizes · {form.colors.length} colors · {totalStock} total stock
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-xs tracking-widest uppercase border border-border/60 text-foreground hover:border-ink/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-ink px-6 py-2.5 text-xs tracking-widest uppercase"
            >
              {editProduct ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
