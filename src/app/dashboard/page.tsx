"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Flower2, LayoutDashboard, Package, ShoppingBag, Star, Settings,
  TrendingUp, Clock, CheckCircle, AlertCircle, Plus, ArrowRight,
  ChevronUp, ChevronDown, Bell, LogOut, Menu, X
} from "lucide-react";
import { fadeUp, stagger } from "@/lib/animations";

const STATS = [
  { label: "Revenue This Month", value: "RM 4,280", change: "+18%", up: true, icon: TrendingUp, color: "#2d6a4f" },
  { label: "Pending Orders", value: "7", change: "3 new today", up: true, icon: Clock, color: "#f59e0b" },
  { label: "Completed Orders", value: "142", change: "+12 this week", up: true, icon: CheckCircle, color: "#3b82f6" },
  { label: "Average Rating", value: "4.9", change: "312 reviews", up: true, icon: Star, color: "#b5294e" },
];

const ORDERS = [
  { id: "FH-2847", customer: "Sarah Lim", product: "Bridal Premium Bouquet", amount: 280, status: "pending", time: "2 hrs ago" },
  { id: "FH-2846", customer: "Ahmad Razif", product: "Corporate Event Stand", amount: 220, status: "processing", time: "4 hrs ago" },
  { id: "FH-2845", customer: "Priya Nair", product: "Birthday Bloom Box", amount: 150, status: "delivered", time: "Yesterday" },
  { id: "FH-2844", customer: "Jason Tan", product: "Classic Red Rose Bouquet", amount: 120, status: "delivered", time: "Yesterday" },
  { id: "FH-2843", customer: "Nurul Ain", product: "White Lily Elegance", amount: 95, status: "cancelled", time: "2 days ago" },
];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

const PRODUCTS = [
  { name: "Bridal Premium Bouquet", price: 280, stock: 12, sold: 67, badge: "Premium" },
  { name: "Classic Red Rose Bouquet", price: 120, stock: 8, sold: 89, badge: "Bestseller" },
  { name: "White Lily Elegance", price: 95, stock: 15, sold: 54, badge: "" },
  { name: "Birthday Bloom Box", price: 150, stock: 3, sold: 78, badge: "" },
];

const NAV = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: ShoppingBag, label: "Orders", id: "orders" },
  { icon: Package, label: "Products", id: "products" },
  { icon: Star, label: "Reviews", id: "reviews" },
  { icon: Settings, label: "Settings", id: "settings" },
];

export default function DashboardPage() {
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--primary)" }}>B</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Bloom & Co.</p>
              <p className="text-xs text-gray-400">Pro Plan</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === id ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
              style={tab === id ? { background: "var(--primary)" } : {}}
            >
              <Icon size={17} />
              {label}
            </button>
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
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 capitalize">{NAV.find(n => n.id === tab)?.label}</h1>
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "var(--primary)" }} />
            </button>
            <Link href="/register/florist" className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5">
              <Plus size={14} /> Add Product
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {tab === "overview" && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {STATS.map(({ label, value, change, up, icon: Icon, color }) => (
                  <motion.div key={label} variants={fadeUp} className="card-premium p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-xs text-gray-500 font-medium">{label}</p>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
                    <div className="flex items-center gap-1 text-xs">
                      {up ? <ChevronUp size={12} className="text-emerald-500" /> : <ChevronDown size={12} className="text-red-500" />}
                      <span className={up ? "text-emerald-600" : "text-red-500"}>{change}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Revenue chart (CSS-based) */}
              <motion.div variants={fadeUp} className="card-premium p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Revenue — Last 7 Days</h3>
                <div className="flex items-end gap-3 h-32">
                  {[420, 680, 520, 890, 760, 1050, 920].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-md transition-all" style={{ height: `${(val / 1050) * 100}%`, background: `var(--primary)`, opacity: i === 6 ? 1 : 0.4 + i * 0.08 }} />
                      <span className="text-xs text-gray-400">{["M","T","W","T","F","S","S"][i]}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Recent orders preview */}
              <motion.div variants={fadeUp} className="card-premium p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-gray-900">Recent Orders</h3>
                  <button onClick={() => setTab("orders")} className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: "var(--primary)" }}>
                    View all <ArrowRight size={12} />
                  </button>
                </div>
                <div className="space-y-3">
                  {ORDERS.slice(0, 3).map(order => (
                    <div key={order.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                        {order.customer[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{order.product}</p>
                        <p className="text-xs text-gray-400">{order.customer} · {order.time}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">RM{order.amount}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize whitespace-nowrap ${STATUS_STYLE[order.status]}`}>{order.status}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Low stock alert */}
              <motion.div variants={fadeUp} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
                <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Low Stock Alert</p>
                  <p className="text-xs text-amber-700">Birthday Bloom Box has only 3 units left. Consider restocking soon.</p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {tab === "orders" && (
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.div variants={fadeUp} className="card-premium overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">All Orders</h3>
                  <span className="text-xs text-gray-500">{ORDERS.length} orders</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {["Order ID", "Customer", "Product", "Amount", "Status", "Time"].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ORDERS.map(o => (
                        <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4 font-mono text-xs text-gray-500">{o.id}</td>
                          <td className="px-5 py-4 font-medium text-gray-900">{o.customer}</td>
                          <td className="px-5 py-4 text-gray-600 max-w-[160px] truncate">{o.product}</td>
                          <td className="px-5 py-4 font-semibold text-gray-900">RM{o.amount}</td>
                          <td className="px-5 py-4"><span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${STATUS_STYLE[o.status]}`}>{o.status}</span></td>
                          <td className="px-5 py-4 text-gray-400 text-xs">{o.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}

          {tab === "products" && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
              <motion.div variants={fadeUp} className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{PRODUCTS.length} active products</p>
                <button className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"><Plus size={13} /> Add Product</button>
              </motion.div>
              {PRODUCTS.map(p => (
                <motion.div key={p.name} variants={fadeUp} className="card-premium p-5 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                      {p.badge && <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: "var(--primary)" }}>{p.badge}</span>}
                    </div>
                    <p className="text-xs text-gray-500">{p.sold} sold · {p.stock} in stock</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">RM{p.price}</p>
                    <p className={`text-xs ${p.stock < 5 ? "text-amber-600 font-medium" : "text-gray-400"}`}>{p.stock < 5 ? "Low stock" : "In stock"}</p>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                    <Settings size={15} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {(tab === "reviews" || tab === "settings") && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-400">
                <p className="text-lg font-medium mb-2 text-gray-600 capitalize">{tab}</p>
                <p className="text-sm">Coming soon — full {tab} management</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
