"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, X, Clock, Users, Store, Mail, MapPin, Phone, ShieldCheck, LogOut } from "lucide-react";
import Link from "next/link";
import { fadeUp, stagger } from "@/lib/animations";

type FloristUser = {
  id: string; name: string; email: string; phone?: string;
  role: string; status: string; shop_city?: string; created_at: string;
};

const ADMIN_EMAILS = ["afdhalhisham94@gmail.com", "eaglobalic@gmail.com", "pretty.dalisya@gmail.com"];

export default function AdminPage() {
  const [users, setUsers] = useState<FloristUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("floreahub_user") || "{}");
      if (ADMIN_EMAILS.includes(u?.email)) setIsAdmin(true);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(d => setUsers(d.users ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleAction = async (userId: string, status: "approved" | "rejected") => {
    setActionLoading(userId + status);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
      }
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const filtered = users.filter(u => u.role === "florist" || u.role === "seller").filter(u => filter === "all" || u.status === filter);
  const counts = {
    pending: users.filter(u => u.status === "pending").length,
    approved: users.filter(u => u.status === "approved").length,
    rejected: users.filter(u => u.status === "rejected").length,
  };

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
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div variants={stagger} initial="hidden" animate="show">

          {/* Header */}
          <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-500 text-sm mt-1">Urus permohonan florist FloreaHub</p>
            </div>
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <LogOut size={14} /> Keluar
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4 mb-8">
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
          </motion.div>

          {/* Filter tabs */}
          <motion.div variants={fadeUp} className="flex gap-2 mb-6">
            {(["pending", "approved", "rejected", "all"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${filter === f ? "text-white shadow-sm" : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"}`} style={filter === f ? { background: "var(--primary)" } : {}}>
                {f === "all" ? "Semua" : f} {f !== "all" && `(${counts[f]})`}
              </button>
            ))}
          </motion.div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="card-premium h-24 animate-pulse bg-gray-100 rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div variants={fadeUp} className="card-premium p-12 text-center">
              <Users size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">{filter === "pending" ? "Tiada permohonan pending." : "Tiada rekod ditemui."}</p>
            </motion.div>
          ) : (
            <motion.div variants={stagger} className="space-y-4">
              {filtered.map(user => (
                <motion.div key={user.id} variants={fadeUp} className="card-premium p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: "var(--accent)" }}>
                        {user.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${user.status === "pending" ? "bg-amber-100 text-amber-700" : user.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                            {user.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Mail size={10} />{user.email}</span>
                          {user.phone && <span className="flex items-center gap-1"><Phone size={10} />{user.phone}</span>}
                          {user.shop_city && <span className="flex items-center gap-1"><MapPin size={10} />{user.shop_city}</span>}
                          <span className="flex items-center gap-1"><Store size={10} />Florist</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Daftar: {new Date(user.created_at).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>

                    {user.status === "pending" && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAction(user.id, "approved")}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id + "approved"
                            ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <Check size={14} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(user.id, "rejected")}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id + "rejected"
                            ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <X size={14} />}
                          Reject
                        </button>
                      </div>
                    )}

                    {user.status !== "pending" && (
                      <button
                        onClick={() => handleAction(user.id, user.status === "approved" ? "rejected" : "approved")}
                        disabled={!!actionLoading}
                        className="text-xs text-gray-400 hover:text-gray-600 underline flex-shrink-0 disabled:opacity-50"
                      >
                        {user.status === "approved" ? "Revoke" : "Re-approve"}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
