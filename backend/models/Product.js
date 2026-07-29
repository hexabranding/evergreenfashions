import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  size: { type: String, required: true },
  stock: { type: Number, default: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  tag: { type: String },
  category: { type: String },
  gender: { type: String, default: 'Unisex' },
  colors: [{ type: String }],
  sizes: [{ type: String }],
  description: { type: String, default: '' },
  vendorId: { type: String },
  img: { type: String, default: '/assets/dress-hero.png' },
  images: [{ type: String }],
  rentalAvailable: { type: Boolean, default: false },
  rentalPricePerDay: { type: Number, default: 0 },
  rentalDeposit: { type: Number, default: 100 },
  inventory: [inventorySchema],
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
