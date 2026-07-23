"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Phone, MapPin, Clock, Send, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fadeUp, stagger } from "@/lib/animations";
import { getRecaptchaToken } from "@/lib/recaptcha-client";

const TOPICS = ["General Enquiry", "Order Issue", "Florist Registration", "Partnership", "Technical Support", "Billing"];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const recaptchaToken = await getRecaptchaToken("contact");
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, recaptchaToken }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <h1 className="text-heading text-gray-900 mb-4">Get in Touch</h1>
            <p className="text-subheading text-gray-500">We'd love to hear from you. Our team typically responds within a few hours.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Info */}
            <motion.div variants={fadeUp} className="lg:col-span-2 space-y-6">
              <div className="card-premium p-6">
                <h3 className="font-bold text-gray-900 mb-5">Contact Information</h3>
                <div className="space-y-4">
                  {[
                    { icon: Mail, label: "Email", value: "hello@floreahub.com" },
                    { icon: Phone, label: "Phone", value: "+603-XXXX XXXX" },
                    { icon: MapPin, label: "Office", value: "Kuala Lumpur, Malaysia" },
                    { icon: Clock, label: "Hours", value: "Mon–Fri, 9AM–6PM" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(181,41,78,0.08)" }}>
                        <Icon size={15} style={{ color: "var(--primary)" }} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className="text-sm font-medium text-gray-900">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-premium p-6">
                <h3 className="font-bold text-gray-900 mb-2 text-sm">Lisya Lane Empire</h3>
                <p className="text-xs text-gray-500 leading-relaxed">FloreaHub is a product of Lisya Lane Empire — dedicated to empowering Malaysia's florist community through technology and beautiful design.</p>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div variants={fadeUp} className="lg:col-span-3">
              {sent ? (
                <div className="card-premium p-10 text-center h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, var(--primary), #e87fa8)" }}>
                    <Check size={28} color="white" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h2>
                  <p className="text-gray-500 text-sm">Thank you, {form.name.split(" ")[0]}. We'll get back to you at <strong>{form.email}</strong> within a few hours.</p>
                </div>
              ) : (
                <div className="card-premium p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ahmad Razif" className="input-premium w-full" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="input-premium w-full" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Topic</label>
                      <select value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} className="input-premium w-full">
                        <option value="">Select a topic...</option>
                        {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                      <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={5} placeholder="Tell us how we can help..." className="input-premium w-full resize-none" required />
                    </div>
                    {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{error}</p>}
                    <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
                      {loading
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><Send size={15} /> Send Message</>}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
