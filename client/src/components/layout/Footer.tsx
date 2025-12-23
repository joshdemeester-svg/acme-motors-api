import { Car, Facebook, Instagram, Twitter, Lock, Youtube } from "lucide-react";
import { Link } from "wouter";
import { useSettings } from "@/contexts/SettingsContext";

export function Footer() {
  const { settings } = useSettings();
  const siteName = settings?.siteName || "PRESTIGE";

  const hasSocialLinks = settings?.facebookUrl || settings?.instagramUrl || settings?.twitterUrl || settings?.youtubeUrl || settings?.tiktokUrl;

  return (
    <footer className="border-t border-white/10 bg-card py-12 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={siteName} className="h-6 w-auto" />
              ) : (
                <Car className="h-6 w-6 text-primary" />
              )}
              <span>{siteName}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              The premier destination for buying and selling exceptional automobiles. 
              We handle every detail of the consignment process.
            </p>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Navigation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary">Home</Link></li>
              <li><Link href="/inventory" className="hover:text-primary">Inventory</Link></li>
              <li><Link href="/consign" className="hover:text-primary">Consign Your Car</Link></li>
              <li><a href="#" className="hover:text-primary">About Us</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {settings?.contactAddress1 && <li>{settings.contactAddress1}</li>}
              {settings?.contactAddress2 && <li>{settings.contactAddress2}</li>}
              {settings?.contactPhone && (
                <li>
                  <a href={`tel:${settings.contactPhone.replace(/\D/g, '')}`} className="hover:text-primary">
                    {settings.contactPhone}
                  </a>
                </li>
              )}
              {settings?.contactEmail && (
                <li>
                  <a href={`mailto:${settings.contactEmail}`} className="hover:text-primary">
                    {settings.contactEmail}
                  </a>
                </li>
              )}
              {!settings?.contactAddress1 && !settings?.contactAddress2 && !settings?.contactPhone && !settings?.contactEmail && (
                <>
                  <li>123 Luxury Lane</li>
                  <li>Beverly Hills, CA 90210</li>
                  <li>(555) 123-4567</li>
                  <li>info@prestigeauto.com</li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Social</h3>
            <div className="flex gap-4 flex-wrap">
              {settings?.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground" data-testid="link-instagram">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings?.twitterUrl && (
                <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground" data-testid="link-twitter">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {settings?.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground" data-testid="link-facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings?.youtubeUrl && (
                <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground" data-testid="link-youtube">
                  <Youtube className="h-5 w-5" />
                </a>
              )}
              {settings?.tiktokUrl && (
                <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground" data-testid="link-tiktok">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              )}
              {!hasSocialLinks && (
                <>
                  <a href="#" className="rounded-full bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a href="#" className="rounded-full bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="#" className="rounded-full bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                    <Facebook className="h-5 w-5" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-muted-foreground md:flex-row">
          <p>&copy; {new Date().getFullYear()} {siteName} Auto Consignment. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
            <Link href="/admin" className="flex items-center gap-1 hover:text-foreground" data-testid="link-admin-login">
              <Lock className="h-3 w-3" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
