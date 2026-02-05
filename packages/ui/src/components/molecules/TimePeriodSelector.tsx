import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@money-insight/ui/components/atoms";
import {
  type TimePeriodMode,
  TIME_PERIOD_OPTIONS,
} from "@money-insight/ui/lib";

export interface TimePeriodSelectorProps {
  value: TimePeriodMode;
  onChange: (value: TimePeriodMode) => void;
  className?: string;
}

export function TimePeriodSelector({
  value,
  onChange,
  className,
}: TimePeriodSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-[140px]"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TIME_PERIOD_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
