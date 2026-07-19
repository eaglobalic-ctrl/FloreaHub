import Link from "next/link";
import { Flower2, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: "rgba(181,41,78,0.08)" }}>
          <Flower2 size={36} style={{ color: "var(--primary)" }} strokeWidth={1.5} />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-3">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Page Not Found</h2>
        <p className="text-gray-500 mb-10 text-sm leading-relaxed">
          Looks like this page has wilted. The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary flex items-center justify-center gap-2">
            <ArrowLeft size={15} /> Back to Home
          </Link>
          <Link href="/shop" className="btn-secondary flex items-center justify-center gap-2">
            <Search size={15} /> Browse Flowers
          </Link>
        </div>
        <p className="mt-8 text-xs text-gray-400">
          FloreaHub by <span className="font-medium">Lisya Lane Empire</span>
        </p>
      </div>
    </div>
  );
}
