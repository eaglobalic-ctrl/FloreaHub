import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Clock, Zap, Leaf, Camera, ChevronRight, Package, Phone, Mail, BadgeCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloristProducts from "@/components/FloristProducts";
import ChatWidget from "@/components/ChatWidget";
import ResponseRateBadge from "@/components/ResponseRateBadge";
import { getSupabaseAdmin } from "@/lib/supabase";

async function getFlorist(id: string) {
  try {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from("florists")
      .select("*, products(*), reviews(*)")
      .eq("id", id)
      .eq("is_active", true)
      .single();
    return data;
  } catch {
    return null;
  }
}

export default async function FloristDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const florist = await getFlorist(id);
  if (!florist) notFound();

  const reviews: { id: string; rating: number; comment: string; created_at: string }[] = florist.reviews ?? [];
  const products: Record<string, unknown>[] = florist.products ?? [];

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <Navbar />

      {/* ── HERO BANNER ── */}
      <div className="relative h-64 sm:h-80 bg-gray-900 overflow-hidden">
        {florist.cover_image ? (
          <Image src={florist.cover_image} alt={florist.name} fill priority className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">No image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />

        <div className="absolute top-4 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-white/70">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={14} />
              <Link href="/florists" className="hover:text-white transition-colors">Florists</Link>
              <ChevronRight size={14} />
              <span className="text-white font-medium">{florist.name}</span>
            </nav>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{florist.name}</h1>
                {florist.is_verified && <BadgeCheck size={22} className="text-blue-400 flex-shrink-0" fill="#3b82f6" stroke="white" />}
              </div>
              <div className="flex items-center gap-4 text-white/85 text-sm flex-wrap">
                <span className="flex items-center gap-1.5"><MapPin size={13} /> {florist.city}, {florist.state}</span>
                <span className="flex items-center gap-1.5"><Star size={13} className="text-amber-400" fill="currentColor" /> {Number(florist.rating || 0).toFixed(1)} ({florist.review_count || 0} reviews)</span>
              </div>
            </div>
            <Link href={`/builder?florist=${florist.id}`} className="btn-primary text-sm whitespace-nowrap">
              Custom Bouquet with This Florist
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden sticky top-24">
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { value: Number(florist.rating || 0).toFixed(1), label: "Rating" },
                    { value: florist.review_count || 0, label: "Reviews" },
                    { value: products.length, label: "Products" },
                  ].map((s) => (
                    <div key={s.label} className="text-center py-3 bg-gray-50 rounded-lg">
                      <div className="font-bold text-gray-900 text-base">{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>

                {florist.description && (
                  <p className="text-sm text-gray-500 leading-relaxed mb-5">{florist.description}</p>
                )}

                <div className="space-y-2.5 mb-5 text-sm">
                  {florist.is_verified && (
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Leaf size={13} style={{ color: "var(--accent)" }} />
                      </div>
                      Freshness Guaranteed
                    </div>
                  )}
                  {florist.same_day_delivery && (
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
                  <ResponseRateBadge floristId={florist.id} />
                </div>

                <div className="text-sm divide-y divide-gray-50 mb-5">
                  {florist.min_order > 0 && (
                    <div className="flex justify-between py-2.5">
                      <span className="text-gray-500 flex items-center gap-1.5"><Package size={13} /> Min. order</span>
                      <span className="font-medium text-gray-700">RM{florist.min_order}</span>
                    </div>
                  )}
                  {florist.delivery_fee >= 0 && (
                    <div className="flex justify-between py-2.5">
                      <span className="text-gray-500 flex items-center gap-1.5"><Clock size={13} /> Delivery fee</span>
                      <span className="font-medium text-gray-700">{florist.delivery_fee > 0 ? `RM${florist.delivery_fee}` : "Free"}</span>
                    </div>
                  )}
                  {florist.phone && (
                    <div className="flex justify-between py-2.5">
                      <span className="text-gray-500 flex items-center gap-1.5"><Phone size={13} /> Phone</span>
                      <span className="font-medium text-gray-700">{florist.phone}</span>
                    </div>
                  )}
                  {florist.email && (
                    <div className="flex justify-between py-2.5">
                      <span className="text-gray-500 flex items-center gap-1.5"><Mail size={13} /> Email</span>
                      <span className="font-medium text-gray-700 text-xs">{florist.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Link href={`/builder?florist=${florist.id}`} className="btn-primary w-full justify-center text-sm">
                    Custom Bouquet with This Florist
                  </Link>
                  <ChatWidget floristId={florist.id} floristName={florist.name} />
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Products ({products.length})</h2>
              <FloristProducts floristId={florist.id} floristName={florist.name} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Customer Reviews</h2>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">{Number(florist.rating || 0).toFixed(1)}</span>
                  <div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-amber-400" fill="currentColor" />)}
                    </div>
                    <div className="text-xs text-gray-400">{florist.review_count || 0} reviews</div>
                  </div>
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((r, i) => (
                    <div key={r.id || i} className="bg-white rounded-xl border border-gray-100 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ background: "var(--primary)" }}>
                            {String(r.comment || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Verified Customer</div>
                            <div className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("en-MY")}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(r.rating)].map((_, j) => <Star key={j} size={11} className="text-amber-400" fill="currentColor" />)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                  <Star size={24} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No reviews yet. Be the first to review!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
