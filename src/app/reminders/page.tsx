"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Plus, Trash2, Calendar, Heart, Star, Cake, Gift, Check, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fadeUp, stagger } from "@/lib/animations";

type Reminder = { id: string; name: string; date: string; type: string; notify: string; };

const TYPES = [
  { id: "birthday", label: "Birthday", icon: Cake },
  { id: "anniversary", label: "Anniversary", icon: Heart },
  { id: "wedding", label: "Wedding", icon: Star },
  { id: "graduation", label: "Graduation", icon: Gift },
  { id: "other", label: "Other", icon: Bell },
];

const NOTIFY = ["3 days before", "1 week before", "2 weeks before", "1 month before"];

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: "1", name: "Mum's Birthday", date: "2026-08-14", type: "birthday", notify: "3 days before" },
    { id: "2", name: "Wedding Anniversary", date: "2026-09-22", type: "anniversary", notify: "1 week before" },
  ]);
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", type: "birthday", notify: "3 days before" });

  const addReminder = () => {
    if (!form.name || !form.date) return;
    setReminders(r => [...r, { ...form, id: String(Date.now()) }]);
    setForm({ name: "", date: "", type: "birthday", notify: "3 days before" });
    setAdding(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const removeReminder = (id: string) => setReminders(r => r.filter(x => x.id !== id));

  const typeIcon = (type: string) => {
    const t = TYPES.find(t => t.id === type);
    return t ? t.icon : Bell;
  };

  const daysUntil = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    d.setFullYear(now.getFullYear());
    if (d < now) d.setFullYear(now.getFullYear() + 1);
    return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <Navbar />
      <main className="py-16 bg-gradient-to-b from-rose-50 to-white min-h-screen">
        <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(181,41,78,0.1)" }}>
              <Bell size={24} style={{ color: "var(--primary)" }} />
            </div>
            <h1 className="text-heading text-gray-900 mb-3">Occasion Reminders</h1>
            <p className="text-subheading text-gray-500">Never forget a special date. We'll remind you early so you can order the perfect flowers in time.</p>
          </motion.div>

          <AnimatePresence>
            {saved && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                <Check size={16} className="text-emerald-600" />
                <p className="text-sm text-emerald-700 font-medium">Reminder saved! We'll notify you on time.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reminders list */}
          <motion.div variants={fadeUp} className="space-y-3 mb-6">
            <AnimatePresence>
              {reminders.map(r => {
                const Icon = typeIcon(r.type);
                const days = daysUntil(r.date);
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="card-premium p-5 flex items-center gap-4"
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(181,41,78,0.08)" }}>
                      <Icon size={20} style={{ color: "var(--primary)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                      <p className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString("en-MY", { day: "numeric", month: "long" })} · Notify {r.notify}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${days <= 7 ? "text-rose-500" : days <= 30 ? "text-amber-500" : "text-gray-400"}`}>
                        {days}d
                      </p>
                      <p className="text-xs text-gray-400">to go</p>
                    </div>
                    <button onClick={() => removeReminder(r.id)} className="p-2 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {reminders.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <Bell size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No reminders yet. Add your first one below.</p>
              </div>
            )}
          </motion.div>

          {/* Add form */}
          <motion.div variants={fadeUp}>
            <AnimatePresence mode="wait">
              {!adding ? (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setAdding(true)}
                  className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-5 text-gray-500 hover:border-rose-300 hover:text-rose-500 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus size={18} /> Add New Reminder
                </motion.button>
              ) : (
                <motion.div
                  key="add-form"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="card-premium p-6"
                >
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar size={17} style={{ color: "var(--primary)" }} /> New Reminder
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Occasion Name</label>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Dad's Birthday" className="input-premium w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                        <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-premium w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-premium w-full">
                          {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Remind me</label>
                      <select value={form.notify} onChange={e => setForm(f => ({ ...f, notify: e.target.value }))} className="input-premium w-full">
                        {NOTIFY.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setAdding(false)} className="btn-secondary flex-1">Cancel</button>
                      <button onClick={addReminder} className="btn-primary flex-1 flex items-center justify-center gap-2">
                        Save Reminder <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* CTA */}
          {reminders.length > 0 && (
            <motion.div variants={fadeUp} className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-4">Ready to order for an upcoming occasion?</p>
              <a href="/shop" className="btn-primary inline-flex items-center gap-2">
                Shop Flowers <ArrowRight size={15} />
              </a>
            </motion.div>
          )}
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
