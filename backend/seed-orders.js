import 'dotenv/config';
import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const orderItemSchema = new mongoose.Schema({
  productId: String, name: String, price: Number, quantity: Number,
  size: String, color: String, img: String, vendorId: String,
  isRental: { type: Boolean, default: false },
  rentalDetails: { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  status: String, date: String, description: String,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: String, items: [orderItemSchema], subtotal: Number,
  deposit: { type: Number, default: 0 }, depositRefunded: { type: Boolean, default: false },
  refundAmount: { type: Number, default: 0 }, discount: { type: Number, default: 0 },
  total: Number, coupon: { type: mongoose.Schema.Types.Mixed, default: null },
  shipping: { type: mongoose.Schema.Types.Mixed, default: {} },
  payment: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, default: 'confirmed' },
  rentalStatus: { type: String, default: 'active' },
  rentalDetails: { type: mongoose.Schema.Types.Mixed, default: null },
  timeline: [timelineSchema],
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

async function seedOrders() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existingCount = await Order.countDocuments();
  console.log(`Existing orders: ${existingCount}`);

  const orders = [
    {
      userId: 'cust-1',
      items: [
        { productId: 'ecarlate-gown', name: 'Écarlate Gown', price: 1290, quantity: 1, size: 'M', color: 'Red', img: '/assets/dress-hero.png', vendorId: 'vendor-1', isRental: true, rentalDetails: { startDate: '2026-08-01', endDate: '2026-08-05' } },
      ],
      subtotal: 1290, deposit: 160, total: 1450, discount: 0,
      shipping: { address: '12 Rue de Rivoli, Paris', method: 'express' },
      payment: { method: 'card', status: 'paid' },
      status: 'delivered', rentalStatus: 'pending_return',
      rentalDetails: { startDate: '2026-08-01', endDate: '2026-08-05' },
      timeline: [
        { status: 'confirmed', date: '2026-07-20T10:00:00.000Z', description: 'Order placed successfully' },
        { status: 'shipped', date: '2026-07-22T14:00:00.000Z', description: 'Order shipped via express' },
        { status: 'delivered', date: '2026-07-24T09:00:00.000Z', description: 'Order delivered to customer' },
      ],
    },
    {
      userId: 'cust-1',
      items: [
        { productId: 'noir-blazer', name: 'Noir Blazer', price: 780, quantity: 1, size: 'L', color: 'Black', img: '/assets/dress-hero.png', vendorId: 'vendor-1', isRental: false, rentalDetails: null },
        { productId: 'wool-trousers', name: 'Wool Trousers', price: 460, quantity: 1, size: 'L', color: 'Charcoal', img: '/assets/dress-hero.png', vendorId: 'vendor-1', isRental: false, rentalDetails: null },
      ],
      subtotal: 1240, deposit: 0, total: 1140, discount: 100,
      coupon: { code: 'WELCOME10', type: 'fixed', value: 100 },
      shipping: { address: '45 Avenue Montaigne, Paris', method: 'standard' },
      payment: { method: 'card', status: 'paid' },
      status: 'processing', rentalStatus: 'active',
      timeline: [
        { status: 'confirmed', date: '2026-07-25T11:30:00.000Z', description: 'Order placed successfully' },
        { status: 'processing', date: '2026-07-26T09:00:00.000Z', description: 'Order is being prepared' },
      ],
    },
    {
      userId: 'cust-1',
      items: [
        { productId: 'stiletto-suede', name: 'Stiletto Suede', price: 480, quantity: 2, size: '38', color: 'Black', img: '/assets/dress-hero.png', vendorId: 'vendor-1', isRental: false, rentalDetails: null },
      ],
      subtotal: 960, deposit: 0, total: 960, discount: 0,
      shipping: { address: '8 Place Vendôme, Paris', method: 'express' },
      payment: { method: 'card', status: 'paid' },
      status: 'confirmed', rentalStatus: 'active',
      timeline: [
        { status: 'confirmed', date: '2026-07-28T16:00:00.000Z', description: 'Order placed successfully' },
      ],
    },
  ];

  for (const order of orders) {
    await Order.create(order);
    console.log(`Created order for user: ${order.userId}`);
  }

  console.log('Orders seeded successfully');
  await mongoose.disconnect();
}

seedOrders().catch(console.error);
