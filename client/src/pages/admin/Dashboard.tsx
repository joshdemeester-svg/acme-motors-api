import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Car, Users, DollarSign, Target, Clock, MessageSquare, Calendar, 
  Eye, BarChart3, CheckCircle, ChevronDown, ChevronUp, ArrowRight,
  FileText, TrendingUp, Plus, Bell, Send, Heart
} from "lucide-react";
import { Link } from "wouter";
import type { ConsignmentSubmission, InventoryCar, BuyerInquiry } from "@shared/schema";

interface TradeInSubmission {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  status: string;
}

interface Appointment {
  id: string;
  firstName: string;
  lastName: string;
  appointmentType: string;
  preferredDate: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const { data: inventory = [] } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: consignments = [] } = useQuery<ConsignmentSubmission[]>({
    queryKey: ["/api/consignments"],
    queryFn: async () => {
      const res = await fetch("/api/consignments");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: inquiries = [] } = useQuery<BuyerInquiry[]>({
    queryKey: ["/api/inquiries"],
    queryFn: async () => {
      const res = await fetch("/api/inquiries");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: tradeIns = [] } = useQuery<TradeInSubmission[]>({
    queryKey: ["/api/trade-ins"],
    queryFn: async () => {
      const res = await fetch("/api/trade-ins");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    queryFn: async () => {
      const res = await fetch("/api/appointments");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: analytics } = useQuery<{
    totalViews: number;
    totalSaves: number;
    mostViewed: Array<{
      vehicleId: string;
      viewCount: number;
      vehicle: {
        id: string;
        year: number;
        make: string;
        model: string;
        status: string;
        price: number;
        photo: string | null;
      };
    }>;
    topSaved: Array<{
      vehicleId: string;
      saveCount: number;
      vehicle: {
        id: string;
        year: number;
        make: string;
        model: string;
        status: string;
        price: number;
        photo: string | null;
      };
    }>;
    conversions: {
      vehiclesWithInquiries: number;
      soldWithInquiries: number;
      overallConversionRate: number;
      topVehicles: Array<{
        vehicleId: string;
        year: number;
        make: string;
        model: string;
        status: string;
        price: number;
        photo: string | null;
        inquiryCount: number;
        sold: boolean;
        converted: boolean;
        efficiencyRate: number | null;
      }>;
    };
  }>({
    queryKey: ["/api/analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      if (!res.ok) return { totalViews: 0, totalSaves: 0, mostViewed: [], topSaved: [], conversions: { vehiclesWithInquiries: 0, soldWithInquiries: 0, overallConversionRate: 0, topVehicles: [] } };
      return res.json();
    },
  });

  const availableVehicles = inventory.filter(v => v.status === "available").length;
  const pendingConsignments = consignments.filter(c => c.status === "pending").length;
  const newInquiries = inquiries.filter(i => i.status === "new").length;
  const pendingTradeIns = tradeIns.filter(t => t.status === "pending").length;
  const totalInventoryValue = inventory.reduce((sum, v) => sum + (v.price || 0), 0);
  const upcomingAppointments = appointments.filter(a => a.status === "pending" || a.status === "confirmed");

  const recentActivity = [
    ...inquiries.slice(0, 3).map(i => ({
      type: "inquiry" as const,
      title: `New inquiry from ${i.buyerName}`,
      time: i.createdAt ? new Date(i.createdAt).toISOString() : new Date().toISOString(),
      icon: <MessageSquare className="h-4 w-4" />,
    })),
    ...consignments.filter(c => c.status === "pending").slice(0, 2).map(c => ({
      type: "consignment" as const,
      title: `New consignment: ${c.year} ${c.make} ${c.model}`,
      time: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      icon: <FileText className="h-4 w-4" />,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-serif">Dashboard</h1>
            <p className="text-muted-foreground">Your dealership at a glance</p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/inventory?action=add">
              <Button size="sm" className="gap-2" data-testid="quick-add-vehicle">
                <Plus className="h-4 w-4" />
                Add Vehicle
              </Button>
            </Link>
            <Link href="/admin/leads">
              <Button size="sm" variant="outline" className="gap-2" data-testid="quick-view-leads">
                <Users className="h-4 w-4" />
                {newInquiries > 0 && <Badge className="bg-red-500 text-white text-xs px-1.5 py-0">{newInquiries}</Badge>}
                Leads
              </Button>
            </Link>
            <Link href="/admin/notifications">
              <Button size="sm" variant="outline" className="gap-2" data-testid="quick-send-notification">
                <Bell className="h-4 w-4" />
                Notify
              </Button>
            </Link>
            <Link href="/admin/sms">
              <Button size="sm" variant="outline" className="gap-2" data-testid="quick-sms">
                <Send className="h-4 w-4" />
                SMS
              </Button>
            </Link>
          </div>
        </div>

        {/* SECTION 1: Executive Snapshot - 4 Primary KPIs */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalInventoryValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{inventory.length} vehicles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableVehicles}</div>
              <p className="text-xs text-muted-foreground">Ready to sell</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newInquiries + pendingTradeIns}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(analytics?.conversions?.overallConversionRate || 0)}%</div>
              <p className="text-xs text-muted-foreground">Inquiry to sale</p>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 2: Pipeline & Activity - Two Column */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Left: Quick Actions & Pipeline Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Pipeline Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a 
                href="/admin/leads" 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                data-testid="link-leads"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Buyer Inquiries</p>
                    <p className="text-xs text-muted-foreground">{newInquiries} new</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </a>

              <a 
                href="/admin/consignments" 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                data-testid="link-consignments"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium">Consignments</p>
                    <p className="text-xs text-muted-foreground">{pendingConsignments} pending review</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </a>

              <a 
                href="/admin/inventory" 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                data-testid="link-inventory"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Car className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Inventory</p>
                    <p className="text-xs text-muted-foreground">{availableVehicles} available</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </a>
            </CardContent>
          </Card>

          {/* Right: Recent Activity & Appointments */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 3).map((activity, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="rounded-full bg-muted p-2 flex-shrink-0">
                          {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.time).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">No recent activity</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5" />
                    Appointments
                  </CardTitle>
                  <Badge variant="secondary">{upcomingAppointments.length} upcoming</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.slice(0, 2).length > 0 ? (
                  <div className="space-y-3">
                    {upcomingAppointments.slice(0, 2).map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{apt.firstName} {apt.lastName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{apt.appointmentType?.replace("_", " ") || "Appointment"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{apt.preferredDate ? new Date(apt.preferredDate).toLocaleDateString() : "TBD"}</p>
                          <Badge variant={apt.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                            {apt.status || "pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">No upcoming appointments</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECTION 3: Analytics Panel - Collapsible */}
        <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    <CardTitle className="text-lg">Analytics & Insights</CardTitle>
                    <Badge variant="outline" className="ml-2">
                      {analytics?.totalViews?.toLocaleString() || 0} views
                    </Badge>
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      {analytics?.totalSaves?.toLocaleString() || 0} saves
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1">
                    {analyticsOpen ? (
                      <>Hide <ChevronUp className="h-4 w-4" /></>
                    ) : (
                      <>Show <ChevronDown className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0">
                <Tabs defaultValue="views" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="views" className="gap-2">
                      <Eye className="h-4 w-4" /> Page Views
                    </TabsTrigger>
                    <TabsTrigger value="conversions" className="gap-2">
                      <Target className="h-4 w-4" /> Conversions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="views" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <p className="text-3xl font-bold text-primary">{analytics?.totalViews?.toLocaleString() || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Views</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <p className="text-3xl font-bold text-red-500">{analytics?.totalSaves?.toLocaleString() || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Saves</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <p className="text-3xl font-bold">{analytics?.mostViewed?.length || 0}</p>
                        <p className="text-sm text-muted-foreground">Vehicles Viewed</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Most Viewed Vehicles
                      </h4>
                      {analytics?.mostViewed && analytics.mostViewed.length > 0 ? (
                        <div className="space-y-2">
                          {analytics.mostViewed.slice(0, 5).map((item, index) => (
                            <div key={item.vehicleId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {index + 1}
                              </div>
                              {item.vehicle.photo && (
                                <img 
                                  src={item.vehicle.photo} 
                                  alt={`${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`}
                                  className="w-12 h-8 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-sm font-semibold">
                                <Eye className="h-3 w-3" />
                                {item.viewCount}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No view data yet
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" /> Top Saved Vehicles
                      </h4>
                      {analytics?.topSaved && analytics.topSaved.length > 0 ? (
                        <div className="space-y-2">
                          {analytics.topSaved.slice(0, 5).map((item, index) => (
                            <div key={item.vehicleId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600">
                                {index + 1}
                              </div>
                              {item.vehicle.photo && (
                                <img 
                                  src={item.vehicle.photo} 
                                  alt={`${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`}
                                  className="w-12 h-8 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-sm font-semibold text-red-600">
                                <Heart className="h-3 w-3 fill-current" />
                                {item.saveCount}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No saves yet
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="conversions" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <p className="text-3xl font-bold text-primary">
                          {Math.round(analytics?.conversions?.overallConversionRate || 0)}%
                        </p>
                        <p className="text-sm text-muted-foreground">Conversion Rate</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <p className="text-3xl font-bold">
                          {analytics?.conversions?.vehiclesWithInquiries || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">With Inquiries</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <p className="text-3xl font-bold text-green-500">
                          {analytics?.conversions?.soldWithInquiries || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Converted</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Top Vehicles by Interest
                      </h4>
                      {analytics?.conversions?.topVehicles && analytics.conversions.topVehicles.length > 0 ? (
                        <div className="space-y-2">
                          {analytics.conversions.topVehicles.slice(0, 5).map((item, index) => (
                            <div key={item.vehicleId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {index + 1}
                              </div>
                              {item.photo && (
                                <img 
                                  src={item.photo} 
                                  alt={`${item.year} ${item.make} ${item.model}`}
                                  className="w-12 h-8 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.year} {item.make} {item.model}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.inquiryCount} {item.inquiryCount === 1 ? 'inq' : 'inqs'}
                                </Badge>
                                {item.converted ? (
                                  <Badge variant="default" className="text-xs bg-green-500">
                                    Sold
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    Active
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No inquiry data yet
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </AdminLayout>
  );
}
