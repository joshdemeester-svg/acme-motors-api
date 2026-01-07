import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Loader2,
  Monitor,
  Map,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SiteSettings } from "@shared/schema";
import { LoginModal } from "@/components/auth/LoginModal";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  masterOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Inventory", href: "/admin/inventory", icon: <Car className="h-5 w-5" /> },
  { label: "Leads", href: "/admin/leads", icon: <Users className="h-5 w-5" /> },
  { label: "Consignments", href: "/admin/consignments", icon: <FileText className="h-5 w-5" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
  { label: "SEO Tools", href: "/admin/seo-tools", icon: <MapPin className="h-5 w-5" /> },
  { label: "Roadmap", href: "/admin/roadmap", icon: <Map className="h-5 w-5" />, masterOnly: true },
];

interface SessionData {
  isAdmin: boolean;
  role?: string;
  username?: string;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const queryClient = useQueryClient();

  const { data: session, isLoading: sessionLoading } = useQuery<SessionData | null>({
    queryKey: ["/api/auth/session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      if (res.status === 401) return null;
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      setLocation("/");
    },
  });

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location === "/admin";
    }
    return location.startsWith(href);
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.isAdmin) {
    const handleLoginClose = (open: boolean) => {
      setShowLogin(open);
      if (!open) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      }
    };
    
    return (
      <>
        <div className="fixed inset-0 flex items-center justify-center bg-muted/30">
          <div className="text-center space-y-4 p-6 max-w-sm mx-auto">
            <h1 className="text-2xl font-bold font-serif">Admin Access Required</h1>
            <p className="text-muted-foreground">Please log in to access the admin panel.</p>
            <Button onClick={() => setShowLogin(true)} data-testid="button-login">
              Log In
            </Button>
            <div className="pt-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back to Homepage
              </Link>
            </div>
          </div>
        </div>
        <LoginModal open={showLogin} onOpenChange={handleLoginClose} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="fixed top-0 left-0 right-0 z-30 md:hidden bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg bg-muted p-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-testid="button-toggle-sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {settings?.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt={settings?.siteName || "Logo"} 
              style={{ width: `${settings.mobileLogoWidth || settings.logoWidth || '100'}px` }}
              className="object-contain"
            />
          ) : (
            <span className="font-serif font-bold truncate">{settings?.siteName || "Admin"}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          data-testid="button-logout-mobile"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-background border-r transition-transform duration-300",
          "md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm">Back to Site</span>
            </Link>
            <div className="mt-3">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings?.siteName || "Logo"} 
                  style={{ width: `${settings.logoWidth || '120'}px` }}
                  className="object-contain"
                />
              ) : (
                <h1 className="font-serif text-xl font-bold truncate">
                  {settings?.siteName || "Admin Panel"}
                </h1>
              )}
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems
              .filter(item => !item.masterOnly || session?.role === "master")
              .map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={() => setSidebarOpen(false)}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
              {logoutMutation.isPending ? "Logging out..." : "Log Out"}
            </Button>
          </div>
        </div>
      </aside>

      <main className="md:ml-64 min-h-screen pt-16 md:pt-0">
        {settings?.demoModeActive && (
          <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
            <Monitor className="h-4 w-4" />
            <span>Demo Mode Active</span>
            <span className="hidden sm:inline">— Sample data is being displayed</span>
          </div>
        )}
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
