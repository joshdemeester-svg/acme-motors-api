import { Car, Facebook, Instagram, Twitter } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-card py-12 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/">
              <a className="flex items-center gap-2 font-serif text-xl font-bold">
                <Car className="h-6 w-6 text-primary" />
                <span>PRESTIGE</span>
              </a>
            </Link>
            <p className="text-sm text-muted-foreground">
              The premier destination for buying and selling exceptional automobiles. 
              We handle every detail of the consignment process.
            </p>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Navigation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/"><a className="hover:text-primary">Home</a></Link></li>
              <li><Link href="/inventory"><a className="hover:text-primary">Inventory</a></Link></li>
              <li><Link href="/consign"><a className="hover:text-primary">Consign Your Car</a></Link></li>
              <li><a href="#" className="hover:text-primary">About Us</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>123 Luxury Lane</li>
              <li>Beverly Hills, CA 90210</li>
              <li>(555) 123-4567</li>
              <li>info@prestigeauto.com</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Social</h3>
            <div className="flex gap-4">
              <a href="#" className="rounded-full bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="rounded-full bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="rounded-full bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-muted-foreground md:flex-row">
          <p>&copy; {new Date().getFullYear()} Prestige Auto Consignment. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
