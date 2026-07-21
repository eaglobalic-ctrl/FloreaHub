const AI = "https://image.pollinations.ai/prompt";

// Maps a raw `florists` DB row to the card shape FloristCard expects —
// shared by /florists and the homepage's Featured Florists section.
export function dbToFloristCard(f: Record<string, unknown>) {
  const plan = String(f.plan || "free");
  return {
    id: String(f.id),
    name: String(f.name || ""),
    location: String(f.state || f.city || "Malaysia"),
    area: String(f.city || ""),
    rating: Number(f.rating) || 0,
    reviews: Number(f.review_count) || 0,
    badge: plan === "elite" ? "Top Seller" : plan === "pro" ? "Verified" : "New",
    deliveryTime: String(f.delivery_time || "2–4 hrs"),
    minOrder: Number(f.min_order) || 50,
    tags: Array.isArray(f.tags) ? f.tags as string[] : [],
    image: String(f.cover_image || `${AI}/flower+shop+malaysia+florist?width=600&height=400&nologo=true&seed=${f.id}`),
    products: Number(f.product_count) || 0,
    freshGuarantee: Boolean(f.is_verified),
    sameDay: Boolean(f.same_day_delivery),
  };
}


export const CATEGORIES = [
  { id: "wedding", label: "Weddings", icon: "gem", count: 120 },
  { id: "birthday", label: "Birthdays", icon: "gift", count: 200 },
  { id: "anniversary", label: "Anniversary", icon: "heart", count: 85 },
  { id: "corporate", label: "Corporate", icon: "building2", count: 64 },
  { id: "sympathy", label: "Sympathy", icon: "feather", count: 43 },
  { id: "daily", label: "Everyday", icon: "sun", count: 310 },
];

export const WOW_FEATURES = [
  {
    icon: "camera",
    title: "Real-Photo Promise",
    desc: "Your florist sends an actual photo of your bouquet before it ships. What you see is exactly what you receive.",
  },
  {
    icon: "leaf",
    title: "Freshness Guarantee",
    desc: "Every flower is labeled with its harvest date. Not fresh? We replace it, no questions asked.",
  },
  {
    icon: "bell",
    title: "Occasion Reminders",
    desc: "Set birthdays, anniversaries, and special dates once. We remind you 3 days early, every time.",
  },
  {
    icon: "palette",
    title: "Bouquet Builder",
    desc: "Design your arrangement from scratch — choose blooms, colors, wrapping, and a personal message.",
  },
  {
    icon: "refresh-cw",
    title: "Flower Subscription",
    desc: "Weekly or monthly fresh flowers delivered to your home. Exclusive pricing for subscribers.",
  },
  {
    icon: "zap",
    title: "Same-Day Delivery",
    desc: "Order before 2 PM and receive today. Our nearest verified florist handles your delivery.",
  },
];

export const STATS = [
  { end: 500, suffix: "+", label: "Verified Florists" },
  { end: 50, suffix: "K+", label: "Happy Customers" },
  { end: 15, suffix: "+", label: "States Covered" },
  { end: 98, suffix: "%", label: "On-Time Delivery" },
];

export const TESTIMONIALS = [
  {
    name: "Sarah Lim",
    role: "Bride",
    avatar: "S",
    rating: 5,
    text: "FloreaHub made finding my wedding florist effortless. The real-photo promise gave me total confidence — what I saw was exactly what arrived at the ceremony.",
  },
  {
    name: "Ahmad Razif",
    role: "Corporate Client",
    avatar: "A",
    rating: 5,
    text: "We use FloreaHub for all our office events. Reliable, beautiful arrangements every single time. The same-day delivery has saved us more than once.",
  },
  {
    name: "Priya Nair",
    role: "Regular Customer",
    avatar: "P",
    rating: 5,
    text: "The Occasion Reminders feature is genius. I never forget my mum's birthday now — and the flowers always arrive looking stunning.",
  },
  {
    name: "Wei Ling Tan",
    role: "Event Planner",
    avatar: "W",
    rating: 5,
    text: "Booking multiple florists for a single event used to be a headache. FloreaHub's marketplace made comparing quotes and reviews so much faster.",
  },
  {
    name: "Farah Aziz",
    role: "Anniversary Gift",
    avatar: "F",
    rating: 5,
    text: "Ordered last-minute at 1pm and it still arrived same day. The florist even added a handwritten note without me asking. Small touches like that matter.",
  },
  {
    name: "Daniel Goh",
    role: "First-Time Buyer",
    avatar: "D",
    rating: 4,
    text: "Wasn't sure about ordering flowers online, but the real-photo promise sold me. What arrived matched the listing exactly.",
  },
  {
    name: "Nurul Huda",
    role: "Wedding Planner",
    avatar: "N",
    rating: 5,
    text: "I've recommended FloreaHub to every couple I work with now. The bouquet builder alone has saved us hours of back-and-forth with florists.",
  },
  {
    name: "Kevin Chong",
    role: "Sympathy Order",
    avatar: "K",
    rating: 5,
    text: "Needed a sympathy arrangement delivered with care and dignity. The florist understood the tone perfectly — arrived beautifully arranged, right on time.",
  },
  {
    name: "Aisyah Rahman",
    role: "Monthly Subscriber",
    avatar: "A",
    rating: 5,
    text: "I'm on the flower subscription now and honestly it's the best decision I made this year. Fresh blooms on my desk every fortnight without lifting a finger.",
  },
];

export const AI_PRODUCTS = [
  { id: "1", name: "Classic Red Rose Bouquet", florist: "Bloom & Co.", price: 120, originalPrice: 150, image: `${AI}/classic+red+rose+bouquet+luxury+professional+photography+white+background?width=400&height=400&nologo=true&seed=1001`, category: "anniversary", rating: 4.9, reviews: 89, sameDay: true, badge: "Bestseller" },
  { id: "2", name: "White Lily Elegance", florist: "Petal Paradise", price: 95, originalPrice: null, image: `${AI}/white+lily+elegant+bouquet+premium+arrangement+soft+background?width=400&height=400&nologo=true&seed=1002`, category: "wedding", rating: 4.7, reviews: 54, sameDay: true, badge: "" },
  { id: "3", name: "Sunflower Happiness Box", florist: "Rose Garden MY", price: 80, originalPrice: null, image: `${AI}/sunflower+birthday+bouquet+colorful+cheerful+gift+box?width=400&height=400&nologo=true&seed=1003`, category: "birthday", rating: 4.8, reviews: 112, sameDay: false, badge: "Popular" },
  { id: "4", name: "Bridal Premium Bouquet", florist: "Fleur de Lune", price: 280, originalPrice: 320, image: `${AI}/bridal+wedding+bouquet+white+roses+peonies+luxury+premium?width=400&height=400&nologo=true&seed=1004`, category: "wedding", rating: 5.0, reviews: 67, sameDay: true, badge: "Premium" },
  { id: "5", name: "Birthday Bloom Box", florist: "Bloom & Co.", price: 150, originalPrice: null, image: `${AI}/birthday+flower+box+mixed+pink+purple+festive+celebration?width=400&height=400&nologo=true&seed=1005`, category: "birthday", rating: 4.8, reviews: 78, sameDay: true, badge: "" },
  { id: "6", name: "Pastel Mix Arrangement", florist: "Petal Paradise", price: 110, originalPrice: null, image: `${AI}/pastel+mixed+flower+arrangement+modern+romantic+aesthetic?width=400&height=400&nologo=true&seed=1006`, category: "daily", rating: 4.6, reviews: 43, sameDay: false, badge: "New" },
  { id: "7", name: "Corporate Event Stand", florist: "Rose Garden MY", price: 220, originalPrice: 260, image: `${AI}/corporate+office+flower+arrangement+white+green+professional+elegant?width=400&height=400&nologo=true&seed=1007`, category: "corporate", rating: 4.7, reviews: 31, sameDay: false, badge: "" },
  { id: "8", name: "Orchid Luxury Stand", florist: "Fleur de Lune", price: 350, originalPrice: null, image: `${AI}/orchid+luxury+stand+purple+white+premium+corporate+display?width=400&height=400&nologo=true&seed=1008`, category: "corporate", rating: 4.9, reviews: 28, sameDay: true, badge: "Luxury" },
];
