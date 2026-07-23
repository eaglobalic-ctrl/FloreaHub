"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Check, X, Clock, Users, Store, Mail, MapPin, Phone, ShieldCheck, LogOut,
  LayoutDashboard, DollarSign, ShoppingBag, Package, Star, MessageCircle,
  Megaphone, CreditCard, Activity, Loader2, Ban, Trash2, Edit2, Save, TrendingUp, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { fadeUp, stagger } from "@/lib/animations";
import { isAdminEmail } from "@/lib/admin";
import { toast } from "@/components/Toast";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "financial", label: "Financial", icon: DollarSign },
  { id: "florists", label: "Florists", icon: Store },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "users", label: "Users", icon: Users },
  { id: "products", label: "Products", icon: Package },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "chat", label: "Chat Moderation", icon: MessageCircle },
  { id: "ads", label: "Ads", icon: Megaphone },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "contact", label: "Contact Inbox", icon: Mail },
  { id: "system", label: "System", icon: Activity },
  { id: "errors", label: "Error Log", icon: AlertTriangle },
];

const money = (n: number) => `RM${(Number(n) || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (d?: string | null) => d ? new Date(d).toLocaleString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card-premium p-5 ${className}`}>{children}</div>;
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="card-premium p-12 text-center">
      <Icon size={32} className="text-gray-200 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}

function Loading() {
  return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-300" /></div>;
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => setIsAdmin(isAdminEmail(d.user?.email)))
      .catch(() => setIsAdmin(false))
      .finally(() => setCheckingAdmin(false));
  }, []);

  if (checkingAdmin) return <div className="min-h-screen bg-gray-50" />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center card-premium p-12 max-w-sm">
          <ShieldCheck size={40} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-500 text-sm mb-6">Log in dengan akaun admin untuk akses page ini.</p>
          <Link href="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-40 transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-400 mt-0.5">FloreaHub</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400"><X size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => { setTab(n.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${tab === n.id ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
              style={tab === n.id ? { background: "var(--primary)" } : {}}
            >
              <n.icon size={16} /> {n.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <LogOut size={14} /> Exit Admin
          </Link>
        </div>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/30 z-30 lg:hidden" />}

      <main className="flex-1 min-w-0 p-6 lg:p-8">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden mb-4 text-sm text-gray-500 font-medium">☰ Menu</button>
        <motion.div key={tab} variants={stagger} initial="hidden" animate="show" className="max-w-5xl">
          {tab === "overview" && <OverviewTab />}
          {tab === "financial" && <FinancialTab />}
          {tab === "florists" && <FloristsTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "users" && <UsersTab />}
          {tab === "products" && <ProductsTab />}
          {tab === "reviews" && <ReviewsTab />}
          {tab === "chat" && <ChatModerationTab />}
          {tab === "ads" && <AdsTab />}
          {tab === "subscriptions" && <SubscriptionsTab />}
          {tab === "contact" && <ContactTab />}
          {tab === "system" && <SystemTab />}
          {tab === "errors" && <ErrorsTab />}
        </motion.div>
      </main>
    </div>
  );
}

// ── Overview (6.9) ──────────────────────────────────────────────────────────

function OverviewTab() {
  const [stats, setStats] = useState<{
    totalUsers: number; floristsByStatus: Record<string, number>; totalOrders: number;
    gmv: number; adsRevenue: number; subscriptionRevenue: number; commissionEarned: number; totalCompanyRevenue: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(setStats).catch(() => setStats(null));
  }, []);

  if (!stats) return <Loading />;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Approved Florists", value: stats.floristsByStatus.approved ?? 0, icon: Store, color: "text-emerald-600 bg-emerald-50" },
    { label: "Paid Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-purple-600 bg-purple-50" },
    { label: "GMV (product orders)", value: money(stats.gmv), icon: TrendingUp, color: "text-rose-600 bg-rose-50" },
    { label: "Commission Earned (2%)", value: money(stats.commissionEarned), icon: DollarSign, color: "text-amber-600 bg-amber-50" },
    { label: "Ads Revenue", value: money(stats.adsRevenue), icon: Megaphone, color: "text-indigo-600 bg-indigo-50" },
    { label: "Subscription Revenue", value: money(stats.subscriptionRevenue), icon: CreditCard, color: "text-cyan-600 bg-cyan-50" },
    { label: "Total Company Revenue", value: money(stats.totalCompanyRevenue), icon: DollarSign, color: "text-gray-900 bg-gray-100" },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Platform Overview</h2>
      <p className="text-sm text-gray-500 mb-6">Users, florists, orders and revenue across FloreaHub.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {cards.map(c => (
          <motion.div key={c.label} variants={fadeUp} className="card-premium p-5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${c.color}`}><c.icon size={17} /></div>
            <p className="text-xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </motion.div>
        ))}
      </div>
      <Card>
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Florist Applications</h3>
        <div className="flex gap-6 text-sm">
          <span className="text-amber-600 font-medium">{stats.floristsByStatus.pending ?? 0} pending</span>
          <span className="text-emerald-600 font-medium">{stats.floristsByStatus.approved ?? 0} approved</span>
          <span className="text-red-500 font-medium">{stats.floristsByStatus.rejected ?? 0} rejected</span>
        </div>
      </Card>
    </div>
  );
}

// ── Financial (6.1) ──────────────────────────────────────────────────────────

type PayoutOrder = {
  id: string; total: number; subtotal: number; delivery_fee: number; split_amount: number | null; created_at: string;
  delivered_at: string | null; buyer_confirmed_at: string | null;
  florists: { id: string; name: string; email: string; toyyibpay_username: string | null } | null;
};

// 2% platform commission applies only to the product subtotal — the
// florist keeps the full delivery fee since they fulfil delivery themselves.
const payoutOwed = (o: PayoutOrder) => Number(o.subtotal) * 0.98 + Number(o.delivery_fee);

function FinancialTab() {
  const [data, setData] = useState<{
    readyForPayout: PayoutOrder[]; readyForPayoutCount: number; readyForPayoutOwed: number;
    awaitingConfirmation: PayoutOrder[]; awaitingConfirmationCount: number;
  } | null>(null);
  const [payingOut, setPayingOut] = useState<string | null>(null);

  const load = () => fetch("/api/admin/financial").then(r => r.json()).then(setData).catch(() => setData(null));
  useEffect(() => { load(); }, []);

  const markPaidOut = async (orderId: string) => {
    if (!confirm("Confirm you've ALREADY sent this money to the florist (bank transfer/DuitNow) — this only records it, it doesn't move any money.")) return;
    setPayingOut(orderId);
    try {
      const res = await fetch("/api/admin/financial", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
      const d = await res.json();
      if (d.error) { toast.error(d.error); return; }
      toast.success("Marked as paid out.");
      load();
    } catch { toast.error("Failed."); }
    setPayingOut(null);
  };

  if (!data) return <Loading />;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Financial Dashboard</h2>
      <p className="text-sm text-gray-500 mb-6">Escrow model — 100% collects to the platform, florists are paid out manually once the buyer confirms receipt.</p>

      <Card className="mb-6 border-emerald-200 bg-emerald-50/40">
        <div className="flex items-center gap-3 mb-1">
          <DollarSign size={18} className="text-emerald-600" />
          <h3 className="font-semibold text-gray-900">Ready for Payout</h3>
        </div>
        <p className="text-sm text-gray-600">
          {data.readyForPayoutCount} order{data.readyForPayoutCount === 1 ? "" : "s"} confirmed received by buyer — pay these out. Total owed: <strong>{money(data.readyForPayoutOwed)}</strong>.
        </p>
      </Card>

      {data.readyForPayout.length === 0 ? (
        <EmptyState icon={Check} text="Nothing ready for payout right now." />
      ) : (
        <div className="space-y-3 mb-8">
          {data.readyForPayout.map(o => (
            <Card key={o.id}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{o.florists?.name ?? "Unknown florist"}</p>
                  <p className="text-xs text-gray-400">{o.florists?.email} · Order {o.id} · confirmed {fmtDate(o.buyer_confirmed_at)}</p>
                  {!o.florists?.toyyibpay_username && <p className="text-xs text-amber-600 mt-1">No ToyyibPay username on file — pay via bank transfer instead</p>}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-gray-900">{money(payoutOwed(o))}</p>
                  <button onClick={() => markPaidOut(o.id)} disabled={payingOut === o.id} className="text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-50" style={{ background: "var(--primary)" }}>
                    {payingOut === o.id ? "..." : "Mark Paid Out"}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="mb-4 border-amber-200 bg-amber-50/40">
        <div className="flex items-center gap-3 mb-1">
          <Clock size={18} className="text-amber-600" />
          <h3 className="font-semibold text-gray-900">Awaiting Buyer Confirmation</h3>
        </div>
        <p className="text-sm text-gray-600">
          {data.awaitingConfirmationCount} paid order{data.awaitingConfirmationCount === 1 ? "" : "s"} not yet delivered or not yet confirmed by the buyer — not payable yet. Auto-confirms 3 days after delivery if the buyer doesn't act.
        </p>
      </Card>

      {data.awaitingConfirmation.length > 0 && (
        <div className="space-y-2">
          {data.awaitingConfirmation.map(o => (
            <div key={o.id} className="card-premium p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium text-gray-900 text-sm">{o.florists?.name ?? "Unknown florist"}</p>
                <p className="text-xs text-gray-400">Order {o.id} · {o.delivered_at ? `delivered ${fmtDate(o.delivered_at)}` : "not yet delivered"}</p>
              </div>
              <p className="font-semibold text-gray-500">{money(payoutOwed(o))}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Florists (6.3, extends existing approve/reject) ─────────────────────────

type FloristRow = {
  id: string; name: string; email: string; phone?: string; status: string;
  city?: string; state?: string; address?: string; is_active: boolean; plan: string; created_at: string;
};

function FloristsTab() {
  const [florists, setFlorists] = useState<FloristRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [editing, setEditing] = useState<FloristRow | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/florists").then(r => r.json()).then(d => setFlorists(d.florists ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleStatus = async (floristId: string, status: "approved" | "rejected") => {
    setActionLoading(floristId + status);
    try {
      const res = await fetch("/api/florists", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ floristId, status }) });
      if (res.ok) setFlorists(prev => prev.map(f => f.id === floristId ? { ...f, status } : f));
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleSuspend = async (floristId: string, is_active: boolean) => {
    setActionLoading(floristId + "suspend");
    try {
      const res = await fetch("/api/admin/florists", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ floristId, is_active }) });
      if (res.ok) setFlorists(prev => prev.map(f => f.id === floristId ? { ...f, is_active } : f));
      else toast.error("Failed to update.");
    } catch { toast.error("Failed to update."); }
    setActionLoading(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const res = await fetch("/api/admin/florists", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floristId: editing.id, name: editing.name, email: editing.email, phone: editing.phone, city: editing.city, state: editing.state, address: editing.address }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setFlorists(prev => prev.map(f => f.id === editing.id ? { ...f, ...data.florist } : f));
      setEditing(null);
      toast.success("Florist details updated.");
    } catch { toast.error("Failed to save."); }
  };

  const filtered = florists.filter(f => filter === "all" || f.status === filter);
  const counts = {
    pending: florists.filter(f => f.status === "pending").length,
    approved: florists.filter(f => f.status === "approved").length,
    rejected: florists.filter(f => f.status === "rejected").length,
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Florists</h2>
      <p className="text-sm text-gray-500 mb-6">Applications, suspension, and support edits for locked fields.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending", count: counts.pending, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: <Clock size={18} className="text-amber-500" /> },
          { label: "Approved", count: counts.approved, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: <Check size={18} className="text-emerald-500" /> },
          { label: "Rejected", count: counts.rejected, color: "text-red-500", bg: "bg-red-50 border-red-200", icon: <X size={18} className="text-red-400" /> },
        ].map(s => (
          <div key={s.label} className={`border rounded-2xl p-4 ${s.bg}`}>
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs font-medium text-gray-500">{s.label}</span></div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {(["pending", "approved", "rejected", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${filter === f ? "text-white shadow-sm" : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"}`} style={filter === f ? { background: "var(--primary)" } : {}}>
            {f} {f !== "all" && `(${counts[f]})`}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <EmptyState icon={Users} text="No records here." />
      ) : (
        <div className="space-y-4">
          {filtered.map(florist => (
            <Card key={florist.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: "var(--accent)" }}>
                    {florist.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-semibold text-gray-900 truncate">{florist.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${florist.status === "pending" ? "bg-amber-100 text-amber-700" : florist.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{florist.status}</span>
                      {!florist.is_active && florist.status === "approved" && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-200 text-gray-600">Suspended</span>}
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 capitalize">{florist.plan}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Mail size={10} />{florist.email}</span>
                      {florist.phone && <span className="flex items-center gap-1"><Phone size={10} />{florist.phone}</span>}
                      {florist.city && <span className="flex items-center gap-1"><MapPin size={10} />{florist.city}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Registered: {fmtDate(florist.created_at)}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0 items-end">
                  {florist.status === "pending" ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleStatus(florist.id, "approved")} disabled={!!actionLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                        {actionLoading === florist.id + "approved" ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
                      </button>
                      <button onClick={() => handleStatus(florist.id, "rejected")} disabled={!!actionLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                        {actionLoading === florist.id + "rejected" ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />} Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(florist)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                        <Edit2 size={12} /> Edit
                      </button>
                      {florist.status === "approved" && (
                        <button onClick={() => handleSuspend(florist.id, !florist.is_active)} disabled={!!actionLoading} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${florist.is_active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                          {actionLoading === florist.id + "suspend" ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />} {florist.is_active ? "Suspend" : "Reinstate"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">Edit {editing.name}</h3>
            <div className="space-y-3">
              {(["name", "email", "phone", "city", "state", "address"] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{field}</label>
                  <input value={editing[field] ?? ""} onChange={e => setEditing(f => f ? { ...f, [field]: e.target.value } : f)} className="input-premium w-full text-sm" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button onClick={saveEdit} className="btn-primary text-sm py-2 px-4 flex items-center gap-2"><Save size={14} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Orders (6.2) ──────────────────────────────────────────────────────────

type AdminOrder = {
  id: string; status: string; payment_status: string; total: number; created_at: string;
  delivered_at: string | null; buyer_confirmed_at: string | null; payout_completed_at: string | null;
  florists: { name: string } | null; order_items?: { product_name: string; quantity: number }[];
};

function StatusPill({ ok, okLabel, notLabel }: { ok: boolean; okLabel: string; notLabel: string }) {
  return ok
    ? <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700"><Check size={11} /> {okLabel}</span>
    : <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500"><Clock size={11} /> {notLabel}</span>;
}

function OrdersTab() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/orders").then(r => r.json()).then(d => setOrders(d.orders ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleRefund = async (orderId: string) => {
    if (!confirm(`Mark order ${orderId} as refunded? This only records the refund — process the actual money movement (ToyyibPay/bank) separately first.`)) return;
    setBusy(orderId);
    try {
      const res = await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, action: "refund" }) });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: "refunded", status: "cancelled" } : o));
      toast.success("Order marked as refunded.");
    } catch { toast.error("Failed."); }
    setBusy(null);
  };

  const paidOrders = orders.filter(o => o.payment_status === "paid");
  const tally = {
    total: paidOrders.length,
    delivered: paidOrders.filter(o => !!o.delivered_at).length,
    confirmed: paidOrders.filter(o => !!o.buyer_confirmed_at).length,
    paidOut: paidOrders.filter(o => !!o.payout_completed_at).length,
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Orders</h2>
      <p className="text-sm text-gray-500 mb-6">Platform-wide order oversight. Showing latest 100.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Paid Orders", value: tally.total, color: "text-gray-900" },
          { label: "Seller Delivered", value: tally.delivered, color: "text-blue-600" },
          { label: "Buyer Confirmed", value: tally.confirmed, color: "text-emerald-600" },
          { label: "Paid Out", value: tally.paidOut, color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="card-premium p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? <Loading /> : orders.length === 0 ? <EmptyState icon={ShoppingBag} text="No orders yet." /> : (
        <div className="space-y-3">
          {orders.map(o => (
            <Card key={o.id}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-mono text-xs text-gray-400">{o.id}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : o.payment_status === "refunded" ? "bg-gray-200 text-gray-600" : o.payment_status === "failed" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>{o.payment_status}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 capitalize">{o.status}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1.5">{o.florists?.name ?? "FloreaHub (builder/unassigned)"} · {o.order_items?.length ?? 0} item(s) · {fmtDate(o.created_at)}</p>
                  {o.payment_status === "paid" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusPill ok={!!o.delivered_at} okLabel={`Seller: Delivered ${fmtDate(o.delivered_at)}`} notLabel="Seller: Not delivered yet" />
                      <StatusPill ok={!!o.buyer_confirmed_at} okLabel={`Buyer: Confirmed ${fmtDate(o.buyer_confirmed_at)}`} notLabel="Buyer: Not confirmed yet" />
                      <StatusPill ok={!!o.payout_completed_at} okLabel="Payout: Done" notLabel="Payout: Pending" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-gray-900">{money(o.total)}</p>
                  {o.payment_status === "paid" && (
                    <button onClick={() => handleRefund(o.id)} disabled={busy === o.id} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                      {busy === o.id ? "..." : "Mark Refunded"}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Users / buyers (6.3) ─────────────────────────────────────────────────────

type AdminUser = { id: string; name: string; email: string; phone?: string; role: string; is_active: boolean; created_at: string };

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => setUsers(d.users ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleBan = async (userId: string, is_active: boolean) => {
    setBusy(userId);
    try {
      const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, is_active }) });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active } : u));
      toast.success(is_active ? "User reinstated." : "User suspended.");
    } catch { toast.error("Failed."); }
    setBusy(null);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Users</h2>
      <p className="text-sm text-gray-500 mb-6">All accounts (buyers, florists, admin). Showing latest 200.</p>
      {loading ? <Loading /> : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="card-premium p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{u.role}</span>
                  {!u.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Suspended</span>}
                </div>
                <p className="text-xs text-gray-400">{u.email} {u.phone && `· ${u.phone}`} · Joined {fmtDate(u.created_at)}</p>
              </div>
              <button onClick={() => toggleBan(u.id, !u.is_active)} disabled={busy === u.id} className={`text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${u.is_active ? "border border-red-200 text-red-600 hover:bg-red-50" : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}>
                {busy === u.id ? "..." : u.is_active ? "Suspend" : "Reinstate"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Products (6.4) ──────────────────────────────────────────────────────────

type AdminProduct = { id: string; name: string; price: number; is_active: boolean; florists: { name: string } | null; created_at: string };

function ProductsTab() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/products").then(r => r.json()).then(d => setProducts(d.products ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleActive = async (productId: string, is_active: boolean) => {
    setBusy(productId);
    try {
      const res = await fetch("/api/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, is_active }) });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active } : p));
      toast.success(is_active ? "Product reactivated." : "Product removed from shop.");
    } catch { toast.error("Failed."); }
    setBusy(null);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Product Moderation</h2>
      <p className="text-sm text-gray-500 mb-6">All listings platform-wide. Showing latest 200.</p>
      {loading ? <Loading /> : (
        <div className="space-y-2">
          {products.map(p => (
            <div key={p.id} className="card-premium p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                <p className="text-xs text-gray-400">{p.florists?.name ?? "—"} · {money(p.price)} · Listed {fmtDate(p.created_at)}</p>
              </div>
              <button onClick={() => toggleActive(p.id, !p.is_active)} disabled={busy === p.id} className={`text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${p.is_active ? "border border-red-200 text-red-600 hover:bg-red-50" : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}>
                {busy === p.id ? "..." : p.is_active ? "Remove" : "Restore"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Reviews (6.4) ──────────────────────────────────────────────────────────

type AdminReview = { id: string; rating: number; comment?: string; created_at: string; users: { name: string } | null; florists: { name: string } | null };

function ReviewsTab() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/reviews").then(r => r.json()).then(d => setReviews(d.reviews ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setBusy(reviewId);
    try {
      const res = await fetch("/api/admin/reviews", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewId }) });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success("Review deleted.");
    } catch { toast.error("Failed."); }
    setBusy(null);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Review Moderation</h2>
      <p className="text-sm text-gray-500 mb-6">Remove fake or abusive reviews. Showing latest 150.</p>
      {loading ? <Loading /> : reviews.length === 0 ? <EmptyState icon={Star} text="No reviews yet." /> : (
        <div className="space-y-2">
          {reviews.map(r => (
            <div key={r.id} className="card-premium p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 text-sm">{r.users?.name ?? "Anonymous"}</p>
                    <div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} className={i < r.rating ? "text-amber-400" : "text-gray-200"} fill="currentColor" />)}</div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                  <p className="text-xs text-gray-400 mt-1">{r.florists?.name ?? "—"} · {fmtDate(r.created_at)}</p>
                </div>
                <button onClick={() => handleDelete(r.id)} disabled={busy === r.id} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Chat Moderation (6.5) ────────────────────────────────────────────────────

type BlockedMessage = {
  id: string; content: string; blocked_reason: string; created_at: string; sender_role: string;
  conversations: { users: { name: string; email: string } | null; florists: { name: string } | null } | null;
};

function ChatModerationTab() {
  const [messages, setMessages] = useState<BlockedMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/chat").then(r => r.json()).then(d => setMessages(d.messages ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Chat Moderation</h2>
      <p className="text-sm text-gray-500 mb-6">Audit trail of blocked messages (attempted contact-info/off-platform sharing). Showing latest 150.</p>
      {loading ? <Loading /> : messages.length === 0 ? <EmptyState icon={MessageCircle} text="No blocked messages recorded." /> : (
        <div className="space-y-2">
          {messages.map(m => (
            <div key={m.id} className="card-premium p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium capitalize">{m.blocked_reason}</span>
                <span className="text-xs text-gray-400 capitalize">from {m.sender_role}</span>
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 mb-1.5">{m.content}</p>
              <p className="text-xs text-gray-400">{m.conversations?.users?.name ?? "Buyer"} ↔ {m.conversations?.florists?.name ?? "Florist"} · {fmtDateTime(m.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Ads (6.6) ──────────────────────────────────────────────────────────────

type AdminAd = { id: string; headline: string; florist_name: string; type: string; status: string; budget: number; clicks: number; impressions: number; ends_at: string };

function AdsTab() {
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ads?all=1").then(r => r.json()).then(d => setAds(d.ads ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalRevenue = ads.filter(a => a.status !== "pending").reduce((s, a) => s + (Number(a.budget) || 0), 0);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Ads Oversight</h2>
      <p className="text-sm text-gray-500 mb-6">All campaigns platform-wide. Total revenue: <strong>{money(totalRevenue)}</strong>.</p>
      {loading ? <Loading /> : ads.length === 0 ? <EmptyState icon={Megaphone} text="No ad campaigns yet." /> : (
        <div className="space-y-2">
          {ads.map(a => (
            <div key={a.id} className="card-premium p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-gray-900 text-sm">{a.headline}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === "active" ? "bg-emerald-100 text-emerald-700" : a.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-gray-200 text-gray-600"}`}>{a.status}</span>
                </div>
                <p className="text-xs text-gray-400">{a.florist_name} · {a.type.replace("_", " ")} · {a.impressions} views · {a.clicks} clicks · ends {fmtDate(a.ends_at)}</p>
              </div>
              <p className="font-bold text-gray-900">{money(a.budget)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Subscriptions (6.7) ──────────────────────────────────────────────────────

type AdminSub = { id: string; plan: string; status: string; amount: number; ends_at: string | null; created_at: string; florists: { name: string; email: string } | null };

function SubscriptionsTab() {
  const [subs, setSubs] = useState<AdminSub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscriptions").then(r => r.json()).then(d => setSubs(d.subscriptions ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeCount = subs.filter(s => s.status === "active").length;
  const totalRevenue = subs.filter(s => s.status !== "pending").reduce((s, sb) => s + (Number(sb.amount) || 0), 0);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Subscription Oversight</h2>
      <p className="text-sm text-gray-500 mb-6">{activeCount} active · Total revenue: <strong>{money(totalRevenue)}</strong></p>
      {loading ? <Loading /> : subs.length === 0 ? <EmptyState icon={CreditCard} text="No plan subscriptions yet." /> : (
        <div className="space-y-2">
          {subs.map(s => (
            <div key={s.id} className="card-premium p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-gray-900 text-sm capitalize">{s.florists?.name ?? "—"} — {s.plan === "elite" ? "Premium" : s.plan}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === "active" ? "bg-emerald-100 text-emerald-700" : s.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-gray-200 text-gray-600"}`}>{s.status}</span>
                </div>
                <p className="text-xs text-gray-400">{s.florists?.email} · {s.ends_at ? `ends ${fmtDate(s.ends_at)}` : "no end date"}</p>
              </div>
              <p className="font-bold text-gray-900">{money(s.amount)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Contact inbox (6.8) ──────────────────────────────────────────────────────

type ContactMessage = { id: string; name: string; email: string; topic?: string; message: string; status: string; created_at: string };

function ContactTab() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/contact").then(r => r.json()).then(d => setMessages(d.messages ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/contact", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    } catch { toast.error("Failed."); }
    setBusy(null);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Contact Inbox</h2>
      <p className="text-sm text-gray-500 mb-6">Submissions from the /contact form. Showing latest 150.</p>
      {loading ? <Loading /> : messages.length === 0 ? <EmptyState icon={Mail} text="No messages yet." /> : (
        <div className="space-y-2">
          {messages.map(m => (
            <div key={m.id} className="card-premium p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-gray-900 text-sm">{m.name}</p>
                    {m.topic && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{m.topic}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.status === "new" ? "bg-blue-100 text-blue-700" : m.status === "resolved" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>{m.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{m.message}</p>
                  <p className="text-xs text-gray-400">{m.email} · {fmtDateTime(m.created_at)}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {m.status !== "read" && <button onClick={() => setStatus(m.id, "read")} disabled={busy === m.id} className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">Mark Read</button>}
                  {m.status !== "resolved" && <button onClick={() => setStatus(m.id, "resolved")} disabled={busy === m.id} className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700">Resolve</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── System health (6.10) ─────────────────────────────────────────────────────

function SystemTab() {
  const [data, setData] = useState<{
    config: Record<string, boolean | string | null>;
    activity: { lastOrderAt: string | null; lastPayoutReminderAt: string | null; lastRenewalReminderAt: string | null; hasExpiredAdsProcessed: boolean };
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/system").then(r => r.json()).then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Loading />;

  const configRows = [
    { label: "Gmail SMTP (email sending)", ok: data.config.gmail },
    { label: "ToyyibPay secret key", ok: data.config.toyyibpaySecret },
    { label: "ToyyibPay category code", ok: data.config.toyyibpayCategory },
    { label: "Cron secret", ok: data.config.cronSecret },
    { label: "Admin notification email", ok: data.config.adminEmail, note: data.config.adminEmailSource ? `via ${data.config.adminEmailSource}` : undefined },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">System Health</h2>
      <p className="text-sm text-gray-500 mb-6">
        Environment: <strong className={data.config.toyyibpaySandbox ? "text-amber-600" : "text-emerald-600"}>{data.config.toyyibpaySandbox ? "ToyyibPay Sandbox" : "ToyyibPay Production"}</strong> · App URL: {data.config.appUrl ?? "not set"}
      </p>

      {data.config.appUrlHasTrailingSlash && (
        <Card className="mb-4 border-amber-200 bg-amber-50/40">
          <p className="text-sm text-amber-800">
            <strong>NEXT_PUBLIC_APP_URL has a trailing slash.</strong> The code now strips it automatically, but cleaning it up in Vercel (remove the trailing <code>/</code>) is still recommended to avoid confusion.
          </p>
        </Card>
      )}

      <Card className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Configuration</h3>
        <div className="space-y-2">
          {configRows.map(r => (
            <div key={r.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{r.label}</span>
              {r.ok
                ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><Check size={13} /> Configured{r.note ? ` (${r.note})` : ""}</span>
                : <span className="flex items-center gap-1 text-red-500 text-xs font-medium"><X size={13} /> Missing</span>}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Recent Activity (cron sanity check)</h3>
        <p className="text-xs text-gray-400 mb-3">No dedicated cron-run log exists — these are the most recent side effects each daily cron would produce, as a proxy for "is it running."</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between"><span className="text-gray-600">Last order placed</span><span className="text-gray-900 font-medium">{fmtDateTime(data.activity.lastOrderAt)}</span></div>
          <div className="flex items-center justify-between"><span className="text-gray-600">Last payout reminder sent</span><span className="text-gray-900 font-medium">{fmtDateTime(data.activity.lastPayoutReminderAt)}</span></div>
          <div className="flex items-center justify-between"><span className="text-gray-600">Last plan renewal reminder sent</span><span className="text-gray-900 font-medium">{fmtDateTime(data.activity.lastRenewalReminderAt)}</span></div>
          <div className="flex items-center justify-between"><span className="text-gray-600">Ads expiry cron has run</span><span className="text-gray-900 font-medium">{data.activity.hasExpiredAdsProcessed ? "Yes" : "Not yet"}</span></div>
        </div>
      </Card>
    </div>
  );
}

// ── Error Log (in-app, no Vercel dashboard needed) ──────────────────────────

type SystemError = { id: string; context: string; detail: unknown; created_at: string };

function ErrorsTab() {
  const [errors, setErrors] = useState<SystemError[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/errors").then(r => r.json()).then(d => setErrors(d.errors ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Error Log</h2>
      <p className="text-sm text-gray-500 mb-6">Server-side failures logged in-app (order inserts, payment callbacks, etc.) — no Vercel dashboard needed. Showing latest 100.</p>
      {loading ? <Loading /> : errors.length === 0 ? (
        <EmptyState icon={Check} text="No errors logged. Clean." />
      ) : (
        <div className="space-y-2">
          {errors.map(e => (
            <div key={e.id} className="card-premium p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                <p className="font-medium text-gray-900 text-sm">{e.context}</p>
                <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{fmtDateTime(e.created_at)}</span>
              </div>
              <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(e.detail, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
