type RoutePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function RoutePlaceholder({
  eyebrow,
  title,
  description,
}: RoutePlaceholderProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <section className="mx-auto max-w-3xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-600">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          {description}
        </p>
      </section>
    </main>
  );
}
