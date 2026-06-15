import {
  addDays,
  addMonths,
  getDateKey,
  getMonthRange,
  getWeekRange,
} from "@/lib/datetime";

import { agendaViews, type AgendaAppointment, type AgendaView } from "./types";

export function parseView(value?: string): AgendaView {
  if (value && agendaViews.includes(value as AgendaView)) {
    return value as AgendaView;
  }

  return "daily";
}

export function getDateRange(view: AgendaView, date: string) {
  if (view === "weekly") {
    return getWeekRange(date);
  }

  if (view === "monthly") {
    return getMonthRange(date);
  }

  return { start: date, end: date };
}

export function getAdjacentDate(
  view: AgendaView,
  date: string,
  direction: -1 | 1,
) {
  if (view === "weekly") {
    return addDays(date, direction * 7);
  }

  if (view === "monthly") {
    return addMonths(date, direction);
  }

  return addDays(date, direction);
}

export function getAgendaHref(locale: string, view: AgendaView, date: string) {
  return `/${locale}/dashboard/agenda?view=${view}&date=${date}`;
}

export function sortAppointments(appointments: AgendaAppointment[]) {
  return [...appointments].sort((first, second) => {
    const firstTime = first.confirmed_start_at ?? first.requested_start_at;
    const secondTime = second.confirmed_start_at ?? second.requested_start_at;

    return firstTime.localeCompare(secondTime);
  });
}

export function groupAppointmentsByDate(
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

export function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

export function formatShortDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

export function formatMonth(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

export function formatTime(value: string, locale: string, timezone: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}

export function formatPeriodLabel(
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
