import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IntentStatusValue } from "../domain/values";

// StatusFilter is the row of tabs above the table. The dueño defaults
// to "Nuevos" — the work queue — and can switch to the other buckets
// to audit completed work or recover ignored ones.
const TABS: Array<{ key: IntentStatusValue | "all"; label: string }> = [
  { key: "new", label: "Nuevos" },
  { key: "retried_fail", label: "Reintento falló" },
  { key: "retried_ok", label: "Reintento OK" },
  { key: "resolved_manual", label: "Resueltos" },
  { key: "ignored", label: "Ignorados" },
  { key: "all", label: "Todos" },
];

export type StatusFilterValue = IntentStatusValue | "all";

export function StatusFilter({
  value,
  onChange,
}: {
  value: StatusFilterValue;
  onChange: (next: StatusFilterValue) => void;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as StatusFilterValue)}
    >
      <TabsList className="bg-transparent p-0 gap-1 h-auto">
        {TABS.map((t) => (
          <TabsTrigger
            key={t.key}
            value={t.key}
            className="text-xs data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-50 dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900 rounded-full px-3 py-1"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
