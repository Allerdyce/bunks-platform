import type { Metadata } from "next";
import { StandaloneLayout } from "@/components/layout/StandaloneLayout";

interface SectionSubsection {
  title: string;
  description?: string;
  body?: string[];
  helper?: string;
  link?: string;
  linkLabel?: string;
}

interface SectionConfig {
  title: string;
  intro?: string;
  description?: string;
  body?: string[];
  subsections?: SectionSubsection[];
}

const sections: SectionConfig[] = [
  {
    title: "1. Who We Are",
    body: [
      "Bunks LLC",
      "144 E Carrillo St",
      "Santa Barbara, CA 93101",
      "United States",
      "Email: legal@bunks.com",
      "Bunks operates a direct-booking platform that connects guests with hosts, facilitates secure payments, and syncs booking availability from Airbnb calendars.",
      "This Privacy Policy applies to all guests, hosts, site visitors, and users interacting with the Bunks Service.",
    ],
  },
  {
    title: "2. Information We Collect",
    intro:
      "We collect information to operate the Service, process bookings, enable communication between hosts and guests, and support optional add-on activities.",
    subsections: [
      {
        title: "2.1 Information You Provide",
        body: [
          "Name",
          "Email address",
          "Phone number (optional)",
          "Booking details",
          "Property information (for hosts)",

          "Communication sent through Bunks messaging",
          "Support inquiries",
          "Guest preferences voluntarily shared (arrival time, accessibility needs, etc.)",
        ],
        helper: "We do not collect or process: Government IDs, Background checks, Biometric data, Insurance or claims data, AI-inferred behavior profiles.",
      },
      {
        title: "2.2 Payment Information",
        description:
          "All payments are processed securely through Stripe. Stripe collects and processes payment method details, billing address, and performs fraud and security checks. Bunks does not store full credit card numbers or bank details.",
        link: "https://stripe.com/privacy",
        linkLabel: "Stripe’s Privacy Policy",
      },
      {
        title: "2.3 Airbnb Calendar Data (iCal Ingestion)",
        description:
          "For availability syncing, hosts may connect their Airbnb iCal URL. When provided, we ingest calendar data such as reserved dates, blocked dates, and basic reservation metadata contained in the iCal feed. We do not access Airbnb account information, messages, payout details, guest names, or host internal data.",
      },
      {
        title: "2.5 Automatically Collected Information",
        description:
          "When you visit or use the Service, we automatically collect IP address, device type, browser details, operating system, pages viewed, time on pages, referral links, and cookie data to improve performance, prevent fraud, and personalize your experience.",
      },
    ],
  },
  {
    title: "3. How We Use Your Information",
    subsections: [
      {
        title: "3.1 Service Operation",
        body: [
          "Process and manage bookings",
          "Sync availability (Airbnb iCal)",
          "Offer direct booking and repeat-booking features",
          "Provide optional add-on experiences",
          "Enable host–guest communication",
          "Provide customer support",
          "Manage user accounts",
        ],
      },
      {
        title: "3.2 Communication",
        description:
          "We use your information to send booking confirmations, payment receipts, pre-stay reminders, check-in instructions, add-on confirmations, post-stay review requests, and important service updates via Postmark. You may opt out of non-essential marketing emails at any time.",
      },
      {
        title: "3.3 Improving the Service",
        description:
          "We analyze aggregated, non-identifiable data to understand usage patterns, improve website performance, develop new features, and support hosts in managing guest demand and repeat bookings.",
      },
      {
        title: "3.4 Legal, Security & Fraud Prevention",
        description:
          "We may process information to detect and prevent fraud, resolve disputes, comply with legal obligations, and enforce our agreements.",
      },
    ],
  },
  {
    title: "4. Sharing Your Information",
    intro: "We do not sell personal data. We may share information with:",
    subsections: [
      {
        title: "4.1 Service Providers",
        description:
          "Trusted vendors who assist with payment processing (Stripe), email delivery (Postmark), database hosting, analytics, and customer support tools. They are contractually required to protect your data.",
      },
      {
        title: "4.2 Hosts and Guests",
        description:
          "To facilitate a booking, we may share guest name and email with hosts, host name and property details with guests, and check-in logistics. We do not disclose private contact information unless necessary for the booking.",
      },
      {
        title: "4.3 Legal Requirements",
        description:
          "We may disclose information if required to comply with the law, respond to lawful requests, or protect safety, rights, or property.",
      },
    ],
  },
  {
    title: "5. Cookies & Tracking",
    description:
      "We use cookies and similar technologies for essential website functionality, login sessions, analytics, fraud prevention, and user experience customization. You can adjust browser settings to manage cookies.",
  },
  {
    title: "6. Data Retention",
    description:
      "We retain information only as long as necessary to provide the Service, maintain business records, comply with legal requirements, and resolve disputes. You may request deletion of your account or personal data at any time.",
  },
  {
    title: "7. Data Security",
    description:
      "We use reasonable administrative, technical, and physical safeguards to protect your data. However, no method of transmission over the Internet is fully secure.",
  },
  {
    title: "8. Links to Other Sites",
    description:
      "Our Service may link to third-party websites. We are not responsible for their privacy practices. Review their privacy policies before providing data.",
  },
  {
    title: "9. Children’s Privacy",
    description:
      "We do not knowingly collect personal data from individuals under 13. If we learn a child has provided personal information, we will delete it.",
  },
  {
    title: "10. Changes to This Policy",
    description:
      "We may update this Privacy Policy periodically. When we do, we will post the updated date at the top of this page.",
  },
  {
    title: "11. Contact Us",
    body: [
      "Bunks LLC",
      "144 E Carrillo St",
      "Santa Barbara, CA 93101",
      "United States",
      "Email: legal@bunks.com",
      "If you have questions, requests, or wish to exercise any privacy rights, please contact us.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Bunks — Privacy Policy",
  description: "Learn how Bunks collects, uses, and protects your information across our direct-booking platform.",
};

export default function PrivacyPage() {
  return (
    <StandaloneLayout>
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-[0.4em] text-stone-400 mb-4">Bunks — Privacy Policy</p>
          <h1 className="font-serif text-4xl text-stone-900 mb-4">Privacy Policy</h1>
          <p className="text-sm text-stone-500 mb-10">Last Updated: November 2025</p>
          <p className="text-lg text-stone-700 leading-relaxed mb-12">
            This Privacy Policy explains how Bunks LLC (“Bunks”, “we”, “our”, or “us”) collects, uses, discloses, and protects
            information about you when you use our website, services, or direct-booking platform (collectively, the “Service”). By using
            the Service, you agree to the terms of this Privacy Policy.
          </p>

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.title} className="bg-white border border-stone-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h2 className="font-serif text-2xl text-stone-900 mb-4">{section.title}</h2>
                {section.intro && <p className="text-stone-600 mb-4">{section.intro}</p>}
                {section.description && <p className="text-stone-600 mb-4">{section.description}</p>}
                {section.body && (
                  <div className="space-y-2">
                    {section.body.map((item) => (
                      <p key={item} className="text-stone-600">
                        {item}
                      </p>
                    ))}
                  </div>
                )}
                {section.subsections && (
                  <div className="mt-6 space-y-6">
                    {section.subsections.map((sub) => (
                      <div key={sub.title}>
                        <h3 className="font-semibold text-stone-900 mb-3">{sub.title}</h3>
                        {sub.description && <p className="text-stone-600 mb-3">{sub.description}</p>}
                        {sub.body && (
                          <ul className="list-disc pl-5 space-y-1 text-stone-600">
                            {sub.body.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}
                        {sub.helper && <p className="text-sm text-stone-500 mt-3">{sub.helper}</p>}
                        {sub.link && (
                          <a
                            href={sub.link}
                            className="text-stone-900 underline mt-3 inline-block"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {sub.linkLabel ?? "Learn more"}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </StandaloneLayout>
  );
}
