import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ConsignmentForm } from "@/components/consignment/ConsignmentForm";
import { useSEO } from "@/hooks/use-seo";

export default function Consign() {
  useSEO({
    title: "Consign Your Vehicle",
    description: "Submit your luxury or exotic vehicle for professional consignment. Get a complimentary market valuation and expert marketing to qualified buyers worldwide.",
  });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="relative py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h1 className="mb-4 font-serif text-4xl font-bold md:text-5xl">Consign Your Vehicle</h1>
            <p className="text-lg text-muted-foreground">
              Submit your vehicle information below for a complimentary market valuation.
            </p>
          </div>

          <ConsignmentForm />
        </div>
      </div>

      <Footer />
    </div>
  );
}
