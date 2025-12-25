import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Car, Clock, CheckCircle, XCircle, AlertCircle, LogOut, Loader2, DollarSign, Tag, FileCheck, TrendingUp, MessageSquare, FileText, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useUpload } from "@/hooks/use-upload";

interface ConsignmentSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  mileage: number;
  color: string;
  condition: string;
  modifications: string | null;
  askingPrice: number | null;
  photos: string[];
  status: string;
  createdAt: string;
}

interface StatusHistoryEntry {
  id: string;
  consignmentId: string;
  status: string;
  note: string | null;
  createdAt: string;
}

const milestones = [
  { key: "pending", label: "Submitted", icon: FileCheck },
  { key: "approved", label: "Approved", icon: CheckCircle },
  { key: "listed", label: "Listed", icon: Tag },
  { key: "sold", label: "Sold", icon: DollarSign },
];

function StatusTimeline({ currentStatus, consignmentId }: { currentStatus: string; consignmentId: string }) {
  const { data: history = [] } = useQuery({
    queryKey: ["/api/seller/consignments", consignmentId, "history"],
    queryFn: async () => {
      const res = await fetch(`/api/seller/consignments/${consignmentId}/history`);
      if (!res.ok) return [];
      return res.json() as Promise<StatusHistoryEntry[]>;
    },
  });

  const statusOrder = ["pending", "approved", "listed", "sold"];
  const currentIndex = statusOrder.indexOf(currentStatus);
  const isRejected = currentStatus === "rejected";

  const getStatusDate = (status: string) => {
    const entry = history.find(h => h.status === status);
    if (entry) {
      return new Date(entry.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
    return null;
  };

  if (isRejected) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400">
        <XCircle className="h-5 w-5" />
        <span className="text-sm">This vehicle was not accepted for consignment</span>
      </div>
    );
  }

  return (
    <div className="relative mt-4">
      <div className="flex items-center justify-between">
        {milestones.map((milestone, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = milestone.icon;
          const date = getStatusDate(milestone.key);

          return (
            <div key={milestone.key} className="relative flex flex-1 flex-col items-center">
              {index < milestones.length - 1 && (
                <div
                  className={`absolute left-1/2 top-5 h-0.5 w-full ${
                    index < currentIndex ? "bg-emerald-700" : "bg-gray-700"
                  }`}
                />
              )}
              <div
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  isCompleted
                    ? isCurrent
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-emerald-600 bg-emerald-800/60 text-emerald-300"
                    : "border-gray-600 bg-gray-800 text-gray-500"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className={`mt-2 text-xs font-medium ${isCompleted ? "text-gray-200" : "text-gray-500"}`}>
                {milestone.label}
              </span>
              {date && (
                <span className="text-xs text-gray-500">{date}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PayoutInfo {
  status: string;
  hasListing: boolean;
  listingPrice?: number;
  commissionRate?: number;
  estimatedPayout?: number;
  isCustomPayout?: boolean;
  message?: string;
}

function PayoutCard({ consignmentId }: { consignmentId: string }) {
  const { data: payout } = useQuery({
    queryKey: ["/api/seller/consignments", consignmentId, "payout"],
    queryFn: async () => {
      const res = await fetch(`/api/seller/consignments/${consignmentId}/payout`);
      if (!res.ok) return null;
      return res.json() as Promise<PayoutInfo>;
    },
  });

  if (!payout?.hasListing) {
    return (
      <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
        <div className="flex items-center gap-2 text-gray-400">
          <DollarSign className="h-5 w-5" />
          <span className="text-sm">Payout information will be available once your vehicle is listed</span>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="mt-4 rounded-lg border border-emerald-800/50 bg-emerald-900/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="h-5 w-5 text-emerald-400" />
        <span className="font-medium text-white">Estimated Payout</span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Listing Price</span>
          <span className="text-white">{formatCurrency(payout.listingPrice!)}</span>
        </div>
        {!payout.isCustomPayout && (
          <div className="flex justify-between">
            <span className="text-gray-400">Commission ({payout.commissionRate}%)</span>
            <span className="text-red-400">-{formatCurrency(Math.round(payout.listingPrice! * (payout.commissionRate! / 100)))}</span>
          </div>
        )}
        <Separator className="my-2 bg-gray-700" />
        <div className="flex justify-between text-lg">
          <span className="font-medium text-white">Your Payout</span>
          <span className="font-bold text-emerald-400">{formatCurrency(payout.estimatedPayout!)}</span>
        </div>
      </div>
    </div>
  );
}

interface SellerNote {
  id: string;
  consignmentId: string;
  content: string;
  createdAt: string;
}

function NotesCard({ consignmentId }: { consignmentId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: notes = [] } = useQuery({
    queryKey: ["/api/seller/consignments", consignmentId, "notes"],
    queryFn: async () => {
      const res = await fetch(`/api/seller/consignments/${consignmentId}/notes`);
      if (!res.ok) return [];
      return res.json() as Promise<SellerNote[]>;
    },
  });

  if (notes.length === 0) return null;

  const visibleNotes = expanded ? notes : notes.slice(0, 2);

  return (
    <div className="mt-4 rounded-lg border border-blue-800/50 bg-blue-900/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-5 w-5 text-blue-400" />
        <span className="font-medium text-white">Updates from Our Team</span>
      </div>
      <div className="space-y-3">
        {visibleNotes.map((note) => (
          <div key={note.id} className="rounded bg-gray-800/50 p-3">
            <p className="text-sm text-gray-300">{note.content}</p>
            <p className="mt-1 text-xs text-gray-500">
              {new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        ))}
      </div>
      {notes.length > 2 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full text-blue-400 hover:text-blue-300"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-1 h-4 w-4" /> Show Less
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-4 w-4" /> Show {notes.length - 2} More Updates
            </>
          )}
        </Button>
      )}
    </div>
  );
}

interface SellerDocument {
  id: string;
  consignmentId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  status: string;
  createdAt: string;
}

const documentTypes = [
  { value: "title", label: "Vehicle Title" },
  { value: "registration", label: "Registration" },
  { value: "service_records", label: "Service Records" },
  { value: "other", label: "Other Document" },
];

function DocumentsCard({ consignmentId }: { consignmentId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getUploadParameters } = useUpload();
  const [selectedType, setSelectedType] = useState("title");

  const { data: documents = [] } = useQuery({
    queryKey: ["/api/seller/consignments", consignmentId, "documents"],
    queryFn: async () => {
      const res = await fetch(`/api/seller/consignments/${consignmentId}/documents`);
      if (!res.ok) return [];
      return res.json() as Promise<SellerDocument[]>;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { documentType: string; fileName: string; fileUrl: string }) => {
      const res = await fetch(`/api/seller/consignments/${consignmentId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to upload document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/consignments", consignmentId, "documents"] });
      toast({ title: "Document Uploaded", description: "Your document has been submitted for review." });
    },
    onError: () => {
      toast({ title: "Upload Failed", description: "Failed to upload document. Please try again.", variant: "destructive" });
    },
  });

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const urlParts = uploadedFile.uploadURL?.split("/") || [];
      const objectId = urlParts[urlParts.length - 1]?.split("?")[0] || "";
      const objectPath = `/objects/uploads/${objectId}`;
      
      uploadMutation.mutate({
        documentType: selectedType,
        fileName: uploadedFile.name || "document",
        fileUrl: objectPath,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending Review</Badge>;
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-5 w-5 text-gray-400" />
        <span className="font-medium text-white">Documents</span>
      </div>

      {documents.length > 0 && (
        <div className="mb-4 space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded bg-gray-800/50 p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-white">{documentTypes.find(t => t.value === doc.documentType)?.label || doc.documentType}</p>
                  <p className="text-xs text-gray-500">{doc.fileName}</p>
                </div>
              </div>
              {getStatusBadge(doc.status)}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Document Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <ObjectUploader
          maxNumberOfFiles={1}
          maxFileSize={10485760}
          onGetUploadParameters={getUploadParameters}
          onComplete={handleUploadComplete}
          buttonClassName="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </ObjectUploader>
        <p className="text-xs text-gray-500">Upload title, registration, or service records (PDF, JPG, PNG - max 10MB)</p>
      </div>
    </div>
  );
}

function WhatsNextCard({ consignmentId, createdAt, status }: { consignmentId: string; createdAt: string; status: string }) {
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      return res.json();
    },
  });

  const avgDaysToFirstInquiry = settings?.avgDaysToFirstInquiry || 5;
  const avgDaysToSell = settings?.avgDaysToSell || 45;

  const daysListed = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));

  if (status === "sold") {
    return (
      <div className="mt-4 rounded-lg border border-purple-800/50 bg-purple-900/20 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-purple-400" />
          <span className="font-medium text-white">Congratulations!</span>
        </div>
        <p className="mt-2 text-sm text-gray-300">Your vehicle has been sold. Our team will contact you about payout details.</p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="mt-4 rounded-lg border border-yellow-800/50 bg-yellow-900/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-yellow-400" />
          <span className="font-medium text-white">What's Next</span>
        </div>
        <p className="text-sm text-gray-300">Our team is reviewing your submission. This typically takes 1-2 business days.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-blue-800/50 bg-blue-900/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-5 w-5 text-blue-400" />
        <span className="font-medium text-white">What's Next</span>
      </div>
      <p className="text-sm text-gray-400 mb-3">Based on similar vehicles:</p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Time to first inquiry</span>
          <span className="text-white">~{avgDaysToFirstInquiry} days</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Average time to sell</span>
          <span className="text-white">{avgDaysToSell} days</span>
        </div>
        <Separator className="my-2 bg-gray-700" />
        <div className="flex justify-between">
          <span className="text-gray-400">Your vehicle has been listed</span>
          <span className="font-medium text-blue-400">{daysListed} days</span>
        </div>
      </div>
    </div>
  );
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending Review",
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    icon: <Clock className="h-4 w-4" />,
  },
  approved: {
    label: "Approved",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  listed: {
    label: "Listed for Sale",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: <Car className="h-4 w-4" />,
  },
  sold: {
    label: "Sold",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  rejected: {
    label: "Not Accepted",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: <XCircle className="h-4 w-4" />,
  },
};

export default function SellerPortal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/seller/session"],
    queryFn: async () => {
      const res = await fetch("/api/seller/session");
      return res.json();
    },
  });

  const { data: consignments = [], isLoading: consignmentsLoading, error: consignmentsError, refetch: refetchConsignments } = useQuery({
    queryKey: ["/api/seller/consignments"],
    queryFn: async () => {
      const res = await fetch("/api/seller/consignments");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch consignments");
      }
      return res.json() as Promise<ConsignmentSubmission[]>;
    },
    enabled: session?.authenticated,
    retry: 1,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/seller/logout", { method: "POST" });
      if (!res.ok) throw new Error("Failed to logout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/session"] });
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      setLocation("/");
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session?.authenticated) {
      setLocation("/");
    }
  }, [session, sessionLoading, setLocation]);

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.authenticated) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "To Be Determined";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-serif text-3xl font-bold text-white md:text-4xl">
                  Seller Portal
                </h1>
                <p className="mt-2 text-gray-400">
                  Track your vehicle consignments and their status
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="btn-seller-logout"
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Log Out
              </Button>
            </div>

            <Separator className="mb-8 bg-gray-800" />

            {consignmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : consignmentsError ? (
              <Card className="border-gray-800 bg-gray-900/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
                  <h3 className="text-lg font-medium text-white">Unable to Load Consignments</h3>
                  <p className="mt-2 text-center text-gray-400">
                    {consignmentsError instanceof Error ? consignmentsError.message : "Something went wrong. Please try again."}
                  </p>
                  <Button
                    className="mt-6"
                    onClick={() => refetchConsignments()}
                    data-testid="btn-retry-consignments"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : consignments.length === 0 ? (
              <Card className="border-gray-800 bg-gray-900/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="mb-4 h-12 w-12 text-gray-500" />
                  <h3 className="text-lg font-medium text-white">No Consignments Found</h3>
                  <p className="mt-2 text-center text-gray-400">
                    You haven't submitted any vehicles for consignment yet.
                  </p>
                  <Button
                    className="mt-6"
                    onClick={() => setLocation("/consign")}
                    data-testid="btn-submit-consignment"
                  >
                    Submit a Vehicle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {consignments.map((consignment, index) => {
                  const status = statusConfig[consignment.status] || statusConfig.pending;
                  return (
                    <motion.div
                      key={consignment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="border-gray-800 bg-gray-900/50 overflow-hidden" data-testid={`card-consignment-${consignment.id}`}>
                        <CardHeader className="pb-4">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <CardTitle className="font-serif text-xl text-white">
                                {consignment.year} {consignment.make} {consignment.model}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                Submitted on {formatDate(consignment.createdAt)}
                              </CardDescription>
                            </div>
                            <Badge className={`${status.color} flex items-center gap-1.5 px-3 py-1`}>
                              {status.icon}
                              {status.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-sm text-gray-400">VIN</p>
                              <p className="font-mono text-sm text-white">{consignment.vin}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Mileage</p>
                              <p className="text-white">{consignment.mileage.toLocaleString()} miles</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Color</p>
                              <p className="text-white">{consignment.color}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Asking Price</p>
                              <p className="text-white">{formatPrice(consignment.askingPrice)}</p>
                            </div>
                          </div>

                          <StatusTimeline currentStatus={consignment.status} consignmentId={consignment.id} />

                          <div className="mt-6 grid gap-4 lg:grid-cols-2">
                            <div>
                              <PayoutCard consignmentId={consignment.id} />
                              <WhatsNextCard consignmentId={consignment.id} createdAt={consignment.createdAt} status={consignment.status} />
                            </div>
                            <div>
                              <NotesCard consignmentId={consignment.id} />
                              <DocumentsCard consignmentId={consignment.id} />
                            </div>
                          </div>

                          {consignment.photos && consignment.photos.length > 0 && (
                            <div className="mt-6">
                              <p className="mb-3 text-sm text-gray-400">Photos ({consignment.photos.length})</p>
                              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                                {consignment.photos.slice(0, 8).map((photo, photoIndex) => (
                                  <div
                                    key={photoIndex}
                                    className="aspect-square overflow-hidden rounded-lg bg-gray-800"
                                  >
                                    <img
                                      src={photo}
                                      alt={`Vehicle photo ${photoIndex + 1}`}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
