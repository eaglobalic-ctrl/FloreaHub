import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SECTIONS = [
  {
    title: "Information We Collect",
    content: `We collect information you provide directly, such as your name, email address, phone number, and delivery address when you create an account or place an order. We also collect transaction data, including payment information (processed securely by ToyyibPay), order history, and delivery details. Additionally, we collect usage data such as pages visited, search queries, and device information to improve our platform.`,
  },
  {
    title: "How We Use Your Information",
    content: `We use your information to process and fulfil orders, communicate order updates and delivery tracking, send occasion reminders you have set up, improve platform features and personalise your experience, and resolve disputes or provide customer support. We do not sell your personal data to third parties.`,
  },
  {
    title: "Sharing Your Information",
    content: `We share your delivery name, address, and phone number with the florist fulfilling your order — this is necessary to complete your delivery. We share payment details with ToyyibPay solely for transaction processing. We may share aggregated, anonymised data for analytics purposes.`,
  },
  {
    title: "Cookies and Tracking",
    content: `FloreaHub uses cookies and similar tracking technologies to maintain your session, remember your preferences, and analyse platform performance. You can control cookie settings in your browser. Disabling cookies may affect platform functionality.`,
  },
  {
    title: "Data Security",
    content: `We implement industry-standard security measures including SSL/TLS encryption, secure payment processing via ToyyibPay's PCI-compliant infrastructure, and restricted access to personal data. However, no method of transmission over the internet is 100% secure.`,
  },
  {
    title: "Your Rights",
    content: `You have the right to access, correct, or delete your personal data. You may request a copy of data we hold about you, opt out of marketing communications at any time via unsubscribe links, and request account deletion by contacting us at privacy@floreahub.com.`,
  },
  {
    title: "Data Retention",
    content: `We retain personal data for as long as your account is active or as necessary to fulfil legal obligations. Transaction records are retained for 7 years as required by Malaysian financial regulations.`,
  },
  {
    title: "Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of material changes via email or a prominent notice on the platform. Continued use of FloreaHub after changes constitutes acceptance of the updated policy.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
            <p className="text-sm text-gray-400">Last updated: July 2026 · Effective for all FloreaHub users</p>
            <p className="text-gray-500 mt-4 leading-relaxed">
              FloreaHub is operated by <strong>Lisya Lane Empire</strong>. This policy explains how we collect, use, and protect your personal information when you use FloreaHub's platform, website, and services.
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

          <div className="mt-12 bg-gray-50 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-2">Contact our Privacy Team</h3>
            <p className="text-sm text-gray-500 mb-1">Lisya Lane Empire — FloreaHub Privacy</p>
            <p className="text-sm text-gray-500">Email: <a href="mailto:privacy@floreahub.com" className="underline" style={{ color: "var(--primary)" }}>privacy@floreahub.com</a></p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
