import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, MessageSquare, Car, Calendar, Phone, Mail, Loader2, Clock, Check, X, ExternalLink } from "lucide-react";
import type { BuyerInquiry } from "@shared/schema";

interface TradeInSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  year: string;
  make: string;
  model: string;
  mileage: string;
  condition: string;
  status: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  appointmentType: string;
  vehicleId: string;
  preferredDate: string;
  preferredTime: string;
  status: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const statusValue = status || "pending";
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    new: "default",
    pending: "secondary",
    contacted: "outline",
    qualified: "default",
    converted: "default",
    closed: "secondary",
    confirmed: "default",
    completed: "secondary",
    cancelled: "destructive",
    rejected: "destructive",
  };
  
  return (
    <Badge variant={variants[statusValue] || "secondary"} className="capitalize">
      {statusValue}
    </Badge>
  );
}

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("inquiries");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inquiries = [], isLoading: loadingInquiries } = useQuery<BuyerInquiry[]>({
    queryKey: ["/api/inquiries"],
    queryFn: async () => {
      const res = await fetch("/api/inquiries");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: tradeIns = [], isLoading: loadingTradeIns } = useQuery<TradeInSubmission[]>({
    queryKey: ["/api/trade-ins"],
    queryFn: async () => {
      const res = await fetch("/api/trade-ins");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: appointments = [], isLoading: loadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    queryFn: async () => {
      const res = await fetch("/api/appointments");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const updateInquiryMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/inquiries/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({ title: "Status updated" });
    },
  });

  const updateTradeInMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/trade-ins/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade-ins"] });
      toast({ title: "Status updated" });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({ title: "Status updated" });
    },
  });

  const newInquiriesCount = inquiries.filter(i => i.status === "new").length;
  const pendingTradeInsCount = tradeIns.filter(t => t.status === "pending").length;
  const upcomingAppointmentsCount = appointments.filter(a => a.status === "pending" || a.status === "confirmed").length;

  const filterInquiries = (items: BuyerInquiry[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.buyerName.toLowerCase().includes(query) ||
      item.buyerEmail.toLowerCase().includes(query) ||
      item.buyerPhone.includes(query)
    );
  };

  const filterTradeIns = (items: TradeInSubmission[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.firstName.toLowerCase().includes(query) ||
      item.lastName.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.phone.includes(query)
    );
  };

  const filterAppointments = (items: Appointment[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.firstName.toLowerCase().includes(query) ||
      item.lastName.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.phone.includes(query)
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-serif">Leads</h1>
          <p className="text-muted-foreground">
            Manage inquiries, trade-in requests, and appointments
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-leads"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="inquiries" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Inquiries</span>
              {newInquiriesCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {newInquiriesCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="trade-ins" className="gap-2">
              <Car className="h-4 w-4" />
              <span className="hidden sm:inline">Trade-Ins</span>
              {pendingTradeInsCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingTradeInsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="appointments" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Appointments</span>
              {upcomingAppointmentsCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {upcomingAppointmentsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inquiries" className="mt-6">
            {loadingInquiries ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filterInquiries(inquiries).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No inquiries found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filterInquiries(inquiries).map((inquiry) => (
                  <Card key={inquiry.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{inquiry.buyerName}</h3>
                            <StatusBadge status={inquiry.status} />
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {inquiry.buyerEmail}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {inquiry.buyerPhone}
                            </span>
                          </div>
                          {inquiry.message && (
                            <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                              {inquiry.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={inquiry.status}
                            onValueChange={(status) => updateInquiryMutation.mutate({ id: inquiry.id, status })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="qualified">Qualified</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trade-ins" className="mt-6">
            {loadingTradeIns ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filterTradeIns(tradeIns).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Car className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No trade-in requests found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filterTradeIns(tradeIns).map((tradeIn) => (
                  <Card key={tradeIn.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{tradeIn.firstName} {tradeIn.lastName}</h3>
                            <StatusBadge status={tradeIn.status} />
                          </div>
                          <p className="text-sm font-medium">
                            {tradeIn.year} {tradeIn.make} {tradeIn.model}
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span>{tradeIn.mileage} miles</span>
                            <span className="capitalize">{tradeIn.condition} condition</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {tradeIn.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {tradeIn.phone}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={tradeIn.status}
                            onValueChange={(status) => updateTradeInMutation.mutate({ id: tradeIn.id, status })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewed">Reviewed</SelectItem>
                              <SelectItem value="offered">Offered</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            {loadingAppointments ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filterAppointments(appointments).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No appointments found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filterAppointments(appointments).map((apt) => (
                  <Card key={apt.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{apt.firstName} {apt.lastName}</h3>
                            <StatusBadge status={apt.status} />
                          </div>
                          <p className="text-sm font-medium capitalize">
                            {apt.appointmentType.replace("_", " ")}
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(apt.preferredDate).toLocaleDateString()} at {apt.preferredTime}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {apt.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {apt.phone}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={apt.status}
                            onValueChange={(status) => updateAppointmentMutation.mutate({ id: apt.id, status })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
