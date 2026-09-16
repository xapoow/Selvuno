interface SectionProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function Section({ title, action, children }: SectionProps) {
  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase text-muted">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
