import Link from "next/link";
import { Flower2, Mail, Globe, MessageCircle, Share2 } from "lucide-react";

export default function Footer() {
  const links = {
    Buyers: [
      { href: "/shop", label: "Shop Flowers" },
      { href: "/florists", label: "Find Florists" },
      { href: "/builder", label: "Bouquet Builder" },
      { href: "/subscription", label: "Subscriptions" },
      { href: "/reminders", label: "Occasion Reminders" },
    ],
    Florists: [
      { href: "/register/florist", label: "List Your Shop" },
      { href: "/pricing", label: "Pricing Plans" },
      { href: "/seller-guide", label: "Seller Guide" },
      { href: "/dashboard", label: "Dashboard" },
    ],
    Support: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact Us" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  };

  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-14">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group w-fit">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
                <Flower2 size={16} color="white" strokeWidth={1.8} />
              </div>
              <span className="text-[1.1rem] font-semibold tracking-tight text-white">
                Florea<span style={{ color: "#e87fa8" }}>Hub</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-xs">
              Malaysia's premier florist marketplace. Fresh flowers, verified florists, and guaranteed delivery — all in one place.
            </p>
            <div className="flex items-center gap-3">
              {[
                { Icon: Globe, href: "#" },
                { Icon: MessageCircle, href: "#" },
                { Icon: Share2, href: "#" },
                { Icon: Mail, href: "#" },
              ].map(({ Icon, href }, i) => (
                <Link
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
                >
                  <Icon size={15} />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-white text-xs font-semibold uppercase tracking-widest mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-500 hover:text-gray-200 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Lisya Lane Empire. All rights reserved.</p>
          <p>FloreaHub is a product of Lisya Lane Empire — crafted for Malaysia's florist community.</p>
        </div>
      </div>
    </footer>
  );
}
