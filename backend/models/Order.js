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
  isRental: { type: Boolean, default: false },
  rentalDetails: { type: mongoose.Schema.Types.Mixed, default: null },
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
  deposit: { type: Number, default: 0 },
  depositRefunded: { type: Boolean, default: false },
  refundAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  coupon: { type: mongoose.Schema.Types.Mixed, default: null },
  shipping: { type: mongoose.Schema.Types.Mixed, default: {} },
  payment: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, default: 'confirmed' },
  rentalStatus: { type: String, default: 'active', enum: ['active', 'pending_return', 'awaiting_inspection', 'inspected', 'deposit_refunded', 'completed', 'cancelled'] },
  returnRequested: { type: Boolean, default: false },
  returnRequestedDate: String,
  inspectionStatus: { type: String, default: 'pending', enum: ['pending', 'passed', 'damaged', 'partial_refund'] },
  inspectedBy: String,
  inspectedAt: String,
  estimatedDelivery: String,
  rentalDetails: { type: mongoose.Schema.Types.Mixed, default: null },
  timeline: [timelineSchema],
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
