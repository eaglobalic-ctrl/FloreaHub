import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Clock, Zap, Leaf, Camera, ChevronRight, ShoppingCart, Package } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FLORISTS } from "@/lib/data";

const PRODUCTS = [
  { id: "p1", name: "Classic Red Rose Bouquet", price: 120, image: "https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?w=400&h=400&fit=crop", badge: "Bestseller", rating: 4.9 },
  { id: "p2", name: "White Lily Elegance", price: 95, image: "https://images.unsplash.com/photo-1487530811015-780780169dc1?w=400&h=400&fit=crop", badge: "New", rating: 4.7 },
  { id: "p3", name: "Mixed Pastel Bouquet", price: 110, image: "https://images.unsplash.com/photo-1490750967868-88df5691166b?w=400&h=400&fit=crop", badge: "", rating: 4.8 },
  { id: "p4", name: "Sunflower Delight", price: 80, image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop", badge: "", rating: 4.6 },
  { id: "p5", name: "Bridal Premium Arrangement", price: 280, image: "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=400&h=400&fit=crop", badge: "Premium", rating: 5.0 },
  { id: "p6", name: "Birthday Bloom Box", price: 150, image: "https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400&h=400&fit=crop", badge: "", rating: 4.8 },
];

const REVIEWS = [
  { name: "Nurul Ain", rating: 5, date: "2 days ago", comment: "Absolutely stunning bouquet. The florist sent a real photo before delivery and it looked even better in person. Highly recommend!" },
  { name: "Ahmad Faizal", rating: 5, date: "1 week ago", comment: "Ordered for our anniversary. Quick response, on-time delivery, and the flowers were still fresh after 5 days. Exceptional service." },
  { name: "Siti Hajar", rating: 4, date: "2 weeks ago", comment: "Beautiful arrangement and great packaging. Slightly delayed but still within the promised window. Will order again." },
];

const BADGE_STYLES: Record<string, string> = {
  Bestseller: "bg-amber-50 text-amber-700 border border-amber-200",
  Premium: "bg-purple-50 text-purple-700 border border-purple-200",
  New: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

export default async function FloristDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const florist = FLORISTS.find((f) => f.id === id);
  if (!florist) notFound();

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link href="/florists" className="hover:text-gray-600 transition-colors">Florists</Link>
            <ChevronRight size={14} />
            <span className="text-gray-700 font-medium">{florist.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden sticky top-24">
              {/* Cover image */}
              <div className="relative h-52 bg-gray-100">
                <Image src={florist.image} alt={florist.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h1 className="text-lg font-semibold text-white leading-tight">{florist.name}</h1>
                  <div className="flex items-center gap-1.5 text-white/80 text-sm mt-1">
                    <MapPin size={12} />
                    <span>{florist.area}, {florist.location}</span>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { value: florist.rating, label: "Rating" },
                    { value: florist.reviews, label: "Reviews" },
                    { value: florist.products, label: "Products" },
                  ].map((s) => (
                    <div key={s.label} className="text-center py-3 bg-gray-50 rounded-lg">
                      <div className="font-bold text-gray-900 text-base">{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {florist.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-md font-medium" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{tag}</span>
                  ))}
                </div>

                {/* Guarantees */}
                <div className="space-y-2.5 mb-5 text-sm">
                  {florist.freshGuarantee && (
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Leaf size={13} style={{ color: "var(--accent)" }} />
                      </div>
                      Freshness Guaranteed
                    </div>
                  )}
                  {florist.sameDay && (
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Zap size={13} className="text-amber-500" />
                      </div>
                      Same-Day Delivery
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-gray-600">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary-light)" }}>
                      <Camera size={13} style={{ color: "var(--primary)" }} />
                    </div>
                    Real-Photo Promise
                  </div>
                </div>

                {/* Details */}
                <div className="text-sm divide-y divide-gray-50 mb-5">
                  <div className="flex justify-between py-2.5">
                    <span className="text-gray-500 flex items-center gap-1.5"><Clock size={13} /> Delivery time</span>
                    <span className="font-medium text-gray-700">{florist.deliveryTime}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-gray-500 flex items-center gap-1.5"><Package size={13} /> Min. order</span>
                    <span className="font-medium text-gray-700">RM{florist.minOrder}</span>
                  </div>
                </div>

                <Link href={`/builder?florist=${florist.id}`} className="btn-primary w-full justify-center text-sm">
                  Custom Bouquet with This Florist
                </Link>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Products */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Products ({PRODUCTS.length})</h2>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {PRODUCTS.map((p) => (
                  <div key={p.id} className="card-premium overflow-hidden group cursor-pointer bg-white">
                    <div className="relative h-44 bg-gray-100 overflow-hidden">
                      <Image src={p.image} alt={p.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      {p.badge && (
                        <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-md ${BADGE_STYLES[p.badge] ?? ""}`}>{p.badge}</span>
                      )}
                    </div>
                    <div className="p-3.5">
                      <h3 className="font-medium text-gray-800 text-sm mb-2 line-clamp-2">{p.name}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-base" style={{ color: "var(--primary)" }}>RM{p.price}</span>
                        <div className="flex items-center gap-1">
                          <Star size={11} className="text-amber-400" fill="currentColor" />
                          <span className="text-xs text-gray-500">{p.rating}</span>
                        </div>
                      </div>
                      <button className="btn-primary w-full text-xs py-2 justify-center">
                        <ShoppingCart size={12} /> Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Customer Reviews</h2>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">{florist.rating}</span>
                  <div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-amber-400" fill="currentColor" />)}
                    </div>
                    <div className="text-xs text-gray-400">{florist.reviews} reviews</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {REVIEWS.map((r, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ background: "var(--primary)" }}>
                          {r.name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{r.name}</div>
                          <div className="text-xs text-gray-400">{r.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(r.rating)].map((_, i) => <Star key={i} size={11} className="text-amber-400" fill="currentColor" />)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
