import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useSettings } from "@/contexts/SettingsContext";
import { useSEO } from "@/hooks/use-seo";
import ReactMarkdown from "react-markdown";

export default function Privacy() {
  const { settings } = useSettings();

  useSEO({
    title: "Privacy Policy",
    description: `Privacy Policy for ${settings?.siteName || "our automotive consignment services"}. Learn how we collect, use, and protect your personal information.`,
    type: "website",
    siteName: settings?.siteName || undefined,
  });

  const defaultPrivacyPolicy = `# Privacy Policy

**Last Updated: ${new Date().toLocaleDateString()}**

## Introduction

Welcome to ${settings?.siteName || "our website"}. We respect your privacy and are committed to protecting your personal data.

## Information We Collect

We may collect the following types of information:

- **Contact Information**: Name, email address, phone number, and mailing address
- **Vehicle Information**: Details about vehicles you submit for consignment
- **Usage Data**: Information about how you use our website

## How We Use Your Information

We use your information to:

- Process vehicle consignment submissions
- Communicate with you about your consignment
- Send you updates about your vehicle listing
- Improve our services

## Data Security

We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.

## Contact Us

If you have questions about this Privacy Policy, please contact us at:

${settings?.contactEmail ? `- Email: ${settings.contactEmail}` : ""}
${settings?.contactPhone ? `- Phone: ${settings.contactPhone}` : ""}
${settings?.contactAddress1 ? `- Address: ${settings.contactAddress1}${settings?.contactAddress2 ? `, ${settings.contactAddress2}` : ""}` : ""}
`;

  const content = settings?.privacyPolicy || defaultPrivacyPolicy;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div 
            className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-foreground prose-h1:text-3xl prose-h1:md:text-4xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
            data-testid="text-privacy-content"
          >
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
