import mongoose from 'mongoose';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Review from './models/Review.js';
import Ad from './models/Ad.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

let connected = false;

const IMAGE_MAP = {
  'ecarlate-gown': '/assets/dress-hero.png',
  'emeraude-gown': '/assets/dress-2.png',
  'ivoire-draped': '/assets/dress-3.png',
  'perle-chiffon': '/assets/dress-4.png',
  'satin-ecarlate': '/assets/dress-5.png',
  'chiffon-gress': '/assets/gress-9.jpeg',
  'noir-silhouette': '/assets/dress-6.jpg',
  'camel-trench': '/assets/dress-7.jpeg',
  'noir-blazer': '/assets/dress-8.jpeg',
  'sable-wrap-coat': '/assets/dress-10.jpeg',
  'trench-italienne': '/assets/dress-hero.png',
  'silk-blouse-noir': '/assets/dress-2.png',
  'cashmere-wrap': '/assets/dress-3.png',
  'wool-trousers': '/assets/dress-4.png',
  'derby-leather': '/assets/dress-5.png',
  'chelsea-suede': '/assets/gress-9.jpeg',
  'loafer-patent': '/assets/dress-6.jpg',
  'stiletto-suede': '/assets/dress-7.jpeg',
  'ankle-boot-leather': '/assets/dress-8.jpeg',
  'strappy-heel': '/assets/dress-10.jpeg',
};

export async function connectDB() {
  if (connected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in .env');

  await mongoose.connect(uri);
  connected = true;
  console.log('Connected to MongoDB');

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await seedData();
  } else {
    await Product.updateMany({ vendorId: 'ef-main' }, { $set: { vendorId: 'vendor-1' } });

    const products = await Product.find().lean();
    for (const p of products) {
      const correctImg = IMAGE_MAP[p._id];
      if (correctImg) {
        await Product.findByIdAndUpdate(p._id, {
          $set: {
            img: correctImg,
            images: [correctImg],
          },
        });
      }
    }
    console.log('Product images migrated');
  }
}

export async function seedData() {
  const now = new Date().toISOString();
  const hashPassword = (pw) => bcrypt.hashSync(pw, 10);

  await User.insertMany([
    {
      _id: 'admin-1',
      firstName: 'Admin',
      lastName: 'Evergreen',
      email: 'admin@evergreen.com',
      password: hashPassword('admin123'),
      role: 'admin',
      phone: null,
      addresses: [],
    },
    {
      _id: 'vendor-1',
      firstName: 'Atelier',
      lastName: 'Paris',
      email: 'vendor@evergreen.com',
      password: hashPassword('vendor123'),
      role: 'vendor',
      phone: null,
      addresses: [],
      vendorStore: { name: 'Atelier Paris', description: 'Premium Parisian fashion house', commission: 15 },
    },
    {
      _id: 'cust-1',
      firstName: 'Isabelle',
      lastName: 'Moreau',
      email: 'customer@evergreen.com',
      password: hashPassword('customer123'),
      role: 'customer',
      phone: '+33 6 12 34 56 78',
      addresses: [],
    },
  ]);

  const products = [
    { id: 'ecarlate-gown', name: 'Écarlate Gown', price: 1290, category: 'Dresses', gender: 'Womenswear', colors: ['Red', 'Burgundy'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'vendor-1', description: 'A breathtaking floor-length gown in the deepest scarlet, crafted from flowing silk charmeuse.', rentalAvailable: true, rentalPricePerDay: 160, img: '/assets/dress-hero.png', images: ['/assets/dress-hero.png'] },
    { id: 'emeraude-gown', name: 'Émeraude Gown', price: 1420, category: 'Dresses', gender: 'Womenswear', colors: ['Emerald', 'Sage'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'vendor-1', description: 'An emerald masterpiece inspired by the lush gardens of Versailles.', rentalAvailable: true, rentalPricePerDay: 180, img: '/assets/dress-2.png', images: ['/assets/dress-2.png'] },
    { id: 'ivoire-draped', name: 'Ivoire Draped', price: 980, category: 'Dresses', gender: 'Womenswear', colors: ['Ivory', 'Cream', 'Nude'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'vendor-1', description: 'Ethereal draped gown in pure ivory, a study in understated luxury.', rentalAvailable: true, rentalPricePerDay: 120, img: '/assets/dress-3.png', images: ['/assets/dress-3.png'] },
    { id: 'perle-chiffon', name: 'Perle Chiffon', price: 1100, category: 'Dresses', gender: 'Womenswear', colors: ['Pearl', 'Champagne'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'vendor-1', description: 'A pearl-toned chiffon gown that captures light like morning dew.', rentalAvailable: true, rentalPricePerDay: 140, img: '/assets/dress-4.png', images: ['/assets/dress-4.png'] },
    { id: 'satin-ecarlate', name: 'Satin Écarlate', price: 1290, category: 'Dresses', gender: 'Womenswear', colors: ['Red', 'Ruby'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'vendor-1', description: 'Luxurious satin gown in vivid scarlet with architectural draping.', rentalAvailable: true, rentalPricePerDay: 160, img: '/assets/dress-5.png', images: ['/assets/dress-5.png'] },
    { id: 'chiffon-gress', name: 'Chiffon Gress', price: 1100, category: 'Dresses', gender: 'Womenswear', colors: ['Blush', 'Dove'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'vendor-1', description: 'Soft chiffon layers in delicate blush tones, perfect for garden parties.', rentalAvailable: true, rentalPricePerDay: 140, img: '/assets/gress-9.jpeg', images: ['/assets/gress-9.jpeg'] },
    { id: 'noir-silhouette', name: 'Noir Silhouette', price: 890, category: 'Apparel', gender: 'Menswear', colors: ['Black', 'Charcoal'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'vendor-1', description: 'The quintessential black piece, tailored to perfection.', img: '/assets/dress-6.jpg', images: ['/assets/dress-6.jpg'] },
    { id: 'camel-trench', name: 'Camel Trench', price: 1150, category: 'Apparel', gender: 'Menswear', colors: ['Camel', 'Sand'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'vendor-1', description: 'A timeless camel trench coat in Italian wool-cashmere blend.', img: '/assets/dress-7.jpeg', images: ['/assets/dress-7.jpeg'] },
    { id: 'noir-blazer', name: 'Noir Blazer', price: 780, category: 'Apparel', gender: 'Menswear', colors: ['Black', 'Navy'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'vendor-1', description: 'Impeccably structured blazer in midnight black.', img: '/assets/dress-8.jpeg', images: ['/assets/dress-8.jpeg'] },
    { id: 'sable-wrap-coat', name: 'Sable Wrap Coat', price: 1340, category: 'Apparel', gender: 'Menswear', colors: ['Brown', 'Espresso'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'vendor-1', description: 'A sumptuous wrap coat in rich sable tones, double-faced cashmere.', img: '/assets/dress-10.jpeg', images: ['/assets/dress-10.jpeg'] },
    { id: 'trench-italienne', name: 'Trench Italienne', price: 1150, category: 'Apparel', gender: 'Menswear', colors: ['Navy', 'Charcoal'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'vendor-1', description: 'Italian-crafted trench in deep navy with refined detailing.', img: '/assets/dress-hero.png', images: ['/assets/dress-hero.png'] },
    { id: 'silk-blouse-noir', name: 'Silk Blouse Noir', price: 520, category: 'Apparel', gender: 'Womenswear', colors: ['Black', 'Ivory'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'vendor-1', description: 'Flowing silk blouse in noir, a wardrobe essential.', img: '/assets/dress-2.png', images: ['/assets/dress-2.png'] },
    { id: 'cashmere-wrap', name: 'Cashmere Wrap', price: 890, category: 'Apparel', gender: 'Womenswear', colors: ['Camel', 'Dove'], sizes: ['One Size'], vendorId: 'vendor-1', description: 'Pure cashmere wrap in warm camel tones.', img: '/assets/dress-3.png', images: ['/assets/dress-3.png'] },
    { id: 'wool-trousers', name: 'Wool Trousers', price: 460, category: 'Apparel', gender: 'Womenswear', colors: ['Charcoal', 'Black'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'vendor-1', description: 'Impeccably tailored wool trousers with a modern silhouette.', img: '/assets/dress-4.png', images: ['/assets/dress-4.png'] },
    { id: 'derby-leather', name: 'Derby Leather', price: 420, category: 'Shoes', gender: 'Menswear', colors: ['Black', 'Brown'], sizes: ['40', '41', '42', '43', '44', '45'], vendorId: 'vendor-1', description: 'Hand-stitched leather derby shoes, Goodyear welted.', img: '/assets/dress-5.png', images: ['/assets/dress-5.png'] },
    { id: 'chelsea-suede', name: 'Chelsea Suede', price: 380, category: 'Shoes', gender: 'Menswear', colors: ['Sand', 'Espresso'], sizes: ['40', '41', '42', '43', '44', '45'], vendorId: 'vendor-1', description: 'Refined Chelsea boots in premium suede.', img: '/assets/gress-9.jpeg', images: ['/assets/gress-9.jpeg'] },
    { id: 'loafer-patent', name: 'Loafer Patent', price: 350, category: 'Shoes', gender: 'Menswear', colors: ['Black'], sizes: ['40', '41', '42', '43', '44', '45'], vendorId: 'vendor-1', description: 'Polished patent leather loafers for the distinguished gentleman.', img: '/assets/dress-6.jpg', images: ['/assets/dress-6.jpg'] },
    { id: 'stiletto-suede', name: 'Stiletto Suede', price: 480, category: 'Shoes', gender: 'Womenswear', colors: ['Black', 'Nude'], sizes: ['35', '36', '37', '38', '39', '40'], vendorId: 'vendor-1', description: 'Elegant stiletto heels in sumptuous suede.', img: '/assets/dress-7.jpeg', images: ['/assets/dress-7.jpeg'] },
    { id: 'ankle-boot-leather', name: 'Ankle Boot Leather', price: 390, category: 'Shoes', gender: 'Womenswear', colors: ['Black', 'Oxblood'], sizes: ['35', '36', '37', '38', '39', '40'], vendorId: 'vendor-1', description: 'Structured ankle boots in premium leather.', img: '/assets/dress-8.jpeg', images: ['/assets/dress-8.jpeg'] },
    { id: 'strappy-heel', name: 'Strappy Heel', price: 340, category: 'Shoes', gender: 'Womenswear', colors: ['Gold', 'Champagne'], sizes: ['35', '36', '37', '38', '39', '40'], vendorId: 'vendor-1', description: 'Delicate strappy heels in metallic gold.', img: '/assets/dress-10.jpeg', images: ['/assets/dress-10.jpeg'] },
  ];

  for (const p of products) {
    const inventory = p.sizes.map((size) => ({ size, stock: 5 + Math.floor(Math.random() * 11) }));
    await Product.create({
      _id: p.id,
      name: p.name,
      price: p.price,
      tag: p.category,
      category: p.category,
      gender: p.gender,
      colors: p.colors,
      sizes: p.sizes,
      description: p.description,
      vendorId: p.vendorId === 'ef-main' ? 'vendor-1' : p.vendorId,
      img: p.img || '/assets/dress-hero.png',
      images: p.images || [p.img || '/assets/dress-hero.png'],
      rentalAvailable: p.rentalAvailable || false,
      rentalPricePerDay: p.rentalPricePerDay || 0,
      inventory,
    });
  }

  await Review.insertMany([
    {
      productId: 'ecarlate-gown', userId: 'cust-1', userName: 'Isabelle Moreau', rating: 5,
      comment: 'Absolutely stunning! The fabric quality is extraordinary and the fit is perfect. Received countless compliments.',
      vendorReply: 'Thank you, Isabelle! We are delighted this gown exceeded your expectations.',
    },
    {
      productId: 'ecarlate-gown', userId: 'cust-1', userName: 'Isabelle Moreau', rating: 5,
      comment: 'The scarlet hue is even more vivid in person. A true showstopper for any evening event.',
    },
    {
      productId: 'emeraude-gown', userId: 'cust-1', userName: 'Isabelle Moreau', rating: 5,
      comment: 'The emerald color is breathtaking. Felt like royalty wearing this to the gala.',
    },
    {
      productId: 'ivoire-draped', userId: 'cust-1', userName: 'Isabelle Moreau', rating: 4,
      comment: 'Beautiful draping and luxurious feel. Slightly longer than expected but easily altered.',
      vendorReply: 'Thank you for your feedback! We are glad you loved the piece.',
    },
  ]);

  await Order.insertMany([
    {
      _id: 'order-1',
      userId: 'cust-1',
      items: [
        { productId: 'ecarlate-gown', name: 'Écarlate Gown', price: 1290, quantity: 1, size: 'M', color: 'Red', img: '/assets/dress-hero.png', vendorId: 'vendor-1', isRental: true, rentalDetails: { startDate: '2026-08-01', endDate: '2026-08-05' } },
      ],
      subtotal: 1290,
      deposit: 160,
      depositRefunded: false,
      refundAmount: 0,
      discount: 0,
      total: 1450,
      coupon: null,
      shipping: { address: '12 Rue de Rivoli, Paris', method: 'express' },
      payment: { method: 'card', status: 'paid' },
      status: 'delivered',
      rentalStatus: 'pending_return',
      rentalDetails: { startDate: '2026-08-01', endDate: '2026-08-05' },
      timeline: [
        { status: 'confirmed', date: '2026-07-20T10:00:00.000Z', description: 'Order placed successfully' },
        { status: 'shipped', date: '2026-07-22T14:00:00.000Z', description: 'Order shipped via express' },
        { status: 'delivered', date: '2026-07-24T09:00:00.000Z', description: 'Order delivered to customer' },
      ],
    },
    {
      _id: 'order-2',
      userId: 'cust-1',
      items: [
        { productId: 'noir-blazer', name: 'Noir Blazer', price: 780, quantity: 1, size: 'L', color: 'Black', img: '/assets/dress-8.jpeg', vendorId: 'vendor-1', isRental: false, rentalDetails: null },
        { productId: 'wool-trousers', name: 'Wool Trousers', price: 460, quantity: 1, size: 'L', color: 'Charcoal', img: '/assets/dress-4.png', vendorId: 'vendor-1', isRental: false, rentalDetails: null },
      ],
      subtotal: 1240,
      deposit: 0,
      depositRefunded: false,
      refundAmount: 0,
      discount: 100,
      total: 1140,
      coupon: { code: 'WELCOME10', type: 'fixed', value: 100 },
      shipping: { address: '45 Avenue Montaigne, Paris', method: 'standard' },
      payment: { method: 'card', status: 'paid' },
      status: 'processing',
      rentalStatus: 'active',
      rentalDetails: null,
      timeline: [
        { status: 'confirmed', date: '2026-07-25T11:30:00.000Z', description: 'Order placed successfully' },
        { status: 'processing', date: '2026-07-26T09:00:00.000Z', description: 'Order is being prepared' },
      ],
    },
    {
      _id: 'order-3',
      userId: 'cust-1',
      items: [
        { productId: 'stiletto-suede', name: 'Stiletto Suede', price: 480, quantity: 2, size: '38', color: 'Black', img: '/assets/dress-7.jpeg', vendorId: 'vendor-1', isRental: false, rentalDetails: null },
      ],
      subtotal: 960,
      deposit: 0,
      depositRefunded: false,
      refundAmount: 0,
      discount: 0,
      total: 960,
      coupon: null,
      shipping: { address: '8 Place Vendôme, Paris', method: 'express' },
      payment: { method: 'card', status: 'paid' },
      status: 'confirmed',
      rentalStatus: 'active',
      rentalDetails: null,
      timeline: [
        { status: 'confirmed', date: '2026-07-28T16:00:00.000Z', description: 'Order placed successfully' },
      ],
    },
  ]);

  console.log('Database seeded successfully');
}
