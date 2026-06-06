interface Props {
  section: string;
}

export const WIPPlaceholder = ({ section }: Props) => (
  <div className="flex min-h-[320px] items-center justify-center">
    <div className="text-center">
      <p className="font-serif text-lg text-muted-foreground">{section}</p>
      <p className="mt-2 text-[11px] text-muted-foreground/70">
        Esta sección se implementa en la siguiente entrega.
      </p>
    </div>
  </div>
);
