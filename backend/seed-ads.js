import 'dotenv/config';
import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

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

const Ad = mongoose.model('Ad', adSchema);

async function seedAds() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await Ad.countDocuments();
  console.log(`Existing ads: ${existing}`);

  if (existing > 0) {
    console.log('Ads already present, skipping seed');
    await mongoose.disconnect();
    return;
  }

  const ads = [
    {
      title: 'Winter Atelier Sale',
      subtitle: 'Up to 40% Off',
      type: 'slide',
      position: 'homepage-top',
      image: '/assets/dress-hero.png',
      link: '/collection',
      buttonText: 'Shop the Sale',
      active: true,
    },
    {
      title: 'New Arrivals',
      subtitle: 'Fall / Winter 2026',
      type: 'slide',
      position: 'homepage-top',
      image: '/assets/dress-2.png',
      link: '/collection',
      buttonText: 'Explore Now',
      active: true,
    },
    {
      title: 'Rental Edit',
      subtitle: 'Wear the Iconic',
      type: 'slide',
      position: 'homepage-mid',
      image: '/assets/dress-4.png',
      link: '/rental',
      buttonText: 'Browse Rentals',
      active: true,
    },
    {
      title: 'Handcrafted in Paris',
      subtitle: 'The Atelier Diary',
      type: 'banner',
      position: 'homepage-bottom',
      image: '/assets/dress-5.png',
      link: '/atelier',
      buttonText: 'Inside the Atelier',
      active: true,
    },
  ];

  await Ad.insertMany(ads);
  console.log(`Seeded ${ads.length} ads`);

  await mongoose.disconnect();
}

seedAds().catch((err) => {
  console.error(err);
  process.exit(1);
});
