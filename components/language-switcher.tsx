"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

const labels: Record<Locale, string> = {
  es: "ES",
  en: "EN",
  pt: "PT",
};

type LanguageSwitcherProps = {
  currentLocale: Locale;
};

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, maybeLocale, ...rest] = pathname.split("/");
  const pathWithoutLocale = routing.locales.includes(maybeLocale as Locale)
    ? rest.join("/")
    : [maybeLocale, ...rest].filter(Boolean).join("/");
  const query = searchParams.toString();

  return (
    <nav
      aria-label="Language"
      className="flex rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200"
    >
      {routing.locales.map((locale) => {
        const href = `/${locale}${pathWithoutLocale ? `/${pathWithoutLocale}` : ""}${query ? `?${query}` : ""}`;
        const isActive = locale === currentLocale;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-bold transition",
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")}
            href={href}
            key={locale}
          >
            {labels[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
