import { Badge } from "@/components/ui/badge";
import { Braces, FileWarning } from "lucide-react";

// IntentKindBadge tells the operator at a glance whether the intent
// carries an editable JSON body or a multipart blob (no replay-with).
export function IntentKindBadge({ hasBlob }: { hasBlob: boolean }) {
  if (hasBlob) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300 dark:bg-violet-500/15 font-medium text-[11px]"
      >
        <FileWarning className="h-3 w-3" />
        Multipart
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 dark:bg-sky-500/15 font-medium text-[11px]"
    >
      <Braces className="h-3 w-3" />
      JSON
    </Badge>
  );
}
