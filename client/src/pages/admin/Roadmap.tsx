import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Rocket, 
  Share2, 
  ShoppingCart,
  Users,
  BarChart3,
  Bell,
  Heart,
  Eye,
  Target,
  MessageSquare,
  Sparkles,
  Camera,
  FileSignature,
  Crown,
  Truck,
  FileText,
  Brain,
  Video,
  Shield
} from "lucide-react";

interface RoadmapItem {
  title: string;
  description: string;
  status: "completed" | "in_progress" | "planned";
  icon: React.ReactNode;
  category: string;
}

const roadmapItems: RoadmapItem[] = [
  {
    title: "Saved Vehicles",
    description: "Heart icon on vehicle cards, localStorage favorites, /saved page with grid view",
    status: "completed",
    icon: <Heart className="h-5 w-5" />,
    category: "Customer Engagement"
  },
  {
    title: "Page View Analytics",
    description: "Track vehicle page views, display most viewed vehicles in Admin Dashboard",
    status: "completed",
    icon: <Eye className="h-5 w-5" />,
    category: "Customer Engagement"
  },
  {
    title: "Price Alerts",
    description: "Customers can set email/phone alerts for price drops on saved vehicles",
    status: "completed",
    icon: <Bell className="h-5 w-5" />,
    category: "Customer Engagement"
  },
  {
    title: "Conversion Tracking",
    description: "Inquiry-to-sale rates per vehicle, efficiency metrics in Admin Dashboard",
    status: "completed",
    icon: <Target className="h-5 w-5" />,
    category: "Customer Engagement"
  },
  {
    title: "GHL Live Chat Widget",
    description: "GoHighLevel chat widget integration with admin toggle",
    status: "completed",
    icon: <MessageSquare className="h-5 w-5" />,
    category: "Integrations"
  },
  {
    title: "Dashboard Redesign",
    description: "Cleaner admin dashboard with KPI row, pipeline section, collapsible analytics",
    status: "completed",
    icon: <BarChart3 className="h-5 w-5" />,
    category: "Admin Experience"
  },
  {
    title: "Facebook Marketplace Feed",
    description: "Export vehicle listings to Facebook Marketplace via Business Manager catalog",
    status: "planned",
    icon: <Share2 className="h-5 w-5" />,
    category: "Listing Syndication"
  },
  {
    title: "Third-Party Listing Feeds",
    description: "Syndicate inventory to AutoTrader, Cars.com, CarGurus using XML/CSV feeds",
    status: "planned",
    icon: <Rocket className="h-5 w-5" />,
    category: "Listing Syndication"
  },
  {
    title: "Dealer-to-Dealer Listings",
    description: "Share inventory with partner dealerships",
    status: "planned",
    icon: <Users className="h-5 w-5" />,
    category: "Listing Syndication"
  },
  {
    title: "Wholesale Inventory Option",
    description: "Mark vehicles for wholesale distribution",
    status: "planned",
    icon: <ShoppingCart className="h-5 w-5" />,
    category: "Listing Syndication"
  },
  {
    title: "AI-Powered Pricing",
    description: "Automated valuations using VIN data, market comps, and demand forecasting with confidence bands",
    status: "planned",
    icon: <Brain className="h-5 w-5" />,
    category: "Elite Features"
  },
  {
    title: "360° Vehicle Spins",
    description: "Immersive media with 360° photo spins, AR overlays, and virtual walk-around tours",
    status: "planned",
    icon: <Camera className="h-5 w-5" />,
    category: "Elite Features"
  },
  {
    title: "Virtual Concierge Booking",
    description: "Live video walk-arounds, test-drive scheduling, and personalized ownership briefings",
    status: "planned",
    icon: <Video className="h-5 w-5" />,
    category: "Elite Features"
  },
  {
    title: "Seller Concierge Portal",
    description: "Milestone tracker (inspection → detailing → photos → live → sale → payout) with vendor scheduling",
    status: "planned",
    icon: <Sparkles className="h-5 w-5" />,
    category: "Seller Experience"
  },
  {
    title: "Document Vault & E-Sign",
    description: "Secure storage for titles and consignment agreements with digital signatures and reminders",
    status: "planned",
    icon: <FileSignature className="h-5 w-5" />,
    category: "Seller Experience"
  },
  {
    title: "Payout Calculator",
    description: "Model commission options and net proceeds for consignors with transparent breakdowns",
    status: "planned",
    icon: <FileText className="h-5 w-5" />,
    category: "Seller Experience"
  },
  {
    title: "VIP Buyer Access",
    description: "Tiered membership, early access to limited-run drops, invitation management for exclusive listings",
    status: "planned",
    icon: <Crown className="h-5 w-5" />,
    category: "Elite Features"
  },
  {
    title: "Lifestyle Services Marketplace",
    description: "Insurance, transport, PPF, storage quotes with in-app booking and partner attribution",
    status: "planned",
    icon: <Truck className="h-5 w-5" />,
    category: "Elite Features"
  },
  {
    title: "Executive Reports",
    description: "C-level dashboards with pipeline velocity, marketing ROI, and automated investor-ready PDF/CSV exports",
    status: "planned",
    icon: <Shield className="h-5 w-5" />,
    category: "Admin Experience"
  },
];

const statusConfig = {
  completed: {
    label: "Completed",
    color: "bg-green-500",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-500",
    icon: <Clock className="h-4 w-4" />,
  },
  planned: {
    label: "Planned",
    color: "bg-gray-400",
    icon: <Circle className="h-4 w-4" />,
  },
};

export default function Roadmap() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const categories = Array.from(new Set(roadmapItems.map(item => item.category)));
  
  const filteredItems = activeCategory 
    ? roadmapItems.filter(item => item.category === activeCategory)
    : roadmapItems;
  
  const completedCount = roadmapItems.filter(item => item.status === "completed").length;
  const inProgressCount = roadmapItems.filter(item => item.status === "in_progress").length;
  const plannedCount = roadmapItems.filter(item => item.status === "planned").length;

  const getCategoryCount = (category: string) => {
    const items = roadmapItems.filter(item => item.category === category);
    const completed = items.filter(item => item.status === "completed").length;
    return { total: items.length, completed };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-serif">Roadmap</h1>
          <p className="text-muted-foreground">Track feature development and upcoming improvements</p>
        </div>

        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedCount}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgressCount}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-500/10 flex items-center justify-center">
                  <Circle className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{plannedCount}</p>
                  <p className="text-sm text-muted-foreground">Planned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filter by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(null)}
                data-testid="filter-all"
              >
                All ({roadmapItems.length})
              </Button>
              {categories.map((category) => {
                const { total, completed } = getCategoryCount(category);
                return (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(category)}
                    data-testid={`filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {category} ({completed}/{total})
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {activeCategory || "All Features"}
            </CardTitle>
            <CardDescription>
              {activeCategory 
                ? `${getCategoryCount(activeCategory).completed} of ${getCategoryCount(activeCategory).total} completed`
                : `${completedCount} of ${roadmapItems.length} completed`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredItems.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    item.status === "completed" ? "bg-green-500/5 border-green-500/20" :
                    item.status === "in_progress" ? "bg-blue-500/5 border-blue-500/20" :
                    "bg-muted/50"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.status === "completed" ? "bg-green-500/10 text-green-500" :
                    item.status === "in_progress" ? "bg-blue-500/10 text-blue-500" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      <Badge 
                        variant={item.status === "completed" ? "default" : "secondary"}
                        className={`text-xs ${item.status === "completed" ? "bg-green-500" : ""}`}
                      >
                        {statusConfig[item.status].icon}
                        <span className="ml-1">{statusConfig[item.status].label}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
