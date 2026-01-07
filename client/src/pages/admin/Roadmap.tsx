import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Zap
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
  const categories = [...new Set(roadmapItems.map(item => item.category))];
  
  const completedCount = roadmapItems.filter(item => item.status === "completed").length;
  const inProgressCount = roadmapItems.filter(item => item.status === "in_progress").length;
  const plannedCount = roadmapItems.filter(item => item.status === "planned").length;

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

        {categories.map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
              <CardDescription>
                {roadmapItems.filter(item => item.category === category && item.status === "completed").length} of{" "}
                {roadmapItems.filter(item => item.category === category).length} completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roadmapItems
                  .filter(item => item.category === category)
                  .map((item, index) => (
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
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.title}</h4>
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
        ))}
      </div>
    </AdminLayout>
  );
}
