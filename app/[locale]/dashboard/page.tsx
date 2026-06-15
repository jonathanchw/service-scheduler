import { PageShell } from "@/components/page-shell";

import { signOut } from "../login/actions";

export default async function DashboardPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const signOutWithLocale = signOut.bind(null, locale);

  return (
    <PageShell>
      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-700">
          Dashboard
        </p>
        <h1 className="mt-4 text-4xl font-black leading-none tracking-tight">
          Internal dashboard
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Placeholder for the mobile-first internal home.
        </p>

        <form action={signOutWithLocale} className="mt-8">
          <button
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </div>
    </PageShell>
  );
}
