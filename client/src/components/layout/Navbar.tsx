import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Car, Menu, Settings, LogIn } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import { useQuery } from "@tanstack/react-query";
import { LoginModal } from "@/components/auth/LoginModal";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { settings } = useSettings();

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
    { href: "/", label: "Home" },
    { href: "/inventory", label: "Inventory" },
    { href: "/consign", label: "Consign Your Car" },
    { href: "/trade-in", label: "Trade-In" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tighter text-foreground transition-opacity hover:opacity-80">
          {settings?.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt={siteName} 
              style={{ width: `${settings.logoWidth || 120}px`, height: 'auto' }}
            />
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
                "text-sm font-medium transition-colors",
                location === link.href
                  ? "nav-link"
                  : "nav-link-inactive"
              )}
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
                    style={{ width: `${Math.min(parseInt(settings.logoWidth || '120'), 150)}px`, height: 'auto' }}
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
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </nav>
  );
}
