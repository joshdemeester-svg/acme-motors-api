import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Car, Menu, X } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/inventory", label: "Inventory" },
    { href: "/consign", label: "Consign Your Car" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/">
          <a className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tighter text-foreground transition-opacity hover:opacity-80">
            <Car className="h-8 w-8 text-primary" />
            <span>PRESTIGE</span>
          </a>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <a
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </a>
            </Link>
          ))}
          <Button variant="outline" className="ml-4 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground">
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
              <Link href="/">
                <a className="flex items-center gap-2 font-serif text-2xl font-bold" onClick={() => setIsOpen(false)}>
                  <Car className="h-6 w-6 text-primary" />
                  <span>PRESTIGE</span>
                </a>
              </Link>
              <div className="flex flex-col gap-4">
                {links.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a
                      className={cn(
                        "text-lg font-medium transition-colors hover:text-primary",
                        location === link.href
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
