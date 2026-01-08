import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Database,
  Settings,
  Bell,
  MessageSquare,
  HardDrive,
  Car,
  Users,
  Globe,
  Loader2,
  Shield,
  History,
  Clock
} from "lucide-react";
import { format } from "date-fns";

type CheckStatus = "pass" | "fail" | "warning";

type SystemCheck = {
  name: string;
  status: CheckStatus;
  message: string;
  details?: any;
};

type SystemCheckResponse = {
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
    overall: CheckStatus;
  };
  checks: SystemCheck[];
};

type HistoryItem = {
  id: string;
  runAt: string;
  overallStatus: string;
  checks: SystemCheck[];
  triggeredBy: string;
};

const checkIcons: Record<string, React.ReactNode> = {
  "Database Connection": <Database className="h-5 w-5" />,
  "Site Settings": <Settings className="h-5 w-5" />,
  "Push Notification Keys": <Bell className="h-5 w-5" />,
  "GoHighLevel CRM": <MessageSquare className="h-5 w-5" />,
  "Object Storage": <HardDrive className="h-5 w-5" />,
  "Inventory Data": <Car className="h-5 w-5" />,
  "Admin Users": <Users className="h-5 w-5" />,
  "Push Subscribers": <Bell className="h-5 w-5" />,
  "SEO Configuration": <Globe className="h-5 w-5" />,
};

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === "pass") {
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  }
  if (status === "fail") {
    return <XCircle className="h-5 w-5 text-red-500" />;
  }
  return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
}

function StatusBadge({ status }: { status: CheckStatus }) {
  if (status === "pass") {
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Passed</Badge>;
  }
  if (status === "fail") {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Warning</Badge>;
}

export default function SystemCheck() {
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("current");

  const { data, isLoading, isFetching, refetch, error } = useQuery<SystemCheckResponse>({
    queryKey: ["/api/system-check"],
    queryFn: async () => {
      const res = await fetch("/api/system-check");
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access denied. Master admin privileges required.");
        }
        throw new Error("Failed to run system check");
      }
      setLastRun(new Date());
      return res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: history = [], refetch: refetchHistory } = useQuery<HistoryItem[]>({
    queryKey: ["/api/system-check/history"],
    queryFn: async () => {
      const res = await fetch("/api/system-check/history?limit=10");
      if (!res.ok) return [];
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const handleRefresh = () => {
    refetch().then(() => {
      refetchHistory();
    });
  };

  if (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isAccessDenied = errorMessage.includes("403") || errorMessage.includes("Master admin") || errorMessage.includes("Access denied");
    
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Shield className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-xl font-semibold">
            {isAccessDenied ? "Access Denied" : "Error Loading Page"}
          </h1>
          <p className="text-muted-foreground text-center max-w-md">
            {isAccessDenied 
              ? "The System Check page is only available to master administrators. If you are a master admin, please log out and log back in to refresh your session."
              : errorMessage
            }
          </p>
          {isAccessDenied && (
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/admin"}
            >
              Return to Dashboard
            </Button>
          )}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif">System Check</h1>
            <p className="text-muted-foreground">Verify all platform features are working correctly</p>
          </div>
          <div className="flex items-center gap-4">
            {lastRun && (
              <span className="text-sm text-muted-foreground">
                Last run: {format(lastRun, "h:mm:ss a")}
              </span>
            )}
            <Button 
              onClick={handleRefresh} 
              disabled={isFetching}
              variant="outline"
              data-testid="button-refresh-check"
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Run Check
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="current" className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Current Status
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-4 w-4" />
              History ({history.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="space-y-4 mt-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-3 text-muted-foreground">Running system checks...</span>
                </CardContent>
              </Card>
            ) : data ? (
              <>
                <Card className={
                  data.summary.overall === "pass" 
                    ? "border-green-200 bg-green-50/50" 
                    : data.summary.overall === "fail" 
                      ? "border-red-200 bg-red-50/50" 
                      : "border-yellow-200 bg-yellow-50/50"
                }>
                  <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          data.summary.overall === "pass" 
                            ? "bg-green-100" 
                            : data.summary.overall === "fail" 
                              ? "bg-red-100" 
                              : "bg-yellow-100"
                        }`}>
                          {data.summary.overall === "pass" ? (
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                          ) : data.summary.overall === "fail" ? (
                            <XCircle className="h-8 w-8 text-red-600" />
                          ) : (
                            <AlertTriangle className="h-8 w-8 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">
                            {data.summary.overall === "pass" 
                              ? "All Systems Operational" 
                              : data.summary.overall === "fail" 
                                ? "System Issues Detected" 
                                : "Some Warnings Found"
                            }
                          </h2>
                          <p className="text-muted-foreground">
                            {data.summary.passed} passed, {data.summary.warnings} warnings, {data.summary.failed} failed
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(data.timestamp), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4">
                  {data.checks.map((check, index) => (
                    <Card key={index} data-testid={`check-${check.name.toLowerCase().replace(/\s+/g, '-')}`}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-muted">
                            {checkIcons[check.name] || <Settings className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{check.name}</h3>
                              <StatusBadge status={check.status} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{check.message}</p>
                          </div>
                          <StatusIcon status={check.status} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : null}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 mt-4">
            {history.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No check history yet. Run a check to start tracking.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {history.map((item) => {
                  const passed = item.checks.filter(c => c.status === "pass").length;
                  const warnings = item.checks.filter(c => c.status === "warning").length;
                  const failed = item.checks.filter(c => c.status === "fail").length;
                  
                  return (
                    <Card key={item.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${
                            item.overallStatus === "healthy" 
                              ? "bg-green-100" 
                              : item.overallStatus === "unhealthy" 
                                ? "bg-red-100" 
                                : "bg-yellow-100"
                          }`}>
                            {item.overallStatus === "healthy" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : item.overallStatus === "unhealthy" ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {format(new Date(item.runAt), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {item.triggeredBy || "manual"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {passed} passed, {warnings} warnings, {failed} failed
                            </p>
                          </div>
                          <Badge className={
                            item.overallStatus === "healthy" 
                              ? "bg-green-100 text-green-700 hover:bg-green-100" 
                              : item.overallStatus === "unhealthy" 
                                ? "bg-red-100 text-red-700 hover:bg-red-100" 
                                : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                          }>
                            {item.overallStatus === "healthy" ? "Healthy" : item.overallStatus === "unhealthy" ? "Unhealthy" : "Degraded"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
