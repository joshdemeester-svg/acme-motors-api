import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Phone, Mail, MessageSquare, Clock, User, 
  ArrowRight, StickyNote, Activity, Loader2, Send,
  UserCheck
} from "lucide-react";
import type { BuyerInquiry, CreditApplication, LeadNote, ActivityLog, User as UserType } from "@shared/schema";

interface LeadDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadType: "inquiry" | "credit_application";
  lead: BuyerInquiry | CreditApplication | null;
}

const PIPELINE_STAGES = [
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { value: "qualified", label: "Qualified", color: "bg-green-500" },
  { value: "negotiating", label: "Negotiating", color: "bg-purple-500" },
  { value: "sold", label: "Sold", color: "bg-emerald-600" },
  { value: "lost", label: "Lost", color: "bg-red-500" },
];

export function LeadDetailDialog({ open, onOpenChange, leadType, lead }: LeadDetailDialogProps) {
  const [newNote, setNewNote] = useState("");
  const [activeTab, setActiveTab] = useState("timeline");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading: loadingNotes } = useQuery<LeadNote[]>({
    queryKey: [`/api/leads/${leadType}/${lead?.id}/notes`],
    enabled: !!lead?.id,
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadType}/${lead?.id}/notes`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: activities = [], isLoading: loadingActivities } = useQuery<ActivityLog[]>({
    queryKey: [`/api/leads/${leadType}/${lead?.id}/activity`],
    enabled: !!lead?.id,
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadType}/${lead?.id}/activity`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/leads/${leadType}/${lead?.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadType}/${lead?.id}/notes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadType}/${lead?.id}/activity`] });
      setNewNote("");
      toast({ title: "Note added" });
    },
    onError: () => {
      toast({ title: "Failed to add note", variant: "destructive" });
    },
  });

  const updatePipelineMutation = useMutation({
    mutationFn: async (pipelineStage: string) => {
      const endpoint = leadType === "inquiry" 
        ? `/api/inquiries/${lead?.id}/pipeline`
        : `/api/credit-applications/${lead?.id}/status`;
      const body = leadType === "inquiry" 
        ? { pipelineStage }
        : { status: pipelineStage };
      
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-applications"] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadType}/${lead?.id}/activity`] });
      toast({ title: "Pipeline stage updated" });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async (assignedTo: string | null) => {
      const endpoint = leadType === "inquiry" 
        ? `/api/inquiries/${lead?.id}/assignment`
        : `/api/credit-applications/${lead?.id}/assignment`;
      
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-applications"] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadType}/${lead?.id}/activity`] });
      toast({ title: "Assignment updated" });
    },
  });

  if (!lead) return null;

  const isInquiry = leadType === "inquiry";
  const inquiry = isInquiry ? (lead as BuyerInquiry) : null;
  const creditApp = !isInquiry ? (lead as CreditApplication) : null;
  
  const currentStage = isInquiry 
    ? (inquiry?.pipelineStage || inquiry?.status || "new")
    : (creditApp?.status || "new");
  
  const currentAssignment = isInquiry ? inquiry?.assignedTo : creditApp?.assignedTo;
  const assignedUser = users.find(u => u.id === currentAssignment);

  const contactName = isInquiry ? inquiry?.buyerName : `${creditApp?.firstName} ${creditApp?.lastName}`;
  const contactPhone = isInquiry ? inquiry?.buyerPhone : creditApp?.phone;
  const contactEmail = isInquiry ? inquiry?.buyerEmail : creditApp?.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {contactName}
          </DialogTitle>
          <DialogDescription>
            {isInquiry ? "View and manage buyer inquiry details" : "View and manage credit application details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <a href={`tel:${contactPhone}`} className="flex items-center gap-1 text-blue-500 hover:underline">
              <Phone className="h-4 w-4" />
              {contactPhone}
            </a>
            <a href={`mailto:${contactEmail}`} className="flex items-center gap-1 text-blue-500 hover:underline">
              <Mail className="h-4 w-4" />
              {contactEmail}
            </a>
            {lead.createdAt && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {format(new Date(lead.createdAt), "MMM d, yyyy h:mm a")}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Pipeline Stage</label>
              <Select
                value={currentStage}
                onValueChange={(value) => updatePipelineMutation.mutate(value)}
                disabled={updatePipelineMutation.isPending}
              >
                <SelectTrigger data-testid="select-pipeline-stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                        {stage.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Assigned To</label>
              <Select
                value={currentAssignment || "unassigned"}
                onValueChange={(value) => updateAssignmentMutation.mutate(value === "unassigned" ? null : value)}
                disabled={updateAssignmentMutation.isPending}
              >
                <SelectTrigger data-testid="select-assignment">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <span className="text-muted-foreground">Unassigned</span>
                  </SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        {user.username}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline" className="gap-2">
                <Activity className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <StickyNote className="h-4 w-4" />
                Notes ({notes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <ScrollArea className="h-[250px] pr-4">
                {loadingActivities ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3 text-sm">
                        <div className="flex-shrink-0">
                          {activity.activityType === "pipeline_change" && (
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <ArrowRight className="h-4 w-4 text-purple-600" />
                            </div>
                          )}
                          {activity.activityType === "note_added" && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <StickyNote className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          {activity.activityType === "assignment" && (
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <UserCheck className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.createdAt && format(new Date(activity.createdAt), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notes" className="mt-4 space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="resize-none"
                  rows={2}
                  data-testid="input-add-note"
                />
                <Button
                  size="icon"
                  onClick={() => newNote.trim() && addNoteMutation.mutate(newNote)}
                  disabled={!newNote.trim() || addNoteMutation.isPending}
                  data-testid="button-add-note"
                >
                  {addNoteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <ScrollArea className="h-[200px] pr-4">
                {loadingNotes ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notes yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 bg-muted rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {note.createdAt && format(new Date(note.createdAt), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
