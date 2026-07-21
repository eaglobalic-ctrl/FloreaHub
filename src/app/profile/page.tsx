"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { User, Loader2, ShoppingBag, MessageCircle, Bell, LogOut, Save } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageUpload from "@/components/ui/image-upload";
import { toast } from "@/components/Toast";
import { fadeUp, stagger } from "@/lib/animations";

type Profile = { id: string; email: string; name: string; phone: string | null; avatar_url: string | null };

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", avatarUrl: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setProfile(d.user);
          setForm({ name: d.user.name ?? "", phone: d.user.phone ?? "", avatarUrl: d.user.avatar_url ?? "" });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setProfile(data.user);
      window.dispatchEvent(new Event("user-updated"));
      toast.success("Profile updated.");
    } catch {
      toast.error("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.dispatchEvent(new Event("user-updated"));
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50"><Loader2 size={28} className="animate-spin text-gray-300" /></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
          <div className="card-premium p-10 max-w-sm text-center">
            <User size={36} className="mx-auto mb-4" style={{ color: "var(--primary)" }} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-500 text-sm mb-6">Sign in to view your profile.</p>
            <Link href="/login" className="btn-primary w-full justify-center">Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.h1 variants={fadeUp} className="text-heading text-gray-900 mb-8">My Profile</motion.h1>

          <motion.div variants={fadeUp} className="card-premium p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-5">Photo</h3>
            <ImageUpload value={form.avatarUrl} onChange={url => setForm(f => ({ ...f, avatarUrl: url }))} folder="avatars" />
          </motion.div>

          <motion.div variants={fadeUp} className="card-premium p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-5">Account Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-premium w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input value={profile.email} disabled className="input-premium w-full bg-gray-50 text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1.5">Your email is used to sign in and can&apos;t be changed here.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01X-XXXXXXX" className="input-premium w-full" />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary mt-5 flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </motion.div>

          <motion.div variants={fadeUp} className="card-premium overflow-hidden mb-6">
            {[
              { href: "/orders", icon: ShoppingBag, label: "My Orders" },
              { href: "/messages", icon: MessageCircle, label: "Messages" },
              { href: "/reminders", icon: Bell, label: "Occasion Reminders" },
            ].map(item => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-5 py-4 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                <item.icon size={16} className="text-gray-400" /> {item.label}
              </Link>
            ))}
          </motion.div>

          <motion.button variants={fadeUp} onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors">
            <LogOut size={15} /> Sign Out
          </motion.button>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
