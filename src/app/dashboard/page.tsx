"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Flower2, LayoutDashboard, Package, ShoppingBag, Star, Settings,
  TrendingUp, Clock, CheckCircle, AlertCircle, Plus, ArrowRight,
  ChevronUp, Bell, LogOut, Menu, Megaphone, Loader2, Store, X
} from "lucide-react";
import { fadeUp, stagger } from "@/lib/animations";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  ready: "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivering: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

const NAV = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: ShoppingBag, label: "Orders", id: "orders" },
  { icon: Package, label: "Products", id: "products" },
  { icon: Star, label: "Reviews", id: "reviews" },
  { icon: Megaphone, label: "Ads", id: "ads", href: "/dashboard/ads" },
  { icon: Settings, label: "Settings", id: "settings" },
];

type Order = {
  id: string; status: string; payment_status: string; total: number;
  recipient_name?: string; created_at: string;
  order_items?: { product_name: string; florist_name: string; price: number; quantity: number }[];
};

type Product = {
  id: string; name: string; price: number; stock: number;
  review_count: number; badge?: string; is_active: boolean;
};

type Florist = { id: string; name: string; plan: string; status: string };

type Review = {
  id: string; rating: number; comment?: string; created_at: string;
  users?: { name: string; avatar_url?: string } | null;
};

export default function DashboardPage() {
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [florist, setFlorist] = useState<Florist | null>(null);
  const [floristLoading, setFloristLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.id) setUserId(d.user.id);
        else setFloristLoading(false);
      })
      .catch(() => setFloristLoading(false));
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/florists?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => setFlorist(d.florists?.[0] ?? null))
      .catch(() => setFlorist(null))
      .finally(() => setFloristLoading(false));
  }, [userId]);

  const reloadProducts = () => {
    if (!florist?.id) return;
    setLoadingProducts(true);
    fetch(`/api/products?floristId=${florist.id}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  };

  useEffect(() => {
    if (!florist?.id) { setLoadingOrders(false); return; }
    fetch(`/api/orders?floristId=${florist.id}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [florist]);

  useEffect(() => {
    reloadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [florist]);

  useEffect(() => {
    if (!florist?.id) { setLoadingReviews(false); return; }
    fetch(`/api/reviews?floristId=${florist.id}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [florist]);

  const stats = useMemo(() => {
    const paidOrders = orders.filter(o => o.payment_status === "paid");
    const pendingOrders = orders.filter(o => o.status === "pending");
    const completedOrders = orders.filter(o => o.status === "delivered");
    const revenue = paidOrders.reduce((s, o) => s + Number(o.total), 0);
    return [
      { label: "Revenue", value: `RM ${revenue.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: "from paid orders", up: revenue > 0, icon: TrendingUp, color: "#2d6a4f" },
      { label: "Pending Orders", value: String(pendingOrders.length), change: `${orders.length} total`, up: pendingOrders.length > 0, icon: Clock, color: "#f59e0b" },
      { label: "Completed", value: String(completedOrders.length), change: "delivered", up: completedOrders.length > 0, icon: CheckCircle, color: "#3b82f6" },
      { label: "Products", value: String(products.length), change: "in catalogue", up: true, icon: Package, color: "#b5294e" },
    ];
  }, [orders, products]);

  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock < 5);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (d > 1) return `${d} days ago`;
    if (d === 1) return "Yesterday";
    if (h >= 1) return `${h} hrs ago`;
    return "Just now";
  };

  if (floristLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center card-premium p-12 max-w-sm">
          <Store size={40} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-500 text-sm mb-6">Sila log masuk untuk akses dashboard.</p>
          <Link href="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  if (!florist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center card-premium p-12 max-w-sm">
          <Store size={40} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Kedai</h2>
          <p className="text-gray-500 text-sm mb-6">Akaun anda belum mempunyai permohonan kedai florist.</p>
          <Link href="/register/florist" className="btn-primary">Mohon Buka Kedai</Link>
        </div>
      </div>
    );
  }

  if (florist.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center card-premium p-12 max-w-sm">
          <Clock size={40} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Permohonan Dalam Semakan</h2>
          <p className="text-gray-500 text-sm mb-6">Kedai <strong>{florist.name}</strong> sedang disemak oleh team kami. Kami akan email anda bila keputusan dibuat.</p>
          <Link href="/" className="btn-secondary">Kembali ke Laman Utama</Link>
        </div>
      </div>
    );
  }

  if (florist.status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center card-premium p-12 max-w-sm">
          <X size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Permohonan Tidak Diluluskan</h2>
          <p className="text-gray-500 text-sm mb-6">Permohonan kedai <strong>{florist.name}</strong> tidak diluluskan pada masa ini.</p>
          <Link href="/register/florist" className="btn-primary">Mohon Semula</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
              <Flower2 size={15} color="white" strokeWidth={1.8} />
            </div>
            <span className="font-semibold text-gray-900">Florea<span style={{ color: "var(--primary)" }}>Hub</span></span>
          </Link>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--primary)" }}>
              {florist.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{florist.name}</p>
              <p className="text-xs text-gray-400 capitalize">{florist.plan} Plan</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ icon: Icon, label, id, href }) => (
            href ? (
              <Link key={id} href={href} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-gray-600 hover:bg-gray-50">
                <Icon size={17} /> {label}
              </Link>
            ) : (
              <button key={id} onClick={() => { setTab(id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === id ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
                style={tab === id ? { background: "var(--primary)" } : {}}
              >
                <Icon size={17} /> {label}
              </button>
            )
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
            <LogOut size={17} /> Back to Site
          </Link>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 capitalize">{NAV.find(n => n.id === tab)?.label || "Dashboard"}</h1>
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <Bell size={18} />
              {orders.filter(o => o.status === "pending").length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "var(--primary)" }} />
              )}
            </button>
            <Link href="/dashboard/ads" className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5">
              <Plus size={14} /> Promote
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {tab === "overview" && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map(({ label, value, change, up, icon: Icon, color }) => (
                  <motion.div key={label} variants={fadeUp} className="card-premium p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-xs text-gray-500 font-medium">{label}</p>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{loadingOrders && loadingProducts ? "..." : value}</p>
                    <div className="flex items-center gap-1 text-xs">
                      {up && <ChevronUp size={12} className="text-emerald-500" />}
                      <span className={up ? "text-emerald-600" : "text-gray-400"}>{change}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Recent Orders */}
              <motion.div variants={fadeUp} className="card-premium p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-gray-900">Recent Orders</h3>
                  <button onClick={() => setTab("orders")} className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: "var(--primary)" }}>
                    View all <ArrowRight size={12} />
                  </button>
                </div>
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No orders yet.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 4).map(order => {
                      const firstItem = order.order_items?.[0];
                      return (
                        <div key={order.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                            {(order.recipient_name || "?")[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{firstItem?.product_name || "Order"}</p>
                            <p className="text-xs text-gray-400">{order.recipient_name || "Customer"} · {timeAgo(order.created_at)}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">RM{Number(order.total).toFixed(2)}</span>
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize whitespace-nowrap ${STATUS_STYLE[order.status] || ""}`}>{order.status}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Low stock alert */}
              {lowStockProducts.length > 0 && (
                <motion.div variants={fadeUp} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
                  <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Low Stock Alert</p>
                    <p className="text-xs text-amber-700">
                      {lowStockProducts.map(p => p.name).join(", ")} — consider restocking soon.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {tab === "orders" && (
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.div variants={fadeUp} className="card-premium overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">All Orders</h3>
                  <span className="text-xs text-gray-500">{loadingOrders ? "..." : `${orders.length} orders`}</span>
                </div>
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">No orders yet. Share your shop link to get started!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          {["Order ID", "Customer", "Product", "Amount", "Status", "Payment", "Time"].map(h => (
                            <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => {
                          const firstItem = o.order_items?.[0];
                          return (
                            <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-4 font-mono text-xs text-gray-500">{o.id.slice(0, 12)}...</td>
                              <td className="px-5 py-4 font-medium text-gray-900">{o.recipient_name || "—"}</td>
                              <td className="px-5 py-4 text-gray-600 max-w-[140px] truncate">{firstItem?.product_name || "—"}</td>
                              <td className="px-5 py-4 font-semibold text-gray-900">RM{Number(o.total).toFixed(2)}</td>
                              <td className="px-5 py-4"><span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${STATUS_STYLE[o.status] || ""}`}>{o.status}</span></td>
                              <td className="px-5 py-4">
                                <span className={`text-xs font-medium capitalize ${o.payment_status === "paid" ? "text-emerald-600" : o.payment_status === "failed" ? "text-red-500" : "text-amber-600"}`}>
                                  {o.payment_status}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-gray-400 text-xs">{timeAgo(o.created_at)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {tab === "products" && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
              <motion.div variants={fadeUp} className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{loadingProducts ? "..." : `${products.length} products`}</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddProduct(true)} className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
                    <Plus size={13} /> Add Product
                  </button>
                  <Link href="/dashboard/ads" className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5">
                    <Megaphone size={13} /> Promote Products
                  </Link>
                </div>
              </motion.div>
              {loadingProducts ? (
                <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
              ) : products.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No products yet.</p>
              ) : (
                products.map(p => (
                  <motion.div key={p.id} variants={fadeUp} className="card-premium p-5 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                        {p.badge && <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: "var(--primary)" }}>{p.badge}</span>}
                      </div>
                      <p className="text-xs text-gray-500">{p.review_count} reviews · {p.stock} in stock</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">RM{Number(p.price).toFixed(2)}</p>
                      <p className={`text-xs ${p.stock < 5 && p.stock > 0 ? "text-amber-600 font-medium" : p.stock === 0 ? "text-red-500" : "text-gray-400"}`}>
                        {p.stock === 0 ? "Out of stock" : p.stock < 5 ? "Low stock" : "In stock"}
                      </p>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                      <Settings size={15} />
                    </button>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {tab === "reviews" && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
              <motion.div variants={fadeUp}>
                <p className="text-sm text-gray-500">{loadingReviews ? "..." : `${reviews.length} reviews`}</p>
              </motion.div>
              {loadingReviews ? (
                <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No reviews yet.</p>
              ) : (
                reviews.map(r => (
                  <motion.div key={r.id} variants={fadeUp} className="card-premium p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900 text-sm">{r.users?.name ?? "Anonymous"}</p>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} size={13} className={n <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                    <p className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {tab === "settings" && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-400">
                <p className="text-lg font-medium mb-2 text-gray-600 capitalize">Settings</p>
                <p className="text-sm">Coming soon — full settings management</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {showAddProduct && (
        <AddProductModal
          floristId={florist.id}
          onClose={() => setShowAddProduct(false)}
          onCreated={() => { setShowAddProduct(false); reloadProducts(); }}
        />
      )}
    </div>
  );
}

function AddProductModal({ floristId, onClose, onCreated }: { floristId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("daily");
  const [stock, setStock] = useState("10");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          floristId,
          name,
          price: Number(price),
          category,
          stock: Number(stock),
          imageUrl: imageUrl || null,
          description: description || null,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      onCreated();
    } catch {
      setError("Gagal tambah produk. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Add Product</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Classic Red Rose Bouquet" className="input-premium w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (RM)</label>
              <input required type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="120" className="input-premium w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock</label>
              <input required type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className="input-premium w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input-premium w-full">
              {["daily", "birthday", "anniversary", "wedding", "corporate", "sympathy"].map(c => (
                <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL (optional)</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="input-premium w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="input-premium w-full resize-none" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Add Product</span><ArrowRight size={15} /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
