import { cn } from "@/lib/utils";

type ColorSwatchProps = {
  name: string;
  value: string;
  className?: string;
};

export const ColorSwatchItem = ({ name, value, className }: ColorSwatchProps) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        style={{ backgroundColor: value }}
        className="w-12 h-12 rounded-lg border border-border/20 flex-shrink-0"
      />
      <div>
        <h4 className="text-sm font-mono">{name}</h4>
        <p className="font-mono text-xs uppercase text-muted-foreground">
          {value}
        </p>
      </div>
    </div>
  );
};