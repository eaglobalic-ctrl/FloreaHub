import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Clock, Zap, Leaf, Camera, ChevronRight, Package } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloristProducts from "@/components/FloristProducts";
import { FLORISTS } from "@/lib/data";

const REVIEWS = [
  { name: "Nurul Ain", rating: 5, date: "2 days ago", comment: "Absolutely stunning bouquet. The florist sent a real photo before delivery and it looked even better in person. Highly recommend!" },
  { name: "Ahmad Faizal", rating: 5, date: "1 week ago", comment: "Ordered for our anniversary. Quick response, on-time delivery, and the flowers were still fresh after 5 days. Exceptional service." },
  { name: "Siti Hajar", rating: 4, date: "2 weeks ago", comment: "Beautiful arrangement and great packaging. Slightly delayed but still within the promised window. Will order again." },
];


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
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Products (6)</h2>
              <FloristProducts floristName={florist.name} />
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
