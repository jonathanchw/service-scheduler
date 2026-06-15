import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const INITIAL_ORGANIZATION_SLUG = "demo-service-company";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const agendaStatuses = ["pending", "confirmed", "reschedule_requested"];

type AgendaAppointment = {
  id: string;
  status: string;
  requested_start_at: string;
  confirmed_start_at: string | null;
  address: string;
  city: string;
  clients: {
    name: string;
  };
  services: {
    name: string;
  };
  appointment_technicians: {
    technicians: {
      name: string;
    };
  }[];
};

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);

  return value.toISOString().slice(0, 10);
}

function getTimezoneOffset(date: Date, timezone: string) {
  const timezoneDate = new Date(
    date.toLocaleString("en-US", { timeZone: timezone }),
  );

  return timezoneDate.getTime() - date.getTime();
}

function createZonedDateTime(date: string, time: string, timezone: string) {
  const utcGuess = new Date(`${date}T${time}:00.000Z`);
  const timezoneOffset = getTimezoneOffset(utcGuess, timezone);

  return new Date(utcGuess.getTime() - timezoneOffset).toISOString();
}

function getTodayDate(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function formatTime(value: string, locale: string, timezone: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}

async function getOrganization() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, timezone")
    .eq("slug", INITIAL_ORGANIZATION_SLUG)
    .single();

  if (error || !data) {
    throw new Error("Organization not found.");
  }

  return {
    id: data.id as string,
    timezone: data.timezone as string,
  };
}

async function getAgendaAppointments(
  organizationId: string,
  date: string,
  timezone: string,
) {
  const supabase = createSupabaseAdminClient();
  const dayStart = createZonedDateTime(date, "00:00", timezone);
  const dayEnd = createZonedDateTime(addDays(date, 1), "00:00", timezone);

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
        id,
        status,
        requested_start_at,
        confirmed_start_at,
        address,
        city,
        clients (name),
        services (name),
        appointment_technicians (
          technicians (name)
        )
      `,
    )
    .eq("organization_id", organizationId)
    .in("status", agendaStatuses)
    .or(
      `and(confirmed_start_at.gte.${dayStart},confirmed_start_at.lt.${dayEnd}),and(confirmed_start_at.is.null,requested_start_at.gte.${dayStart},requested_start_at.lt.${dayEnd})`,
    );

  if (error) {
    throw new Error("Could not load agenda appointments.");
  }

  return (data as unknown as AgendaAppointment[]).sort((first, second) => {
    const firstTime = first.confirmed_start_at ?? first.requested_start_at;
    const secondTime = second.confirmed_start_at ?? second.requested_start_at;

    return firstTime.localeCompare(secondTime);
  });
}

export default async function AgendaPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string }>;
}>) {
  const { locale } = await params;
  const { date: requestedDate } = await searchParams;
  const organization = await getOrganization();
  const today = getTodayDate(organization.timezone);
  const selectedDate =
    requestedDate && DATE_PATTERN.test(requestedDate) ? requestedDate : today;
  const appointments = await getAgendaAppointments(
    organization.id,
    selectedDate,
    organization.timezone,
  );
  const t = await getTranslations({ locale, namespace: "DailyAgenda" });

  return (
    <section className="grid gap-6">
      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-700">
          {t("eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-black leading-none tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          {t("description")}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-black text-slate-900">
            {formatDate(selectedDate, locale)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-sky-300 hover:bg-sky-50"
              href={`/${locale}/dashboard/agenda?date=${addDays(selectedDate, -1)}`}
            >
              {t("previous")}
            </Link>
            <Link
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-sky-300 hover:bg-sky-50"
              href={`/${locale}/dashboard/agenda?date=${today}`}
            >
              {t("today")}
            </Link>
            <Link
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-sky-300 hover:bg-sky-50"
              href={`/${locale}/dashboard/agenda?date=${addDays(selectedDate, 1)}`}
            >
              {t("next")}
            </Link>
          </div>
        </div>
      </div>

      {appointments.length > 0 ? (
        <div className="grid gap-4">
          {appointments.map((appointment) => {
            const appointmentTime =
              appointment.confirmed_start_at ?? appointment.requested_start_at;
            const technicians = appointment.appointment_technicians
              .map((assignment) => assignment.technicians.name)
              .join(", ");

            return (
              <article
                className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"
                key={appointment.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-2xl font-black text-slate-950">
                      {formatTime(
                        appointmentTime,
                        locale,
                        organization.timezone,
                      )}
                    </p>
                    <h2 className="mt-3 text-xl font-black text-slate-950">
                      {appointment.clients.name}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {appointment.services.name}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-sky-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-sky-800">
                    {t(`statuses.${appointment.status}`)}
                  </span>
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-bold text-slate-500">{t("address")}</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {appointment.address}, {appointment.city}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-500">
                      {t("technicians")}
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {technicians || t("unassigned")}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[2rem] bg-white p-5 text-center shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">
            {t("emptyTitle")}
          </h2>
          <p className="mt-3 text-slate-600">{t("emptyDescription")}</p>
        </div>
      )}
    </section>
  );
}
