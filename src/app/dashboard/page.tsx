"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Flower2, LayoutDashboard, Package, ShoppingBag, Star, Settings,
  TrendingUp, Clock, CheckCircle, AlertCircle, Plus, ArrowRight,
  ChevronUp, Bell, LogOut, Menu, Megaphone, Loader2, Store, X, Save, Trash2
} from "lucide-react";
import { fadeUp, stagger } from "@/lib/animations";
import { toast } from "@/components/Toast";
import { StatCardSkeleton, RowSkeleton } from "@/components/ui/skeleton";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  ready: "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivering: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_FLOW = ["pending", "processing", "ready", "delivering", "delivered", "cancelled"];

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
  description?: string | null; category?: string; image_url?: string | null; same_day?: boolean;
};

type Florist = {
  id: string; name: string; plan: string; status: string;
  description?: string | null; address?: string | null; city?: string; state?: string;
  phone?: string | null; email?: string | null; cover_image?: string | null; same_day_delivery?: boolean;
  min_order?: number; delivery_fee?: number;
};

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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [settingsForm, setSettingsForm] = useState({
    name: "", description: "", address: "", city: "", state: "",
    phone: "", email: "", cover_image: "", same_day_delivery: false, min_order: 0, delivery_fee: 0,
  });
  const [savingSettings, setSavingSettings] = useState(false);

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

  useEffect(() => {
    if (!florist) return;
    setSettingsForm({
      name: florist.name ?? "",
      description: florist.description ?? "",
      address: florist.address ?? "",
      city: florist.city ?? "",
      state: florist.state ?? "",
      phone: florist.phone ?? "",
      email: florist.email ?? "",
      cover_image: florist.cover_image ?? "",
      same_day_delivery: florist.same_day_delivery ?? false,
      min_order: florist.min_order ?? 0,
      delivery_fee: florist.delivery_fee ?? 0,
    });
  }, [florist]);

  const handleSaveSettings = async () => {
    if (!florist?.id) return;
    setSavingSettings(true);
    try {
      const res = await fetch("/api/florists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floristId: florist.id, ...settingsForm }),
      });
      if (!res.ok) throw new Error();
      setFlorist(f => f ? { ...f, ...settingsForm } : f);
      toast.success("Shop settings updated.");
    } catch {
      toast.error("Couldn't save settings. Try again.");
    } finally {
      setSavingSettings(false);
    }
  };

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (!res.ok) throw new Error();
      setOrders(list => list.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success("Order status updated.");
    } catch {
      toast.error("Couldn't update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

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
                {loadingOrders && loadingProducts ? (
                  [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
                ) : (
                  stats.map(({ label, value, change, up, icon: Icon, color }) => (
                    <motion.div key={label} variants={fadeUp} className="card-premium p-5">
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-xs text-gray-500 font-medium">{label}</p>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                          <Icon size={16} style={{ color }} />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
                      <div className="flex items-center gap-1 text-xs">
                        {up && <ChevronUp size={12} className="text-emerald-500" />}
                        <span className={up ? "text-emerald-600" : "text-gray-400"}>{change}</span>
                      </div>
                    </motion.div>
                  ))
                )}
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
                  <div className="space-y-1">{[...Array(4)].map((_, i) => <RowSkeleton key={i} />)}</div>
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
                  <div className="p-5 space-y-1">{[...Array(6)].map((_, i) => <RowSkeleton key={i} />)}</div>
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
                              <td className="px-5 py-4">
                                <select
                                  value={o.status}
                                  disabled={updatingOrderId === o.id}
                                  onChange={e => handleUpdateOrderStatus(o.id, e.target.value)}
                                  className={`text-xs pl-2.5 pr-6 py-1 rounded-full border font-medium capitalize appearance-none cursor-pointer disabled:opacity-50 ${STATUS_STYLE[o.status] || ""}`}
                                >
                                  {STATUS_FLOW.map(s => <option key={s} value={s} className="bg-white text-gray-900">{s}</option>)}
                                </select>
                              </td>
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
                <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card-premium p-5"><RowSkeleton /></div>)}</div>
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
                    <button onClick={() => setEditingProduct(p)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
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
                <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card-premium p-5"><RowSkeleton /></div>)}</div>
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
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 max-w-2xl">
              <motion.div variants={fadeUp} className="card-premium p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Shop Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Photo</label>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                        {settingsForm.cover_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={settingsForm.cover_image} alt="Shop photo" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">None</div>
                        )}
                      </div>
                      <input value={settingsForm.cover_image} onChange={e => setSettingsForm(f => ({ ...f, cover_image: e.target.value }))} placeholder="https://..." className="input-premium flex-1" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">Paste an image URL. Shown on your shop card and shop page.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                    <textarea value={settingsForm.description} onChange={e => setSettingsForm(f => ({ ...f, description: e.target.value }))} rows={3} className="input-premium w-full resize-none" placeholder="Tell customers what makes your shop special..." />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="card-premium p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-gray-900">Shop Name, Contact &amp; Location</h3>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Locked</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Shop Name</p>
                    <p className="text-gray-700 font-medium">{settingsForm.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Contact Email</p>
                    <p className="text-gray-700 font-medium">{settingsForm.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Contact Phone</p>
                    <p className="text-gray-700 font-medium">{settingsForm.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">City / State</p>
                    <p className="text-gray-700 font-medium">{[settingsForm.city, settingsForm.state].filter(Boolean).join(", ") || "—"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-gray-400 text-xs mb-1">Address</p>
                    <p className="text-gray-700 font-medium">{settingsForm.address || "—"}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-4">Need to change these? <Link href="/contact" className="underline hover:text-gray-600">Contact support</Link> — they&apos;re locked to keep your verified details consistent.</p>
              </motion.div>

              <motion.div variants={fadeUp} className="card-premium p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Delivery</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <div
                      onClick={() => setSettingsForm(f => ({ ...f, same_day_delivery: !f.same_day_delivery }))}
                      className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0"
                      style={{ background: settingsForm.same_day_delivery ? "var(--primary)" : "#e5e7eb" }}
                    >
                      <motion.div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow" animate={{ left: settingsForm.same_day_delivery ? "17px" : "2px" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                    </div>
                    <span className="text-sm text-gray-700">Offer same-day delivery</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum Order (RM)</label>
                      <input type="number" min={0} value={settingsForm.min_order} onChange={e => setSettingsForm(f => ({ ...f, min_order: Number(e.target.value) }))} className="input-premium w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Fee (RM)</label>
                      <input type="number" min={0} value={settingsForm.delivery_fee} onChange={e => setSettingsForm(f => ({ ...f, delivery_fee: Number(e.target.value) }))} className="input-premium w-full" />
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="flex justify-end">
                <button onClick={handleSaveSettings} disabled={savingSettings} className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2 disabled:opacity-60">
                  {savingSettings ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {savingSettings ? "Saving..." : "Save Changes"}
                </button>
              </motion.div>
            </motion.div>
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

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={() => { setEditingProduct(null); reloadProducts(); }}
          onDeleted={() => { setEditingProduct(null); reloadProducts(); }}
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

function EditProductModal({
  product, onClose, onSaved, onDeleted,
}: { product: Product; onClose: () => void; onSaved: () => void; onDeleted: () => void }) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [category, setCategory] = useState(product.category ?? "daily");
  const [stock, setStock] = useState(String(product.stock));
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [isActive, setIsActive] = useState(product.is_active);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          name, price: Number(price), category, stock: Number(stock),
          image_url: imageUrl || null, description: description || null,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      toast.success("Product updated.");
      onSaved();
    } catch {
      setError("Gagal kemaskini produk. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setDeleting(false); return; }
      toast.success("Product deleted.");
      onDeleted();
    } catch {
      setError("Gagal padam produk. Sila cuba lagi.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Edit Product</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="input-premium w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (RM)</label>
              <input required type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="input-premium w-full" />
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
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setIsActive(v => !v)}
              className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0"
              style={{ background: isActive ? "var(--primary)" : "#e5e7eb" }}
            >
              <motion.div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow" animate={{ left: isActive ? "17px" : "2px" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            </div>
            <span className="text-sm text-gray-700">Active (visible in shop)</span>
          </label>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading || deleting} className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={15} /><span>Save Changes</span></>}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-100">
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} disabled={loading || deleting} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <Trash2 size={14} /> Delete Product
            </button>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-sm text-red-700 font-medium mb-3">Delete this product permanently?</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} disabled={deleting} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 text-sm py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
