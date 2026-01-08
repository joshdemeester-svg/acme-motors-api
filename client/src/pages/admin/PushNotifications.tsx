import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { 
  Bell, 
  Send, 
  Users, 
  History,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Filter,
  HelpCircle,
  BellPlus,
  BellOff,
  TestTube2,
  Car,
  Mail,
  Phone,
  Trash2
} from "lucide-react";
import { AdminHelpBox } from "@/components/admin/AdminHelpBox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const NOTIFICATION_CATEGORIES = [
  { value: "all", label: "All Subscribers", description: "Send to everyone" },
  { value: "new_listings", label: "New Listings", description: "Interested in new inventory" },
  { value: "price_drops", label: "Price Drops", description: "Want to know about price reductions" },
  { value: "special_offers", label: "Special Offers", description: "Interested in deals & promotions" },
  { value: "hot_listings", label: "Hot Listings", description: "Want alerts on popular vehicles" },
];

type PushStats = {
  subscriberCount: number;
  categoryCounts?: Record<string, number>;
  notificationsSent: number;
  lastNotification: any | null;
};

type PushNotificationRecord = {
  id: string;
  title: string;
  body: string;
  url?: string;
  targetType: string;
  sentCount?: number;
  sentAt?: string;
  createdAt: string;
};

type PushSubscription = {
  id: string;
  endpoint: string;
  preferredMakes?: string[];
  notifyNewListings?: boolean;
  notifyPriceDrops?: boolean;
  notifySpecialOffers?: boolean;
  notifyHotListings?: boolean;
  userAgent?: string;
  createdAt: string;
};

type VehicleAlert = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  makes: string[] | null;
  models: string[] | null;
  minYear: number | null;
  maxYear: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  notifyEmail: boolean;
  notifySms: boolean;
  phoneVerified: boolean;
  active: boolean;
  createdAt: string;
};

export default function PushNotifications() {
  const [activeTab, setActiveTab] = useState("compose");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [targetCategory, setTargetCategory] = useState("all");
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { 
    isSupported, 
    isSubscribed, 
    isLoading: pushLoading, 
    permission,
    subscriptionEndpoint,
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  const handleSubscribe = async () => {
    setSubscribeError(null);
    const result = await subscribe({
      notifyNewListings: true,
      notifyPriceDrops: true,
      notifySpecialOffers: true,
      notifyHotListings: true,
    });
    
    if (result.success) {
      toast({
        title: "Subscribed!",
        description: "This browser is now receiving push notifications",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/push/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/push/subscriptions"] });
    } else {
      setSubscribeError(result.error || "Subscription failed");
      toast({
        title: "Subscription failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleUnsubscribe = async () => {
    const result = await unsubscribe();
    if (result.success) {
      toast({
        title: "Unsubscribed",
        description: "This browser will no longer receive notifications",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/push/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/push/subscriptions"] });
    }
  };

  const handleSendTest = async () => {
    if (!subscriptionEndpoint) {
      toast({
        title: "Not subscribed",
        description: "Subscribe this browser first to send a test.",
        variant: "destructive",
      });
      return;
    }
    
    setTestSending(true);
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscriptionEndpoint }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send test");
      }
      
      toast({
        title: "Test sent!",
        description: "Check for a notification on this device!",
      });
    } catch (error: any) {
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTestSending(false);
    }
  };

  const { data: stats } = useQuery<PushStats>({
    queryKey: ["/api/push/stats"],
    queryFn: async () => {
      const res = await fetch("/api/push/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: notifications = [] } = useQuery<PushNotificationRecord[]>({
    queryKey: ["/api/push/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/push/notifications");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: subscriptions = [] } = useQuery<PushSubscription[]>({
    queryKey: ["/api/push/subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/push/subscriptions");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: vehicleAlerts = [] } = useQuery<VehicleAlert[]>({
    queryKey: ["/api/vehicle-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/vehicle-alerts", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await fetch(`/api/vehicle-alerts/${alertId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-alerts"] });
      toast({
        title: "Alert deleted",
        description: "Vehicle alert subscription removed.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete",
        description: "Could not delete the alert.",
        variant: "destructive",
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { title: string; body: string; url?: string; targetCategory?: string }) => {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/push/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/push/notifications"] });
      toast({
        title: "Notification sent!",
        description: `Delivered to ${data.sent} subscriber${data.sent !== 1 ? 's' : ''}`,
      });
      setTitle("");
      setBody("");
      setUrl("");
      setTargetCategory("all");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const recipientCount = targetCategory === "all" 
    ? (stats?.subscriberCount || 0) 
    : (stats?.categoryCounts?.[targetCategory] || 0);

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      toast({
        title: "Missing fields",
        description: "Title and message are required",
        variant: "destructive",
      });
      return;
    }
    sendMutation.mutate({ title, body, url: url || undefined, targetCategory });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminHelpBox
          title="Push Notification Targeting"
          description="Send browser notifications to customers who've subscribed on your website. Target specific audiences based on their interests."
          icon={Bell}
          variant="info"
          defaultOpen={false}
          className="mb-2"
          tips={[
            "New Listings: People who want to know when you add vehicles",
            "Price Drops: Bargain hunters watching for deals",
            "Hot Listings: Shoppers interested in your most popular vehicles",
            "Special Offers: Customers who want promotions and incentives",
            "All Subscribers: Everyone who's opted in to notifications"
          ]}
        />

        <div>
          <h1 className="text-2xl font-bold font-serif">Push Notifications</h1>
          <p className="text-muted-foreground">Send instant alerts to subscribed customers</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{stats?.subscriberCount || 0}</p>
              <p className="text-sm text-muted-foreground">Subscribers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Send className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats?.notificationsSent || 0}</p>
              <p className="text-sm text-muted-foreground">Notifications Sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <History className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">
                {stats?.lastNotification 
                  ? format(new Date(stats.lastNotification.sentAt || stats.lastNotification.createdAt), "MMM d")
                  : "—"
                }
              </p>
              <p className="text-sm text-muted-foreground">Last Sent</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TestTube2 className="w-5 h-5" />
              Test Push Notifications
            </CardTitle>
            <CardDescription>Subscribe this browser to test notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSupported ? (
              <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Not Supported</p>
                  <p className="text-sm text-muted-foreground">This browser doesn't support push notifications</p>
                </div>
              </div>
            ) : permission === "denied" ? (
              <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
                <BellOff className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Notifications Blocked</p>
                  <p className="text-sm text-muted-foreground">Enable notifications in your browser settings for this site</p>
                </div>
              </div>
            ) : isSubscribed ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700">Subscribed</p>
                    <p className="text-sm text-muted-foreground">This browser is receiving push notifications</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSendTest}
                    disabled={testSending || !subscriptionEndpoint}
                    className="flex-1"
                    data-testid="button-send-test"
                  >
                    {testSending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Bell className="w-4 h-4 mr-2" />
                    )}
                    Send Test Notification
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleUnsubscribe}
                    disabled={pushLoading}
                    data-testid="button-unsubscribe"
                  >
                    <BellOff className="w-4 h-4 mr-2" />
                    Unsubscribe
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Subscribe this browser to test how notifications appear to your customers.
                </p>
                <Button 
                  onClick={handleSubscribe}
                  disabled={pushLoading}
                  className="w-full"
                  data-testid="button-subscribe-browser"
                >
                  {pushLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BellPlus className="w-4 h-4 mr-2" />
                  )}
                  Subscribe This Browser
                </Button>
                {subscribeError && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive text-sm">Subscription Failed</p>
                      <p className="text-xs text-muted-foreground">{subscribeError}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="compose" className="gap-1.5">
              <Bell className="w-4 h-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="gap-1.5">
              <Users className="w-4 h-4" />
              Push Subscribers
            </TabsTrigger>
            <TabsTrigger value="vehicle-alerts" className="gap-1.5">
              <Car className="w-4 h-4" />
              Vehicle Alerts ({vehicleAlerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Send Push Notification</CardTitle>
                <CardDescription>Target specific subscriber groups based on their preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Send To
                  </Label>
                  <Select value={targetCategory} onValueChange={setTargetCategory}>
                    <SelectTrigger data-testid="select-notification-category">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center justify-between gap-4">
                            <span>{cat.label}</span>
                            <Badge variant="secondary" className="text-xs">
                              {stats?.categoryCounts?.[cat.value] ?? stats?.subscriberCount ?? 0}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {NOTIFICATION_CATEGORIES.find(c => c.value === targetCategory)?.description}
                  </p>
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="New Arrival: 2024 Ferrari SF90"
                    maxLength={50}
                    data-testid="input-notification-title"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{title.length}/50 characters</p>
                </div>
                <div>
                  <Label htmlFor="body">Message</Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="A stunning new Ferrari has just arrived at our showroom. Click to view details!"
                    rows={3}
                    maxLength={200}
                    data-testid="input-notification-body"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{body.length}/200 characters</p>
                </div>
                <div>
                  <Label htmlFor="url">Link (optional)</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="/vehicle/2024-ferrari-sf90..."
                    data-testid="input-notification-url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Where to take users when they click</p>
                </div>
                <Button 
                  onClick={handleSend} 
                  disabled={sendMutation.isPending || !title.trim() || !body.trim() || recipientCount === 0}
                  className="w-full"
                  data-testid="button-send-notification"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send to {recipientCount} Subscriber{recipientCount !== 1 ? 's' : ''}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification History</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No notifications sent yet</p>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="flex items-start gap-4 p-4 border rounded-lg" data-testid={`notification-${notif.id}`}>
                        <div className="p-2 rounded-full bg-green-100">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{notif.title}</h4>
                          <p className="text-sm text-muted-foreground">{notif.body}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">{notif.sentCount || 0} delivered</Badge>
                            <span className="text-xs text-muted-foreground">
                              {notif.sentAt ? format(new Date(notif.sentAt), "MMM d, yyyy 'at' h:mm a") : "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscribers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscriber List</CardTitle>
                <CardDescription>{subscriptions.length} active subscribers</CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No subscribers yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Visitors can subscribe from the website</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {subscriptions.map((sub, i) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`subscriber-${sub.id}`}>
                        <div>
                          <p className="text-sm font-medium">Subscriber #{i + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {format(new Date(sub.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {sub.notifyNewListings && <Badge variant="outline" className="text-xs">New</Badge>}
                          {sub.notifyPriceDrops && <Badge variant="outline" className="text-xs">Drops</Badge>}
                          {sub.notifySpecialOffers && <Badge variant="outline" className="text-xs">Offers</Badge>}
                          {sub.notifyHotListings && <Badge variant="outline" className="text-xs">Hot</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicle-alerts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Alert Subscriptions</CardTitle>
                <CardDescription>
                  {vehicleAlerts.length} phone-verified alert subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vehicleAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No vehicle alerts yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Customers can subscribe via the "Get Vehicle Alerts" button on the website
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vehicleAlerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-4 border rounded-lg ${!alert.active ? 'opacity-50 bg-muted/30' : ''}`}
                        data-testid={`vehicle-alert-${alert.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{alert.name}</p>
                              {alert.phoneVerified && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              {!alert.active && (
                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {alert.email}
                              </span>
                              {alert.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {alert.phone}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {alert.makes && alert.makes.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  Makes: {alert.makes.join(", ")}
                                </Badge>
                              )}
                              {(alert.minPrice || alert.maxPrice) && (
                                <Badge variant="secondary" className="text-xs">
                                  ${alert.minPrice?.toLocaleString() || "0"} - ${alert.maxPrice?.toLocaleString() || "Any"}
                                </Badge>
                              )}
                              {(alert.minYear || alert.maxYear) && (
                                <Badge variant="secondary" className="text-xs">
                                  {alert.minYear || "Any"} - {alert.maxYear || "Any"}
                                </Badge>
                              )}
                              {alert.notifyEmail && (
                                <Badge variant="outline" className="text-xs">Email</Badge>
                              )}
                              {alert.notifySms && (
                                <Badge variant="outline" className="text-xs">SMS</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created {format(new Date(alert.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAlertMutation.mutate(alert.id)}
                            disabled={deleteAlertMutation.isPending}
                            className="text-destructive hover:text-destructive"
                            data-testid={`delete-alert-${alert.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
