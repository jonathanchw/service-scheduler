import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/language-switcher";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

export default async function BookingConfirmationPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const currentLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: "Book" });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link
          className="text-base font-black tracking-tight sm:text-lg"
          href={`/${currentLocale}`}
        >
          {t("brand")}
        </Link>
        <LanguageSwitcher currentLocale={currentLocale} />
      </header>

      <section className="mx-auto w-full max-w-4xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-700">
            {t("confirmation.eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl font-black leading-none tracking-tight text-slate-950 sm:text-5xl">
            {t("confirmation.title")}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            {t("confirmation.description")}
          </p>
          <Link
            className="mt-6 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
            href={`/${currentLocale}`}
          >
            {t("confirmation.cta")}
          </Link>
        </div>
      </section>
    </main>
  );
}
