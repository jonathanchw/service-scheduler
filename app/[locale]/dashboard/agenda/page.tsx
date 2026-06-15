import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getAgendaPageData } from "@/lib/agenda/queries";
import { agendaViews } from "@/lib/agenda/types";
import {
  formatDate,
  formatPeriodLabel,
  formatTime,
  getAdjacentDate,
  getAgendaHref,
} from "@/lib/agenda/utils";

export default async function AgendaPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string; view?: string }>;
}>) {
  const { locale } = await params;
  const {
    organization,
    today,
    selectedDate,
    view,
    appointments,
    groupedAppointments,
  } = await getAgendaPageData(await searchParams);
  const t = await getTranslations({ locale, namespace: "DailyAgenda" });

  return (
    <section className="grid gap-6">
      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-700">
          {t("eyebrow")}
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-4xl font-black leading-none tracking-tight">
            {t(`titles.${view}`)}
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
