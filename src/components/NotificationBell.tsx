"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Package, MessageCircle, DollarSign, Star, CheckCircle, RotateCcw } from "lucide-react";
import { enablePushNotifications, getPushPermissionState } from "@/lib/push-client";

type Notification = { id: string; type: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string };

const TYPE_ICON: Record<string, React.ElementType> = {
  chat: MessageCircle,
  order: Package,
  payment: DollarSign,
  payout: DollarSign,
  refund: RotateCcw,
  review: Star,
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushState, setPushState] = useState<NotificationPermission | "unsupported">("default");
  const ref = useRef<HTMLDivElement>(null);

  const load = () => {
    fetch("/api/notifications").then(r => r.json()).then(d => {
      setNotifications(d.notifications ?? []);
      setUnreadCount(d.unreadCount ?? 0);
    }).catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getPushPermissionState().then(setPushState);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allRead: true }) }).catch(() => {});
  };

  const handleEnablePush = async () => {
    const ok = await enablePushNotifications();
    setPushState(ok ? "granted" : "denied");
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--primary)" }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-w-[90vw] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>
                  Mark all read
                </button>
              )}
            </div>

            {pushState === "default" && (
              <button onClick={handleEnablePush} className="w-full text-left px-4 py-2.5 text-xs text-gray-600 bg-rose-50/60 hover:bg-rose-50 border-b border-gray-50 flex items-center gap-2">
                <Bell size={13} className="text-rose-500 flex-shrink-0" />
                Enable notifications to get alerts even when you're not on the site
              </button>
            )}

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No notifications yet.</p>
              ) : (
                notifications.map(n => {
                  const Icon = TYPE_ICON[n.type] ?? CheckCircle;
                  const body = (
                    <div className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read_at ? "bg-rose-50/30" : ""}`}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary-muted)" }}>
                        <Icon size={14} style={{ color: "var(--primary)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                        <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.read_at && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "var(--primary)" }} />}
                    </div>
                  );
                  return n.link ? (
                    <Link key={n.id} href={n.link} onClick={() => { if (!n.read_at) markRead(n.id); setOpen(false); }}>
                      {body}
                    </Link>
                  ) : (
                    <button key={n.id} onClick={() => !n.read_at && markRead(n.id)} className="w-full text-left">
                      {body}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
