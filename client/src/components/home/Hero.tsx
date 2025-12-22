import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import heroBg from "@assets/generated_images/luxury_car_dark_studio_hero_background.png";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <div className="relative h-[90vh] min-h-[600px] w-full overflow-hidden bg-background">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Luxury Car in Studio"
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative z-10 flex h-full flex-col justify-center px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl space-y-6"
        >
          <div className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
            Premium Automotive Consignment
          </div>
          <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl lg:text-8xl">
            Maximize Your <br />
            <span className="text-primary">Vehicle's Value</span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
            Experience a seamless, secure, and professional consignment process. 
            We handle marketing, inquiries, and paperwork so you don't have to.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/consign">
              <Button size="lg" className="h-14 rounded-full px-8 text-lg font-semibold">
                Start Consignment
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline" size="lg" className="h-14 rounded-full border-white/20 px-8 text-lg font-semibold text-white hover:bg-white/10 hover:text-white">
                View Inventory
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
