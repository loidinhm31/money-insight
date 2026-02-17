import { ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@money-insight/ui/components/atoms";
import { cn } from "@money-insight/ui/lib";

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  valueColor?: string;
  className?: string;
  icon?: ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  valueColor,
  className,
  icon,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-secondary-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        <div
          className={cn(
            "text-lg sm:text-2xl font-bold font-heading",
            valueColor ? "" : "text-foreground",
          )}
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </div>
        {subtitle && (
          <p
            className={cn(
              "text-[10px] sm:text-xs hidden sm:block text-muted-foreground",
            )}
          >
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
