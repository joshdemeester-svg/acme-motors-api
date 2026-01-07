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
import { 
  Bell, 
  Send, 
  Users, 
  History,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Filter
} from "lucide-react";
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

export default function PushNotifications() {
  const [activeTab, setActiveTab] = useState("compose");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [targetCategory, setTargetCategory] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
              Subscribers
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
        </Tabs>
      </div>
    </AdminLayout>
  );
}
