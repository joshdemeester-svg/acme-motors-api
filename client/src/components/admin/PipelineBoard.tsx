import { useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
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
  index: number;
}

function LeadCard({ inquiry, onViewDetails, index }: LeadCardProps) {
  return (
    <Draggable draggableId={inquiry.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow mb-2 ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
          }`}
          data-testid={`pipeline-card-${inquiry.id}`}
        >
          <div className="flex items-start gap-2">
            <div
              {...provided.dragHandleProps}
              className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
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
      )}
    </Draggable>
  );
}

interface StageColumnProps {
  stage: typeof PIPELINE_STAGES[number];
  inquiries: BuyerInquiry[];
  onViewDetails: (inquiry: BuyerInquiry) => void;
}

function StageColumn({ stage, inquiries, onViewDetails }: StageColumnProps) {
  return (
    <div
      className="flex flex-col min-w-[280px] max-w-[320px] flex-shrink-0"
      data-testid={`pipeline-column-${stage.id}`}
    >
      <Card className="h-full flex flex-col">
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
        <CardContent className="flex-1 p-2 pt-0">
          <Droppable droppableId={stage.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-[100px] h-full rounded-lg transition-colors ${
                  snapshot.isDraggingOver ? "bg-primary/10 ring-2 ring-primary ring-dashed" : ""
                }`}
              >
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="pr-2">
                    {inquiries.length === 0 && !snapshot.isDraggingOver ? (
                      <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed rounded-lg">
                        Drop leads here
                      </div>
                    ) : (
                      inquiries.map((inquiry, index) => (
                        <LeadCard
                          key={inquiry.id}
                          inquiry={inquiry}
                          onViewDetails={onViewDetails}
                          index={index}
                        />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                </ScrollArea>
              </div>
            )}
          </Droppable>
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

  function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;

    // Dropped outside a valid droppable
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // If moved to a different column, update the stage
    if (destination.droppableId !== source.droppableId) {
      onStageChange(draggableId, destination.droppableId);
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
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4" data-testid="pipeline-board">
        {PIPELINE_STAGES.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            inquiries={inquiriesByStage[stage.id]}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
