import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useSettings } from "@/contexts/SettingsContext";
import { useSEO } from "@/hooks/use-seo";
import ReactMarkdown from "react-markdown";

export default function Terms() {
  const { settings } = useSettings();

  useSEO({
    title: "Terms of Service",
    description: `Terms of Service for ${settings?.siteName || "our automotive consignment services"}. Read our terms and conditions for using our platform.`,
    type: "website",
    siteName: settings?.siteName || undefined,
  });

  const defaultTermsOfService = `# Terms of Service

**Last Updated: ${new Date().toLocaleDateString()}**

## Agreement to Terms

By accessing or using ${settings?.siteName || "our website"}, you agree to be bound by these Terms of Service.

## Consignment Services

Our platform facilitates the consignment sale of luxury and exotic vehicles. By submitting a vehicle for consignment, you agree to:

- Provide accurate and complete information about your vehicle
- Confirm that you are the legal owner or authorized representative
- Allow us to market and display your vehicle on our platform
- Pay applicable commission fees upon successful sale

## User Responsibilities

You are responsible for:

- Maintaining the accuracy of your account information
- Keeping your login credentials secure
- Complying with all applicable laws and regulations

## Commission and Fees

Our commission rate and fee structure will be disclosed to you before you agree to consign your vehicle. Commission is only due upon successful completion of a sale.

## Limitation of Liability

We are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.

## Changes to Terms

We may modify these terms at any time. Continued use of our services after changes constitutes acceptance of the modified terms.

## Contact Us

If you have questions about these Terms, please contact us at:

${settings?.contactEmail ? `- Email: ${settings.contactEmail}` : ""}
${settings?.contactPhone ? `- Phone: ${settings.contactPhone}` : ""}
${settings?.contactAddress1 ? `- Address: ${settings.contactAddress1}${settings?.contactAddress2 ? `, ${settings.contactAddress2}` : ""}` : ""}
`;

  const content = settings?.termsOfService || defaultTermsOfService;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div 
            className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-foreground prose-h1:text-3xl prose-h1:md:text-4xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
            data-testid="text-terms-content"
          >
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
