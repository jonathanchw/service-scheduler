import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-8 text-slate-900">
      <section className="max-w-2xl">
        <p className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-600">
          {t("eyebrow")}
        </p>
        <h1 className="text-4xl font-bold leading-none sm:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          {t("description")}
        </p>
      </section>
    </main>
  );
}
