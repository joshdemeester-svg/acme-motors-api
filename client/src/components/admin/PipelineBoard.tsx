import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, User, Car, Calendar, GripVertical } from "lucide-react";
import type { BuyerInquiry } from "@shared/schema";

const PIPELINE_STAGES = [
  { id: "new", label: "New", color: "bg-blue-500" },
  { id: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { id: "qualified", label: "Qualified", color: "bg-purple-500" },
  { id: "negotiating", label: "Negotiating", color: "bg-orange-500" },
  { id: "sold", label: "Sold", color: "bg-green-500" },
  { id: "lost", label: "Lost", color: "bg-gray-500" },
];

interface PipelineBoardProps {
  inquiries: BuyerInquiry[];
  onStageChange: (id: string, stage: string) => void;
  onViewDetails: (inquiry: BuyerInquiry) => void;
  isLoading?: boolean;
}

interface LeadCardProps {
  inquiry: BuyerInquiry;
  onViewDetails: (inquiry: BuyerInquiry) => void;
  isActiveItem?: boolean;
}

function LeadCard({ inquiry, onViewDetails, isActiveItem }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: inquiry.id,
    data: {
      type: 'card',
      inquiry,
      stage: inquiry.pipelineStage || 'new',
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Hide the original card when it's being dragged (overlay shows instead)
  if (isActiveItem) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-card/30 border border-dashed rounded-lg p-3 h-[120px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? "opacity-50" : ""
      }`}
      data-testid={`pipeline-card-${inquiry.id}`}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm truncate">
              {inquiry.buyerName}
            </span>
          </div>
          
          {inquiry.inventoryCarId && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Car className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Vehicle #{inquiry.inventoryCarId}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>
              {inquiry.createdAt
                ? new Date(inquiry.createdAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>

          {inquiry.assignedTo && (
            <Badge variant="outline" className="text-xs mb-2">
              {inquiry.assignedTo}
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(inquiry);
            }}
            data-testid={`pipeline-view-${inquiry.id}`}
          >
            <Eye className="h-3 w-3 mr-1" />
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}

function DragOverlayCard({ inquiry }: { inquiry: BuyerInquiry }) {
  return (
    <div className="bg-card border rounded-lg p-3 shadow-xl cursor-grabbing w-[260px]">
      <div className="flex items-center gap-2 mb-1">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <User className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium text-sm">
          {inquiry.buyerName}
        </span>
      </div>
      {inquiry.inventoryCarId && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
          <Car className="h-3 w-3" />
          <span>Vehicle #{inquiry.inventoryCarId}</span>
        </div>
      )}
    </div>
  );
}

interface StageColumnProps {
  stage: typeof PIPELINE_STAGES[number];
  inquiries: BuyerInquiry[];
  onViewDetails: (inquiry: BuyerInquiry) => void;
  activeId: string | null;
}

function StageColumn({ stage, inquiries, onViewDetails, activeId }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${stage.id}`,
    data: {
      type: 'column',
      stageId: stage.id,
    }
  });

  const inquiryIds = inquiries.map((i) => i.id);

  return (
    <div
      className="flex flex-col min-w-[280px] max-w-[320px] flex-shrink-0"
      data-testid={`pipeline-column-${stage.id}`}
    >
      <Card className={`h-full flex flex-col transition-all duration-200 ${isOver ? "ring-2 ring-primary" : ""}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${stage.color}`} />
              {stage.label}
            </div>
            <Badge variant="secondary" className="text-xs">
              {inquiries.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-2 pt-0" ref={setNodeRef}>
          <ScrollArea className="h-[calc(100vh-320px)]">
            <SortableContext
              items={inquiryIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 pr-2 min-h-[100px]">
                {inquiries.length === 0 ? (
                  <div className={`text-center text-muted-foreground text-sm py-8 border-2 border-dashed rounded-lg transition-colors ${isOver ? "border-primary bg-primary/5" : ""}`}>
                    Drop leads here
                  </div>
                ) : (
                  inquiries.map((inquiry) => (
                    <LeadCard
                      key={inquiry.id}
                      inquiry={inquiry}
                      onViewDetails={onViewDetails}
                      isActiveItem={activeId === inquiry.id}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export function PipelineBoard({
  inquiries,
  onStageChange,
  onViewDetails,
  isLoading,
}: PipelineBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const inquiriesByStage = useMemo(() => {
    const grouped: Record<string, BuyerInquiry[]> = {};
    PIPELINE_STAGES.forEach((stage) => {
      grouped[stage.id] = [];
    });
    inquiries.forEach((inquiry) => {
      const stage = inquiry.pipelineStage || "new";
      if (grouped[stage]) {
        grouped[stage].push(inquiry);
      } else {
        grouped["new"].push(inquiry);
      }
    });
    return grouped;
  }, [inquiries]);

  const activeInquiry = useMemo(() => {
    if (!activeId) return null;
    return inquiries.find((i) => i.id === activeId) || null;
  }, [activeId, inquiries]);

  // Find which stage an inquiry belongs to
  function findStageForInquiry(inquiryId: string): string | null {
    const inquiry = inquiries.find((i) => i.id === inquiryId);
    return inquiry?.pipelineStage || "new";
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Get stage from column droppable
    if (overId.startsWith('column-')) {
      const targetStageId = overId.replace('column-', '');
      const currentStage = findStageForInquiry(activeId);
      
      if (currentStage !== targetStageId) {
        // Trigger stage change during drag over for visual feedback
        // The actual API call happens on drag end
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeInquiryId = active.id as string;
    const overId = over.id as string;
    
    // Determine target stage
    let targetStageId: string | null = null;

    // Dropped on a column
    if (overId.startsWith('column-')) {
      targetStageId = overId.replace('column-', '');
    } 
    // Dropped on another card - find that card's stage
    else {
      const overInquiry = inquiries.find((i) => i.id === overId);
      if (overInquiry) {
        targetStageId = overInquiry.pipelineStage || "new";
      }
    }

    if (targetStageId) {
      const currentStage = findStageForInquiry(activeInquiryId);
      if (currentStage !== targetStageId) {
        onStageChange(activeInquiryId, targetStageId);
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => (
          <div
            key={stage.id}
            className="min-w-[280px] max-w-[320px] flex-shrink-0"
          >
            <Card className="h-[400px] animate-pulse bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4" data-testid="pipeline-board">
        {PIPELINE_STAGES.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            inquiries={inquiriesByStage[stage.id]}
            onViewDetails={onViewDetails}
            activeId={activeId}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeInquiry ? <DragOverlayCard inquiry={activeInquiry} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
