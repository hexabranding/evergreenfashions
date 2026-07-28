import mongoose from 'mongoose';

const adSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  type: { type: String, enum: ['banner', 'sidebar', 'popup', 'slide'], default: 'banner' },
  position: { type: String, default: 'homepage' },
  image: { type: String, default: '' },
  link: { type: String, default: '' },
  buttonText: { type: String, default: 'Shop Now' },
  active: { type: Boolean, default: true },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  vendorId: { type: String, default: null },
  startDate: { type: String },
  endDate: { type: String },
}, { timestamps: true });

export default mongoose.model('Ad', adSchema);
