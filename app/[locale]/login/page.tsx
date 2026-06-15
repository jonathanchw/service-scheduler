import Link from "next/link";

import { PageShell } from "@/components/page-shell";

import { signIn } from "./actions";

const errorMessages = {
  invalid: "Invalid email or password.",
  missing: "Enter your email and password.",
};

export default async function LoginPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}>) {
  const { locale } = await params;
  const { error } = await searchParams;
  const signInWithLocale = signIn.bind(null, locale);
  const errorMessage =
    error && error in errorMessages
      ? errorMessages[error as keyof typeof errorMessages]
      : null;

  return (
    <PageShell centered>
      <div className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <Link
          className="text-base font-black tracking-tight"
          href={`/${locale}`}
        >
          Service Scheduler
        </Link>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.22em] text-sky-700">
          Internal access
        </p>
        <h1 className="mt-4 text-4xl font-black leading-none tracking-tight">
          Login
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Sign in with your internal account to access the dashboard.
        </p>

        {errorMessage ? (
          <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <form action={signInWithLocale} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-800">Email</span>
            <input
              autoComplete="email"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              name="email"
              required
              type="email"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-800">Password</span>
            <input
              autoComplete="current-password"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              name="password"
              required
              type="password"
            />
          </label>

          <button
            className="mt-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
            type="submit"
          >
            Sign in
          </button>
        </form>
      </div>
    </PageShell>
  );
}
