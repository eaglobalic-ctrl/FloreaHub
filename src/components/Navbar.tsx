"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Flower2, ShoppingCart, Search, User, LayoutDashboard, ShoppingBag, LogOut, ChevronDown, MessageCircle } from "lucide-react";
import { getCart } from "@/lib/cart";

type StoredUser = { id: string; email: string; name: string; role: string };
type StoredFlorist = { id: string; name: string; status: string };

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<StoredUser | null>(null);
  const [florist, setFlorist] = useState<StoredFlorist | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sync = () => setCartCount(getCart().reduce((n, i) => n + i.quantity, 0));
    sync();
    window.addEventListener("cart-updated", sync);
    return () => window.removeEventListener("cart-updated", sync);
  }, []);

  useEffect(() => {
    const syncUser = () => {
      fetch("/api/auth/me")
        .then(r => r.json())
        .then(d => { setUser(d.user ?? null); setFlorist(d.florist ?? null); })
        .catch(() => { setUser(null); setFlorist(null); });
    };
    syncUser();
    window.addEventListener("user-updated", syncUser);
    return () => window.removeEventListener("user-updated", syncUser);
  }, [pathname]);

  useEffect(() => {
    if (!user) { setUnreadChats(0); return; }
    const sync = () => {
      fetch("/api/conversations?role=buyer")
        .then(r => r.json())
        .then(d => {
          const total = (d.conversations ?? []).reduce((n: number, c: { buyer_unread_count?: number }) => n + (c.buyer_unread_count ?? 0), 0);
          setUnreadChats(total);
        })
        .catch(() => {});
    };
    sync();
    const interval = setInterval(sync, 8000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setFlorist(null);
    setUserMenuOpen(false);
    window.dispatchEvent(new Event("user-updated"));
    router.push("/");
  };

  const isSeller = florist?.status === "approved";
  const initials = user?.name ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm" : "bg-white border-b border-gray-100"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: "var(--primary)" }}>
              <Flower2 size={16} color="white" strokeWidth={1.8} />
            </div>
            <span className="text-[1.1rem] font-semibold tracking-tight text-gray-900">
              Florea<span style={{ color: "var(--primary)" }}>Hub</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "/florists", label: "Find Florists" },
              { href: "/shop", label: "Shop" },
              { href: "/pricing", label: "For Florists" },
              { href: "/subscription", label: "Subscribe" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-all">
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search flowers..." className="text-sm outline-none bg-transparent w-36 text-gray-700 placeholder-gray-400" />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                <Search size={18} />
              </button>
            )}

            {/* Messages */}
            {user && (
              <Link href="/messages" className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                <MessageCircle size={18} />
                {unreadChats > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--primary)" }}>
                    {unreadChats > 9 ? "9+" : unreadChats}
                  </span>
                )}
              </Link>
            )}

            {/* Cart — every account can shop, sellers included */}
            <Link href="/checkout" className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--primary)" }}>
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: isSeller ? "var(--accent)" : "var(--primary)" }}>
                    {initials}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-gray-900 leading-none">{user.name.split(" ")[0]}</p>
                    <p className="text-[10px] text-gray-400 capitalize leading-none mt-0.5">{isSeller ? "Florist" : "Buyer"}</p>
                  </div>
                  <ChevronDown size={13} className={`text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
                    >
                      <div className="px-4 py-2.5 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>

                      {isSeller ? (
                        <>
                          <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <LayoutDashboard size={14} className="text-gray-400" /> Dashboard
                          </Link>
                          <Link href="/dashboard?tab=products" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <ShoppingBag size={14} className="text-gray-400" /> My Products
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <ShoppingBag size={14} className="text-gray-400" /> My Orders
                          </Link>
                          <Link href="/messages" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <MessageCircle size={14} className="text-gray-400" /> Messages
                            {unreadChats > 0 && (
                              <span className="ml-auto w-4.5 h-4.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1" style={{ background: "var(--primary)" }}>
                                {unreadChats > 9 ? "9+" : unreadChats}
                              </span>
                            )}
                          </Link>
                          <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <User size={14} className="text-gray-400" /> Profile
                          </Link>
                        </>
                      )}

                      <div className="border-t border-gray-50 mt-1 pt-1">
                        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile icons */}
          <div className="md:hidden flex items-center gap-1">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-gray-600 hover:text-gray-900">
              <Search size={20} />
            </button>
            {user && (
              <Link href="/messages" className="relative p-2 text-gray-600 hover:text-gray-900">
                <MessageCircle size={20} />
                {unreadChats > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--primary)" }}>
                    {unreadChats > 9 ? "9+" : unreadChats}
                  </span>
                )}
              </Link>
            )}
            <Link href="/checkout" className="relative p-2 text-gray-600 hover:text-gray-900">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--primary)" }}>
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {searchOpen && (
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search flowers, florists..." className="text-sm outline-none bg-transparent flex-1 text-gray-700 placeholder-gray-400" />
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
          {[
            { href: "/florists", label: "Find Florists" },
            { href: "/shop", label: "Shop" },
            { href: "/pricing", label: "For Florists" },
            { href: "/subscription", label: "Subscribe" },
          ].map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            {user ? (
              <>
                <div className="px-3 py-2 text-sm font-semibold text-gray-900">{user.name}</div>
                {isSeller ? (
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700">
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                ) : (
                  <Link href="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700">
                    <ShoppingBag size={14} /> My Orders
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-sm text-red-500">
                  <LogOut size={14} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-gray-600">Sign In</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="block btn-primary text-center text-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
