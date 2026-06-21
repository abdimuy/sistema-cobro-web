import { InfoHint } from "./InfoHint";

export function Titular({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p className="font-serif text-[13px] leading-snug text-foreground/80">
      {text}
    </p>
  );
}

export function Panel({
  title,
  titleHint,
  subtitle,
  children,
}: {
  title: string;
  titleHint?: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-md border border-border/60 px-5 py-5">
      <div>
        <h4 className="flex items-center gap-1 font-serif text-sm font-normal text-foreground">
          {title}
          {titleHint && <InfoHint text={titleHint} label={title} />}
        </h4>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  );
}
