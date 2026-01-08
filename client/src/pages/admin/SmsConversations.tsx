import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  MessageSquare, 
  Send, 
  Search,
  User,
  Clock,
  Loader2,
  Pencil,
  History
} from "lucide-react";
import { format } from "date-fns";

function parseMessageBody(body: string): string {
  if (!body) return "";
  
  if (body.startsWith("{") && body.includes('"body"')) {
    try {
      const parsed = JSON.parse(body);
      if (parsed.body && typeof parsed.body === "string") {
        return parsed.body;
      }
    } catch (e) {
    }
  }
  return body;
}

type SmsMessage = {
  id: string;
  leadId: string;
  direction: "inbound" | "outbound";
  body: string;
  status: string;
  createdAt: string;
};

type LeadWithMessages = {
  id: string;
  name: string;
  phone: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: SmsMessage[];
};

type SmsContact = {
  phone: string;
  displayName: string | null;
  lastViewedAt: string | null;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
};

export default function SmsConversations() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");

  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading } = useQuery<LeadWithMessages[]>({
    queryKey: ["/api/sms/conversations"],
    queryFn: async () => {
      const res = await fetch("/api/sms/conversations");
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Failed to fetch conversations");
      }
      return res.json();
    },
  });

  const { data: recentContacts } = useQuery<SmsContact[]>({
    queryKey: ["/api/sms/recent"],
    queryFn: async () => {
      const res = await fetch("/api/sms/recent?limit=5");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: contactOverrides } = useQuery<Record<string, string>>({
    queryKey: ["/api/sms/contacts/all"],
    queryFn: async () => {
      if (!conversations) return {};
      const phones = conversations.map(c => c.phone);
      const overrides: Record<string, string> = {};
      for (const phone of phones) {
        try {
          const res = await fetch(`/api/sms/contacts/${phone}`);
          if (res.ok) {
            const contact = await res.json();
            if (contact.displayName) {
              overrides[phone] = contact.displayName;
            }
          }
        } catch (e) {}
      }
      return overrides;
    },
    enabled: !!conversations && conversations.length > 0,
  });

  const selectedConversation = conversations?.find(c => c.id === selectedLeadId);

  const getDisplayName = (conv: LeadWithMessages) => {
    if (contactOverrides?.[conv.phone]) {
      return contactOverrides[conv.phone];
    }
    return conv.name;
  };

  const filteredConversations = conversations?.filter(c => {
    const displayName = getDisplayName(c);
    return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
  }) || [];

  const sendMutation = useMutation({
    mutationFn: async ({ phone, body, inquiryId }: { phone: string; body: string; inquiryId?: string }) => {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, body, inquiryId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms/conversations"] });
      setReplyText("");
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: async ({ phone, displayName }: { phone: string; displayName: string }) => {
      const res = await fetch(`/api/sms/contacts/${phone}/name`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) throw new Error("Failed to update name");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms/contacts/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sms/recent"] });
      setEditNameDialogOpen(false);
      setEditingPhone(null);
      setEditNameValue("");
    },
  });

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;
    sendMutation.mutate({
      phone: selectedConversation.phone,
      body: replyText,
      inquiryId: selectedConversation.id !== selectedConversation.phone ? selectedConversation.id : undefined,
    });
  };

  const handleEditName = (phone: string, currentName: string) => {
    setEditingPhone(phone);
    setEditNameValue(currentName === "Unknown" ? "" : currentName);
    setEditNameDialogOpen(true);
  };

  const handleSaveName = () => {
    if (!editingPhone || !editNameValue.trim()) return;
    updateNameMutation.mutate({ phone: editingPhone, displayName: editNameValue.trim() });
  };

  // Mark contact as viewed and messages as read when selecting a conversation
  const handleSelectConversation = async (conv: LeadWithMessages) => {
    setSelectedLeadId(conv.id);
    
    // Track view for recently viewed and refresh the recent contacts list
    fetch(`/api/sms/contacts/${conv.phone}/view`, { method: "POST" })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/sms/recent"] });
      })
      .catch(() => {});
  };

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (selectedConversation && selectedConversation.unreadCount > 0) {
      fetch("/api/sms/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: selectedConversation.phone }),
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/sms/conversations"] });
      });
    }
  }, [selectedLeadId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedConversation?.messages]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-serif">SMS Conversations</h1>
          <p className="text-muted-foreground">Two-way messaging with leads and customers</p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : !conversations || conversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No SMS Conversations Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                When leads reply to your SMS messages, their conversations will appear here. 
                Make sure GoHighLevel webhooks are configured to receive incoming messages.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
            <Card className="md:col-span-1">
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-sms"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Recently Viewed Section */}
                {recentContacts && recentContacts.length > 0 && !searchQuery && (
                  <div className="px-4 py-2 border-b bg-muted/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <History className="h-3 w-3" />
                      <span>Recently Viewed</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {recentContacts.slice(0, 3).map((contact) => {
                        const conv = conversations?.find(c => c.phone === contact.phone);
                        if (!conv) return null;
                        return (
                          <button
                            key={contact.phone}
                            onClick={() => handleSelectConversation(conv)}
                            className="text-xs px-2 py-1 rounded-full bg-background border hover:bg-muted transition-colors truncate max-w-[100px]"
                          >
                            {contact.displayName || getDisplayName(conv)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <ScrollArea className="h-[calc(100vh-400px)]">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-4 text-left border-b hover:bg-muted/50 transition-colors ${
                        selectedLeadId === conv.id ? "bg-muted" : ""
                      }`}
                      data-testid={`conversation-${conv.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{getDisplayName(conv)}</p>
                            <p className="text-sm text-muted-foreground truncate">{conv.phone}</p>
                          </div>
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-primary">{conv.unreadCount}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(conv.lastMessageAt), "MMM d, h:mm a")}</span>
                      </div>
                    </button>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{getDisplayName(selectedConversation)}</CardTitle>
                          <p className="text-sm text-muted-foreground">{selectedConversation.phone}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditName(selectedConversation.phone, getDisplayName(selectedConversation))}
                        data-testid="button-edit-contact-name"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        {getDisplayName(selectedConversation) === "Unknown" ? "Add Name" : "Edit Name"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[calc(100vh-440px)] p-4">
                      <div className="space-y-4">
                        {selectedConversation.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                msg.direction === "outbound"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{parseMessageBody(msg.body)}</p>
                              <p className={`text-xs mt-1 ${
                                msg.direction === "outbound" ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}>
                                {format(new Date(msg.createdAt), "h:mm a")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                        data-testid="input-sms-reply"
                      />
                      <Button 
                        onClick={handleSendReply} 
                        disabled={!replyText.trim() || sendMutation.isPending} 
                        data-testid="button-send-sms"
                      >
                        {sendMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to view messages</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={editNameDialogOpen} onOpenChange={setEditNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact Name</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="contactName">Display Name</Label>
            <Input
              id="contactName"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              placeholder="Enter contact name..."
              className="mt-2"
              data-testid="input-contact-name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNameDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveName} 
              disabled={!editNameValue.trim() || updateNameMutation.isPending}
              data-testid="button-save-contact-name"
            >
              {updateNameMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
