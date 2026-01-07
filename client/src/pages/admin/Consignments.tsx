import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, FileText, Check, X, Clock, DollarSign, Loader2, Phone, Mail, Eye, Car, HelpCircle, ArrowRight } from "lucide-react";
import { AdminHelpBox } from "@/components/admin/AdminHelpBox";
import type { ConsignmentSubmission } from "@shared/schema";
import placeholderCar from '@assets/stock_images/car_silhouette_place_c08b6507.jpg';

function StatusBadge({ status }: { status: string | null | undefined }) {
  const statusValue = status || "pending";
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    pending: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
    approved: { variant: "default", icon: <Check className="h-3 w-3" /> },
    listed: { variant: "default", icon: <Car className="h-3 w-3" /> },
    sold: { variant: "secondary", icon: <DollarSign className="h-3 w-3" /> },
    rejected: { variant: "destructive", icon: <X className="h-3 w-3" /> },
  };
  const config = variants[statusValue] || variants.pending;
  
  return (
    <Badge variant={config.variant} className="gap-1 capitalize">
      {config.icon}
      {statusValue}
    </Badge>
  );
}

export default function Consignments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConsignment, setSelectedConsignment] = useState<ConsignmentSubmission | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: consignments = [], isLoading } = useQuery<ConsignmentSubmission[]>({
    queryKey: ["/api/consignments"],
    queryFn: async () => {
      const res = await fetch("/api/consignments");
      if (!res.ok) throw new Error("Failed to fetch consignments");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/consignments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consignments"] });
      toast({ title: "Status updated successfully" });
    },
  });

  const filteredConsignments = consignments.filter((c) => {
    const ownerFullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const matchesSearch = searchQuery === "" || 
      c.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ownerFullName.includes(searchQuery.toLowerCase()) ||
      (c.vin && c.vin.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = consignments.filter(c => c.status === "pending").length;
  const approvedCount = consignments.filter(c => c.status === "approved" || c.status === "listed").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminHelpBox
          title="Consignment Workflow"
          description="When sellers submit vehicles for consignment, they appear here for your review. You control the entire process from submission to sale."
          icon={HelpCircle}
          variant="info"
          defaultOpen={false}
          className="mb-2"
          steps={[
            { title: "Pending", description: "New submissions awaiting your review. Verify vehicle details and photos." },
            { title: "Approved", description: "You've accepted the vehicle. Now add pricing and prepare for listing." },
            { title: "Listed", description: "Vehicle is live on your website. Click 'Convert to Inventory' to add it." },
            { title: "Sold", description: "Vehicle has been sold. Finalize with the seller." },
          ]}
          tips={[
            "Use 'Convert to Inventory' to create a full vehicle listing with your pricing",
            "Rejected submissions notify the seller via SMS automatically",
            "Photos uploaded by sellers are preserved when converting to inventory"
          ]}
        />

        <div>
          <h1 className="text-2xl font-bold font-serif">Consignments</h1>
          <p className="text-muted-foreground">
            {pendingCount} pending review, {approvedCount} active
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by vehicle, owner, or VIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-consignments"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="listed">Listed</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConsignments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No consignments found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all" ? "Try different filters" : "No consignment requests yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredConsignments.map((consignment) => (
              <Card key={consignment.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-48 h-32 md:h-auto bg-muted shrink-0">
                      <img
                        src={consignment.photos?.[0] || placeholderCar}
                        alt={`${consignment.year} ${consignment.make} ${consignment.model}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = placeholderCar;
                        }}
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">
                              {consignment.year} {consignment.make} {consignment.model}
                            </h3>
                            <StatusBadge status={consignment.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Owner: {consignment.firstName} {consignment.lastName}
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {consignment.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {consignment.email}
                            </span>
                          </div>
                          {consignment.customPayoutAmount && (
                            <p className="text-sm font-medium text-primary">
                              Custom Payout: ${consignment.customPayoutAmount.toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Submitted: {consignment.createdAt ? new Date(consignment.createdAt).toLocaleDateString() : ""}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedConsignment(consignment)}
                            data-testid={`button-view-consignment-${consignment.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          <Select
                            value={consignment.status}
                            onValueChange={(status) => updateStatusMutation.mutate({ id: consignment.id, status })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="listed">Listed</SelectItem>
                              <SelectItem value="sold">Sold</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedConsignment} onOpenChange={() => setSelectedConsignment(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedConsignment?.year} {selectedConsignment?.make} {selectedConsignment?.model}
            </DialogTitle>
            <DialogDescription>
              Consignment details and photos
            </DialogDescription>
          </DialogHeader>
          
          {selectedConsignment && (
            <div className="space-y-4">
              {selectedConsignment.photos && selectedConsignment.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedConsignment.photos.slice(0, 4).map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Owner</Label>
                  <p className="font-medium">{selectedConsignment.firstName} {selectedConsignment.lastName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedConsignment.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedConsignment.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">VIN</Label>
                  <p className="font-medium font-mono">{selectedConsignment.vin || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Mileage</Label>
                  <p className="font-medium">{selectedConsignment.mileage || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Custom Payout</Label>
                  <p className="font-medium text-primary">
                    {selectedConsignment.customPayoutAmount ? `$${selectedConsignment.customPayoutAmount.toLocaleString()}` : "Not specified"}
                  </p>
                </div>
              </div>

              {selectedConsignment.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1">{selectedConsignment.description}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedConsignment(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
