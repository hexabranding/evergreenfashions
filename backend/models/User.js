import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  id: String,
  label: String,
  firstName: String,
  lastName: String,
  address1: String,
  address2: String,
  city: String,
  state: String,
  zip: String,
  country: String,
  phone: String,
}, { _id: false });

const vendorStoreSchema = new mongoose.Schema({
  name: String,
  description: String,
  commission: { type: Number, default: 15 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  _id: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'vendor', 'admin'], default: 'customer' },
  phone: { type: String, default: null },
  addresses: [addressSchema],
  vendorStore: vendorStoreSchema,
}, { timestamps: true });

export default mongoose.model('User', userSchema);
