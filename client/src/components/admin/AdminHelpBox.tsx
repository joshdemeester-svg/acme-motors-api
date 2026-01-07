import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, ExternalLink, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HelpStep {
  title: string;
  description?: string;
}

interface HelpLink {
  label: string;
  url: string;
  external?: boolean;
}

interface AdminHelpBoxProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  steps?: HelpStep[];
  links?: HelpLink[];
  tips?: string[];
  variant?: "info" | "tip" | "warning";
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
}

export function AdminHelpBox({
  title,
  description,
  icon: Icon = HelpCircle,
  steps,
  tips,
  links,
  variant = "info",
  defaultOpen = true,
  collapsible = true,
  className,
}: AdminHelpBoxProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variantStyles = {
    info: "bg-blue-900/50 border-blue-700 text-blue-100",
    tip: "bg-amber-900/50 border-amber-700 text-amber-100",
    warning: "bg-red-900/50 border-red-700 text-red-100",
  };

  const iconStyles = {
    info: "text-blue-300",
    tip: "text-amber-300",
    warning: "text-red-300",
  };

  const textStyles = {
    info: "text-blue-200",
    tip: "text-amber-200",
    warning: "text-red-200",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconStyles[variant])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{title}</h4>
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {(isOpen || !collapsible) && (
            <div className="mt-2 space-y-3">
              <p className={cn("text-sm", textStyles[variant])}>{description}</p>

              {steps && steps.length > 0 && (
                <ol className="space-y-2 text-sm">
                  {steps.map((step, index) => (
                    <li key={index} className="flex gap-2">
                      <span className={cn("flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center", 
                        variant === "info" ? "bg-blue-700 text-blue-100" :
                        variant === "tip" ? "bg-amber-700 text-amber-100" :
                        "bg-red-700 text-red-100"
                      )}>
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-medium">{step.title}</span>
                        {step.description && (
                          <p className={cn("mt-0.5", textStyles[variant])}>{step.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {tips && tips.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {tips.map((tip, index) => (
                    <li key={index} className="flex gap-2">
                      <span className={iconStyles[variant]}>•</span>
                      <span className={textStyles[variant]}>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}

              {links && links.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className={cn("inline-flex items-center gap-1 text-xs font-medium hover:underline", iconStyles[variant])}
                    >
                      {link.label}
                      {link.external && <ExternalLink className="h-3 w-3" />}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EmptyStateWithTipProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  tips?: string[];
}

export function EmptyStateWithTip({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  tips,
}: EmptyStateWithTipProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-4">{description}</p>
      
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <a href={actionHref}>
            <Button>{actionLabel}</Button>
          </a>
        ) : (
          <Button onClick={onAction}>{actionLabel}</Button>
        )
      )}

      {tips && tips.length > 0 && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg max-w-md">
          <p className="text-xs font-medium mb-2 text-muted-foreground">Quick Tips:</p>
          <ul className="text-xs text-muted-foreground space-y-1 text-left">
            {tips.map((tip, index) => (
              <li key={index}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
