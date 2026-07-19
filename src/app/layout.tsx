import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import ToastProvider from "@/components/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FloreaHub — Malaysia's Premier Florist Marketplace",
  description: "Discover the finest florists across Malaysia. Order fresh bouquets, custom arrangements, and same-day flower delivery with a freshness guarantee.",
  keywords: "florist malaysia, flower delivery, bouquet, fresh flowers, wedding flowers, same day delivery",
  openGraph: {
    title: "FloreaHub — Malaysia's Premier Florist Marketplace",
    description: "Fresh flowers, top florists, delivered to your door.",
    type: "website",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
