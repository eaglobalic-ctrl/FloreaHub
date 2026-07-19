"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Flower2, ShoppingCart, Search } from "lucide-react";
import { getCart } from "@/lib/cart";

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

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
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  };

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

            {/* Cart */}
            <Link href="/checkout" className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--primary)" }}>
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-1">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-gray-600 hover:text-gray-900">
              <Search size={20} />
            </button>
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
            { href: "/builder", label: "Bouquet Builder" },
          ].map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <Link href="/login" className="block px-3 py-2.5 text-sm font-medium text-gray-600">Sign In</Link>
            <Link href="/register" className="block btn-primary text-center text-sm">Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
