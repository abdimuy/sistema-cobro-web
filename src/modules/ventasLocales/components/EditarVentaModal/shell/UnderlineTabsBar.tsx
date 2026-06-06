import { TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const UnderlineTab = ({
  value,
  label,
  count,
}: {
  value: string;
  label: string;
  count?: number;
}) => (
  <TabsTrigger
    value={value}
    className={cn(
      "relative h-9 rounded-none border-0 bg-transparent px-3 text-xs font-medium text-muted-foreground shadow-none transition-colors",
      "data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none",
      "after:absolute after:inset-x-3 after:bottom-[-1px] after:h-[2px] after:bg-transparent",
      "data-[state=active]:after:bg-foreground",
    )}
  >
    {label}
    {count != null && (
      <span className="ml-1.5 font-mono text-[10px] text-muted-foreground/70">
        {count}
      </span>
    )}
  </TabsTrigger>
);
