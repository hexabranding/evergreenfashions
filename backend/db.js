import mongoose from 'mongoose';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Review from './models/Review.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

let connected = false;

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
    { id: 'ecarlate-gown', name: 'Écarlate Gown', price: 1290, category: 'Dresses', gender: 'Womenswear', colors: ['Red', 'Burgundy'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main', description: 'A breathtaking floor-length gown in the deepest scarlet, crafted from flowing silk charmeuse.', rentalAvailable: true, rentalPricePerDay: 160 },
    { id: 'emeraude-gown', name: 'Émeraude Gown', price: 1420, category: 'Dresses', gender: 'Womenswear', colors: ['Emerald', 'Sage'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main', description: 'An emerald masterpiece inspired by the lush gardens of Versailles.', rentalAvailable: true, rentalPricePerDay: 180 },
    { id: 'ivoire-draped', name: 'Ivoire Draped', price: 980, category: 'Dresses', gender: 'Womenswear', colors: ['Ivory', 'Cream', 'Nude'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main', description: 'Ethereal draped gown in pure ivory, a study in understated luxury.', rentalAvailable: true, rentalPricePerDay: 120 },
    { id: 'perle-chiffon', name: 'Perle Chiffon', price: 1100, category: 'Dresses', gender: 'Womenswear', colors: ['Pearl', 'Champagne'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main', description: 'A pearl-toned chiffon gown that captures light like morning dew.', rentalAvailable: true, rentalPricePerDay: 140 },
    { id: 'satin-ecarlate', name: 'Satin Écarlate', price: 1290, category: 'Dresses', gender: 'Womenswear', colors: ['Red', 'Ruby'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main', description: 'Luxurious satin gown in vivid scarlet with architectural draping.', rentalAvailable: true, rentalPricePerDay: 160 },
    { id: 'chiffon-gress', name: 'Chiffon Gress', price: 1100, category: 'Dresses', gender: 'Womenswear', colors: ['Blush', 'Dove'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main', description: 'Soft chiffon layers in delicate blush tones, perfect for garden parties.', rentalAvailable: true, rentalPricePerDay: 140 },
    { id: 'noir-silhouette', name: 'Noir Silhouette', price: 890, category: 'Apparel', gender: 'Menswear', colors: ['Black', 'Charcoal'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'ef-main', description: 'The quintessential black piece, tailored to perfection.' },
    { id: 'camel-trench', name: 'Camel Trench', price: 1150, category: 'Apparel', gender: 'Menswear', colors: ['Camel', 'Sand'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'ef-main', description: 'A timeless camel trench coat in Italian wool-cashmere blend.' },
    { id: 'noir-blazer', name: 'Noir Blazer', price: 780, category: 'Apparel', gender: 'Menswear', colors: ['Black', 'Navy'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'ef-main', description: 'Impeccably structured blazer in midnight black.' },
    { id: 'sable-wrap-coat', name: 'Sable Wrap Coat', price: 1340, category: 'Apparel', gender: 'Menswear', colors: ['Brown', 'Espresso'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'ef-main', description: 'A sumptuous wrap coat in rich sable tones, double-faced cashmere.' },
    { id: 'trench-italienne', name: 'Trench Italienne', price: 1150, category: 'Apparel', gender: 'Menswear', colors: ['Navy', 'Charcoal'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'ef-main', description: 'Italian-crafted trench in deep navy with refined detailing.' },
    { id: 'silk-blouse-noir', name: 'Silk Blouse Noir', price: 520, category: 'Apparel', gender: 'Womenswear', colors: ['Black', 'Ivory'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main', description: 'Flowing silk blouse in noir, a wardrobe essential.' },
    { id: 'cashmere-wrap', name: 'Cashmere Wrap', price: 890, category: 'Apparel', gender: 'Womenswear', colors: ['Camel', 'Dove'], sizes: ['One Size'], vendorId: 'ef-main', description: 'Pure cashmere wrap in warm camel tones.' },
    { id: 'wool-trousers', name: 'Wool Trousers', price: 460, category: 'Apparel', gender: 'Womenswear', colors: ['Charcoal', 'Black'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main', description: 'Impeccably tailored wool trousers with a modern silhouette.' },
    { id: 'derby-leather', name: 'Derby Leather', price: 420, category: 'Shoes', gender: 'Menswear', colors: ['Black', 'Brown'], sizes: ['40', '41', '42', '43', '44', '45'], vendorId: 'ef-main', description: 'Hand-stitched leather derby shoes, Goodyear welted.' },
    { id: 'chelsea-suede', name: 'Chelsea Suede', price: 380, category: 'Shoes', gender: 'Menswear', colors: ['Sand', 'Espresso'], sizes: ['40', '41', '42', '43', '44', '45'], vendorId: 'ef-main', description: 'Refined Chelsea boots in premium suede.' },
    { id: 'loafer-patent', name: 'Loafer Patent', price: 350, category: 'Shoes', gender: 'Menswear', colors: ['Black'], sizes: ['40', '41', '42', '43', '44', '45'], vendorId: 'ef-main', description: 'Polished patent leather loafers for the distinguished gentleman.' },
    { id: 'stiletto-suede', name: 'Stiletto Suede', price: 480, category: 'Shoes', gender: 'Womenswear', colors: ['Black', 'Nude'], sizes: ['35', '36', '37', '38', '39', '40'], vendorId: 'ef-main', description: 'Elegant stiletto heels in sumptuous suede.' },
    { id: 'ankle-boot-leather', name: 'Ankle Boot Leather', price: 390, category: 'Shoes', gender: 'Womenswear', colors: ['Black', 'Oxblood'], sizes: ['35', '36', '37', '38', '39', '40'], vendorId: 'ef-main', description: 'Structured ankle boots in premium leather.' },
    { id: 'strappy-heel', name: 'Strappy Heel', price: 340, category: 'Shoes', gender: 'Womenswear', colors: ['Gold', 'Champagne'], sizes: ['35', '36', '37', '38', '39', '40'], vendorId: 'ef-main', description: 'Delicate strappy heels in metallic gold.' },
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
      vendorId: p.vendorId,
      img: '/assets/dress-hero.png',
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

  console.log('Database seeded successfully');
}
