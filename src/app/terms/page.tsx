import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const SECTIONS = [
  {
    title: "Acceptance of Terms",
    content: `By accessing or using FloreaHub, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please discontinue use of the platform immediately. FloreaHub is operated by Lisya Lane Empire.`,
  },
  {
    title: "Use of the Platform",
    content: `FloreaHub is a marketplace connecting buyers with verified florists across Malaysia. You may use FloreaHub to browse, order flowers, manage subscriptions, and interact with florists. You agree not to use the platform for any unlawful purpose, to submit false or misleading information, to impersonate other users or businesses, or to interfere with platform operations.`,
  },
  {
    title: "Buyer Terms",
    content: `When placing an order, you agree to provide accurate delivery information. FloreaHub facilitates the transaction between you and the florist — the florist is responsible for preparing and dispatching your order. Delivery timelines are estimates; FloreaHub does not guarantee exact delivery times due to traffic and weather conditions. Our Freshness Guarantee and Real-Photo Promise are subject to the florist's participation and may vary by listing.`,
  },
  {
    title: "Florist Terms",
    content: `Registered florists agree to maintain accurate product listings, pricing, and availability. Florists must fulfil confirmed orders promptly and send a Real-Photo of each bouquet before dispatch. Florists are responsible for the quality and freshness of their products. FloreaHub charges a 5% platform fee on all completed transactions. Florists who receive 3 or more verified quality complaints may have their listing suspended pending review.`,
  },
  {
    title: "Payments and Refunds",
    content: `All payments are processed by ToyyibPay, a licensed payment gateway in Malaysia. FloreaHub does not store credit card or banking credentials. Refunds for cancelled orders (before dispatch) will be processed within 3–7 business days. Quality complaints must be raised within 48 hours of delivery with photographic evidence.`,
  },
  {
    title: "Intellectual Property",
    content: `All content on FloreaHub — including logo, design, copy, and code — is owned by Lisya Lane Empire. Florists grant FloreaHub a non-exclusive licence to display their product photos on the platform. You may not reproduce, distribute, or create derivative works without written permission.`,
  },
  {
    title: "Limitation of Liability",
    content: `To the maximum extent permitted by law, Lisya Lane Empire and FloreaHub shall not be liable for indirect, incidental, or consequential damages arising from use of the platform, including but not limited to dissatisfaction with florist quality, delivery delays, or data loss. Our total liability shall not exceed the amount paid for the specific transaction giving rise to the claim.`,
  },
  {
    title: "Governing Law",
    content: `These Terms are governed by the laws of Malaysia. Any disputes shall be subject to the exclusive jurisdiction of the courts of Kuala Lumpur, Malaysia.`,
  },
  {
    title: "Changes to Terms",
    content: `We reserve the right to update these Terms at any time. Material changes will be communicated via email or platform notification. Continued use after changes constitutes acceptance.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Terms of Service</h1>
            <p className="text-sm text-gray-400">Last updated: July 2026 · Applies to all FloreaHub users and registered florists</p>
            <p className="text-gray-500 mt-4 leading-relaxed">
              These Terms of Service govern your use of the FloreaHub platform operated by <strong>Lisya Lane Empire</strong>. Please read them carefully.
            </p>
          </div>

          <div className="space-y-8">
            {SECTIONS.map(({ title, content }, i) => (
              <div key={title} className="border-b border-gray-100 pb-8 last:border-0">
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                  <span className="text-gray-300 font-normal mr-2">{String(i + 1).padStart(2, "0")}.</span>
                  {title}
                </h2>
                <p className="text-gray-500 leading-relaxed text-sm">{content}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Have questions about our terms?</h3>
              <p className="text-sm text-gray-500">Our team is happy to clarify anything.</p>
            </div>
            <Link href="/contact" className="btn-primary whitespace-nowrap">Contact Us</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
