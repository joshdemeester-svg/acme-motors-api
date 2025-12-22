import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, Eye, DollarSign } from "lucide-react";
import type { ConsignmentSubmission, InventoryCar } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    pending: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
    approved: { variant: "default", icon: <Check className="h-3 w-3" /> },
    rejected: { variant: "destructive", icon: <X className="h-3 w-3" /> },
    available: { variant: "default", icon: <Check className="h-3 w-3" /> },
    sold: { variant: "secondary", icon: <DollarSign className="h-3 w-3" /> },
  };
  const config = variants[status] || variants.pending;
  
  return (
    <Badge variant={config.variant} className="gap-1 capitalize">
      {config.icon}
      {status}
    </Badge>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<ConsignmentSubmission | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [price, setPrice] = useState("");

  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery<ConsignmentSubmission[]>({
    queryKey: ["/api/consignments"],
    queryFn: async () => {
      const res = await fetch("/api/consignments");
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
  });

  const { data: inventory = [], isLoading: loadingInventory } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory/all"],
    queryFn: async () => {
      const res = await fetch("/api/inventory/all");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const res = await fetch(`/api/consignments/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/all"] });
      toast({ title: "Submission Approved", description: "The vehicle has been added to inventory." });
      setApproveDialogOpen(false);
      setSelectedSubmission(null);
      setPrice("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve submission.", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/consignments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consignments"] });
      toast({ title: "Submission Rejected" });
    },
  });

  const pendingSubmissions = submissions.filter(s => s.status === "pending");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="container px-4 py-12 md:px-6">
        <div className="mb-8">
          <h1 className="mb-2 font-serif text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage consignment submissions and inventory.</p>
        </div>

        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="submissions" className="gap-2">
              Submissions
              {pendingSubmissions.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingSubmissions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="inventory">Inventory ({inventory.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-4">
            {loadingSubmissions ? (
              <p>Loading...</p>
            ) : submissions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No submissions yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {submissions.map((sub) => (
                  <Card key={sub.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                      <div>
                        <CardTitle className="font-serif text-xl">
                          {sub.year} {sub.make} {sub.model}
                        </CardTitle>
                        <CardDescription>
                          VIN: {sub.vin} | {sub.mileage} miles | {sub.color}
                        </CardDescription>
                      </div>
                      <StatusBadge status={sub.status} />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 text-sm md:grid-cols-2">
                        <div>
                          <span className="font-medium">Contact:</span> {sub.firstName} {sub.lastName}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {sub.email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {sub.phone}
                        </div>
                        <div>
                          <span className="font-medium">Condition:</span> {sub.condition} | {sub.accidentHistory}
                        </div>
                      </div>
                      
                      {sub.photos && sub.photos.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Photos ({sub.photos.length}):</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {sub.photos.map((photo, i) => (
                              <img
                                key={i}
                                src={photo}
                                alt={`Photo ${i + 1}`}
                                className="h-20 w-20 rounded-md border object-cover"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {sub.description && (
                        <div>
                          <span className="text-sm font-medium">Description:</span>
                          <p className="mt-1 text-sm text-muted-foreground">{sub.description}</p>
                        </div>
                      )}

                      {sub.status === "pending" && (
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setApproveDialogOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Check className="h-4 w-4" /> Approve & Set Price
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => rejectMutation.mutate(sub.id)}
                            disabled={rejectMutation.isPending}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" /> Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            {loadingInventory ? (
              <p>Loading...</p>
            ) : inventory.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No vehicles in inventory yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inventory.map((car) => (
                  <Card key={car.id} className="overflow-hidden">
                    {car.photos && car.photos.length > 0 && (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={car.photos[0]}
                          alt={`${car.make} ${car.model}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="font-serif text-lg">
                          {car.year} {car.make} {car.model}
                        </CardTitle>
                        <CardDescription>
                          {car.mileage.toLocaleString()} miles
                        </CardDescription>
                      </div>
                      <StatusBadge status={car.status} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">
                        ${car.price.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve & Set Price</DialogTitle>
            <DialogDescription>
              Set the listing price for {selectedSubmission?.year} {selectedSubmission?.make} {selectedSubmission?.model}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Listing Price ($)</Label>
              <Input
                id="price"
                type="number"
                placeholder="e.g. 45000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSubmission && price) {
                  approveMutation.mutate({ id: selectedSubmission.id, price: parseInt(price) });
                }
              }}
              disabled={!price || approveMutation.isPending}
            >
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
