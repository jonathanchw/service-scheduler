import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const INITIAL_ORGANIZATION_SLUG = "demo-service-company";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const agendaStatuses = ["pending", "confirmed", "reschedule_requested"];
const agendaViews = ["daily", "weekly", "monthly"] as const;

type AgendaView = (typeof agendaViews)[number];
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

function parseView(value?: string): AgendaView {
  if (value && agendaViews.includes(value as AgendaView)) {
    return value as AgendaView;
  }

  return "daily";
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);

  return value.toISOString().slice(0, 10);
}

function addMonths(date: string, months: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1 + months, day));

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

function getDateKey(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).format(new Date(value));
}

function getWeekRange(date: string) {
  const day = new Date(`${date}T12:00:00.000Z`).getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const start = addDays(date, -daysFromMonday);

  return { start, end: addDays(start, 6) };
}

function getMonthRange(date: string) {
  const start = `${date.slice(0, 7)}-01`;

  return { start, end: addDays(addMonths(start, 1), -1) };
}

function getDateRange(view: AgendaView, date: string) {
  if (view === "weekly") {
    return getWeekRange(date);
  }

  if (view === "monthly") {
    return getMonthRange(date);
  }

  return { start: date, end: date };
}

function getAdjacentDate(view: AgendaView, date: string, direction: -1 | 1) {
  if (view === "weekly") {
    return addDays(date, direction * 7);
  }

  if (view === "monthly") {
    return addMonths(date, direction);
  }

  return addDays(date, direction);
}

function getAgendaHref(locale: string, view: AgendaView, date: string) {
  return `/${locale}/dashboard/agenda?view=${view}&date=${date}`;
}

function sortAppointments(appointments: AgendaAppointment[]) {
  return [...appointments].sort((first, second) => {
    const firstTime = first.confirmed_start_at ?? first.requested_start_at;
    const secondTime = second.confirmed_start_at ?? second.requested_start_at;

    return firstTime.localeCompare(secondTime);
  });
}

function groupAppointmentsByDate(
  appointments: AgendaAppointment[],
  timezone: string,
) {
  const groups = new Map<string, AgendaAppointment[]>();

  for (const appointment of appointments) {
    const appointmentTime =
      appointment.confirmed_start_at ?? appointment.requested_start_at;
    const dateKey = getDateKey(appointmentTime, timezone);
    const dayAppointments = groups.get(dateKey) ?? [];

    dayAppointments.push(appointment);
    groups.set(dateKey, dayAppointments);
  }

  return [...groups.entries()]
    .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    .map(([date, dayAppointments]) => ({
      date,
      appointments: sortAppointments(dayAppointments),
    }));
}

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function formatShortDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function formatMonth(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function formatTime(value: string, locale: string, timezone: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}

function formatPeriodLabel(
  view: AgendaView,
  selectedDate: string,
  locale: string,
) {
  if (view === "weekly") {
    const { start, end } = getWeekRange(selectedDate);

    return `${formatShortDate(start, locale)} – ${formatShortDate(end, locale)}`;
  }

  if (view === "monthly") {
    return formatMonth(selectedDate, locale);
  }

  return formatDate(selectedDate, locale);
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
  startDate: string,
  endDate: string,
  timezone: string,
) {
  const supabase = createSupabaseAdminClient();
  const rangeStart = createZonedDateTime(startDate, "00:00", timezone);
  const rangeEnd = createZonedDateTime(addDays(endDate, 1), "00:00", timezone);

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
      `and(confirmed_start_at.gte.${rangeStart},confirmed_start_at.lt.${rangeEnd}),and(confirmed_start_at.is.null,requested_start_at.gte.${rangeStart},requested_start_at.lt.${rangeEnd})`,
    );

  if (error) {
    throw new Error("Could not load agenda appointments.");
  }

  return sortAppointments(data as unknown as AgendaAppointment[]);
}

export default async function AgendaPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string; view?: string }>;
}>) {
  const { locale } = await params;
  const { date: requestedDate, view: requestedView } = await searchParams;
  const organization = await getOrganization();
  const today = getTodayDate(organization.timezone);
  const selectedDate =
    requestedDate && DATE_PATTERN.test(requestedDate) ? requestedDate : today;
  const view = parseView(requestedView);
  const { start, end } = getDateRange(view, selectedDate);
  const appointments = await getAgendaAppointments(
    organization.id,
    start,
    end,
    organization.timezone,
  );
  const groupedAppointments = groupAppointmentsByDate(
    appointments,
    organization.timezone,
  );
  const t = await getTranslations({ locale, namespace: "DailyAgenda" });

  return (
    <section className="grid gap-6">
      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-700">
          {t("eyebrow")}
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-4xl font-black leading-none tracking-tight">
            {t("title")}
          </h1>
          <div className="flex flex-wrap gap-2">
            {agendaViews.map((agendaView) => (
              <Link
                className={[
                  "rounded-full border px-4 py-2 text-sm font-bold",
                  view === agendaView
                    ? "border-sky-700 bg-sky-50 text-sky-900"
                    : "border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50",
                ].join(" ")}
                href={getAgendaHref(locale, agendaView, selectedDate)}
                key={agendaView}
              >
                {t(`views.${agendaView}`)}
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          {t("description")}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-black text-slate-900">
            {formatPeriodLabel(view, selectedDate, locale)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-sky-300 hover:bg-sky-50"
              href={getAgendaHref(
                locale,
                view,
                getAdjacentDate(view, selectedDate, -1),
              )}
            >
              {t("previous")}
            </Link>
            <Link
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-sky-300 hover:bg-sky-50"
              href={getAgendaHref(locale, view, today)}
            >
              {t("today")}
            </Link>
            <Link
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-sky-300 hover:bg-sky-50"
              href={getAgendaHref(
                locale,
                view,
                getAdjacentDate(view, selectedDate, 1),
              )}
            >
              {t("next")}
            </Link>
          </div>
        </div>
      </div>

      {appointments.length > 0 ? (
        view === "daily" ? (
          <div className="grid gap-4">
            {appointments.map((appointment) => {
              const appointmentTime =
                appointment.confirmed_start_at ??
                appointment.requested_start_at;
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
                      <dt className="font-bold text-slate-500">
                        {t("address")}
                      </dt>
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
          <div className="grid gap-4">
            {groupedAppointments.map(
              ({ date, appointments: dayAppointments }) => (
                <section
                  className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"
                  key={date}
                >
                  <h2 className="text-lg font-black text-slate-950">
                    {formatDate(date, locale)}
                  </h2>
                  <div className="mt-4 grid gap-3">
                    {dayAppointments.map((appointment) => {
                      const appointmentTime =
                        appointment.confirmed_start_at ??
                        appointment.requested_start_at;

                      return (
                        <div
                          className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                          key={appointment.id}
                        >
                          <div>
                            <p className="text-sm font-black text-slate-950">
                              {formatTime(
                                appointmentTime,
                                locale,
                                organization.timezone,
                              )}{" "}
                              · {appointment.clients.name}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {appointment.services.name}
                            </p>
                          </div>
                          <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-sky-800 ring-1 ring-sky-100">
                            {t(`statuses.${appointment.status}`)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ),
            )}
          </div>
        )
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
