import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  price: Number,
  quantity: Number,
  size: String,
  color: String,
  img: String,
  vendorId: String,
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  status: String,
  date: String,
  description: String,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  coupon: { type: mongoose.Schema.Types.Mixed, default: null },
  shipping: { type: mongoose.Schema.Types.Mixed, default: {} },
  payment: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, default: 'confirmed' },
  estimatedDelivery: String,
  rentalDetails: { type: mongoose.Schema.Types.Mixed, default: null },
  timeline: [timelineSchema],
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
