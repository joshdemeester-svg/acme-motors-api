import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Shield
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

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Shield className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Access Denied</h1>
          <p className="text-muted-foreground text-center max-w-md">
            The System Check page is only available to master administrators.
          </p>
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
      </div>
    </AdminLayout>
  );
}
