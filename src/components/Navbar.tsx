"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Flower2, ShoppingBag } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
          : "bg-white border-b border-gray-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: "var(--primary)" }}
            >
              <Flower2 size={16} color="white" strokeWidth={1.8} />
            </div>
            <span className="text-[1.1rem] font-semibold tracking-tight text-gray-900">
              Floria<span style={{ color: "var(--primary)" }}>Hub</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "/florists", label: "Find Florists" },
              { href: "/shop", label: "Shop" },
              { href: "#how-it-works", label: "How It Works" },
              { href: "#join", label: "List Your Shop" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-all"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn-primary text-sm py-2 px-4"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <Link href="/shop" className="p-2 text-gray-600 hover:text-gray-900">
              <ShoppingBag size={20} />
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
          {[
            { href: "/florists", label: "Find Florists" },
            { href: "/shop", label: "Shop" },
            { href: "#how-it-works", label: "How It Works" },
            { href: "#join", label: "List Your Shop" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
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
