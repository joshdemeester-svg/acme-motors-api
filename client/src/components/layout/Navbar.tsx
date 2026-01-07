import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Car, Menu, Settings, LogIn, Heart } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import { useQuery } from "@tanstack/react-query";
import { LoginModal } from "@/components/auth/LoginModal";
import { useSavedVehicles } from "@/hooks/use-saved-vehicles";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { settings } = useSettings();
  const { savedCount } = useSavedVehicles();

  const { data: session } = useQuery({
    queryKey: ["/api/auth/session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const isAdmin = session?.authenticated && session?.isAdmin;
  const siteName = settings?.siteName || "PRESTIGE";

  const links = [
    { href: "/", label: settings?.menuLabelHome || "Home" },
    { href: "/inventory", label: settings?.menuLabelInventory || "Inventory" },
    { href: "/consign", label: settings?.menuLabelConsign || "Consign" },
    { href: "/trade-in", label: settings?.menuLabelTradeIn || "Trade-In" },
    { href: "/get-approved", label: "Get Approved" },
    { href: "/appointments", label: settings?.menuLabelAppointments || "Book Appointment" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tighter text-foreground transition-opacity hover:opacity-80 pl-2">
          {settings?.logoUrl ? (
            <>
              <img 
                src={settings.logoUrl} 
                alt={siteName} 
                style={{ width: `${settings.logoWidth || 120}px`, height: 'auto' }}
                className="hidden md:block"
              />
              <img 
                src={settings.logoUrl} 
                alt={siteName} 
                style={{ width: `${settings.mobileLogoWidth || settings.logoWidth || 100}px`, height: 'auto' }}
                className="block md:hidden"
              />
            </>
          ) : (
            <>
              <Car className="h-8 w-8 text-primary" />
              <span>{siteName}</span>
            </>
          )}
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "font-medium transition-colors",
                location === link.href
                  ? "nav-link"
                  : "nav-link-inactive"
              )}
              style={{
                fontSize: `${parseInt(settings?.menuFontSize || '14')}px`,
                textTransform: settings?.menuAllCaps !== false ? 'uppercase' : 'none'
              }}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-1 text-sm font-medium transition-colors",
                location === "/admin" ? "nav-link" : "nav-link-inactive"
              )}
            >
              <Settings className="h-4 w-4" /> Admin
            </Link>
          )}
          {!isAdmin && (
            <Button 
              variant="ghost" 
              className="flex items-center gap-2"
              onClick={() => setLoginOpen(true)}
              data-testid="btn-navbar-login"
            >
              <LogIn className="h-4 w-4" /> Login
            </Button>
          )}
          <Link href="/saved" className="relative" data-testid="link-saved-vehicles">
            <Button variant="ghost" size="icon" className="text-foreground">
              <Heart className={cn("h-5 w-5", savedCount > 0 && "text-red-500")} />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs font-bold text-white flex items-center justify-center">
                  {savedCount > 9 ? '9+' : savedCount}
                </span>
              )}
            </Button>
          </Link>
          <Button className="btn-contact ml-4">
            Contact Us
          </Button>
        </div>

        {/* Mobile Nav */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background border-l-white/10">
            <div className="flex flex-col gap-8 pt-10">
              <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold" onClick={() => setIsOpen(false)}>
                {settings?.logoUrl ? (
                  <img 
                    src={settings.logoUrl} 
                    alt={siteName} 
                    style={{ width: `${settings.mobileLogoWidth || settings.logoWidth || '100'}px`, height: 'auto' }}
                  />
                ) : (
                  <>
                    <Car className="h-6 w-6 text-primary" />
                    <span>{siteName}</span>
                  </>
                )}
              </Link>
              <div className="flex flex-col gap-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-lg font-medium transition-colors",
                      location === link.href
                        ? "nav-link"
                        : "nav-link-inactive"
                    )}
                    style={{
                      textTransform: settings?.menuAllCaps !== false ? 'uppercase' : 'none'
                    }}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={cn(
                      "flex items-center gap-2 text-lg font-medium transition-colors",
                      location === "/admin" ? "nav-link" : "nav-link-inactive"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="h-5 w-5" /> Admin Dashboard
                  </Link>
                )}
                {!isAdmin && (
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 text-lg font-medium justify-start p-0 h-auto"
                    onClick={() => { setIsOpen(false); setLoginOpen(true); }}
                    data-testid="btn-mobile-login"
                  >
                    <LogIn className="h-5 w-5" /> Login
                  </Button>
                )}
                <Link
                  href="/saved"
                  className={cn(
                    "flex items-center gap-2 text-lg font-medium transition-colors",
                    location === "/saved" ? "nav-link" : "nav-link-inactive"
                  )}
                  onClick={() => setIsOpen(false)}
                  data-testid="link-mobile-saved"
                >
                  <Heart className={cn("h-5 w-5", savedCount > 0 && "text-red-500 fill-red-500")} />
                  Saved {savedCount > 0 && `(${savedCount})`}
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </nav>
  );
}
