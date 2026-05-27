import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  subtextClassName?: string;
  icon: LucideIcon;
  progress?: number;
  trend?: string;
  accent?: "default" | "error";
}

export function StatCard({
  label,
  value,
  subtext,
  subtextClassName,
  icon: Icon,
  progress,
  trend,
  accent = "default",
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "border-border bg-card shadow-none",
        accent === "error" && "border-l-4 border-l-status-error"
      )}
    >
      <CardContent className="flex flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <Icon className="size-5 text-primary" />
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-[28px] font-bold",
                accent === "error" ? "text-status-error" : "text-text-main"
              )}
            >
              {value}
            </span>
            {trend && (
              <span className="text-xs font-bold text-status-success">{trend}</span>
            )}
          </div>
          {progress !== undefined && (
            <Progress value={progress} className="mt-2 h-1.5" />
          )}
          {subtext && (
            <p className={cn("mt-1 text-sm", subtextClassName)}>{subtext}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
