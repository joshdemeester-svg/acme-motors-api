import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Users, FileText, DollarSign, TrendingUp, Clock, MessageSquare, Calendar } from "lucide-react";
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

  const availableVehicles = inventory.filter(v => v.status === "available").length;
  const soldVehicles = inventory.filter(v => v.status === "sold").length;
  const pendingConsignments = consignments.filter(c => c.status === "pending").length;
  const newInquiries = inquiries.filter(i => i.status === "new").length;
  const totalInventoryValue = inventory.reduce((sum, v) => sum + (v.price || 0), 0);
  const pendingTradeIns = tradeIns.filter(t => t.status === "pending").length;
  const upcomingAppointments = appointments.filter(a => a.status === "pending" || a.status === "confirmed").length;

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
        <div>
          <h1 className="text-2xl font-bold font-serif">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your dealership</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Available Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableVehicles}</div>
              <p className="text-xs text-muted-foreground">
                {soldVehicles} sold this period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">New Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newInquiries + pendingTradeIns}</div>
              <p className="text-xs text-muted-foreground">
                {newInquiries} inquiries, {pendingTradeIns} trade-ins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Consignments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingConsignments}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalInventoryValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {inventory.length} total vehicles
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates from your dealership</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="rounded-full bg-muted p-2">
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
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Appointments
              </CardTitle>
              <CardDescription>{upcomingAppointments} scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.filter(a => a.status === "pending" || a.status === "confirmed").slice(0, 5).length > 0 ? (
                <div className="space-y-4">
                  {appointments.filter(a => a.status === "pending" || a.status === "confirmed").slice(0, 5).map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{apt.firstName} {apt.lastName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{apt.appointmentType?.replace("_", " ") || "Appointment"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {apt.preferredDate ? new Date(apt.preferredDate).toLocaleDateString() : "TBD"}
                        </p>
                        <Badge variant={apt.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                          {apt.status || "pending"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="/admin/inventory" className="block p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <p className="font-medium text-sm">Add New Vehicle</p>
                <p className="text-xs text-muted-foreground">List a vehicle in inventory</p>
              </a>
              <a href="/admin/consignments" className="block p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <p className="font-medium text-sm">Review Consignments</p>
                <p className="text-xs text-muted-foreground">{pendingConsignments} pending</p>
              </a>
              <a href="/admin/leads" className="block p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <p className="font-medium text-sm">View Leads</p>
                <p className="text-xs text-muted-foreground">{newInquiries} new inquiries</p>
              </a>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{inventory.length}</p>
                  <p className="text-xs text-muted-foreground">Total Vehicles</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{inquiries.length}</p>
                  <p className="text-xs text-muted-foreground">Total Inquiries</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{consignments.length}</p>
                  <p className="text-xs text-muted-foreground">Consignments</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{appointments.length}</p>
                  <p className="text-xs text-muted-foreground">Appointments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
