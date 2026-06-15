import { addDays, createZonedDateTime, getTodayDate } from "@/lib/datetime";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  agendaStatuses,
  type AgendaAppointment,
  type AgendaView,
} from "./types";
import {
  getDateRange,
  groupAppointmentsByDate,
  parseView,
  resolveSelectedDate,
  sortAppointments,
} from "./utils";

export type AgendaPageData = {
  organization: {
    id: string;
    timezone: string;
  };
  today: string;
  selectedDate: string;
  view: AgendaView;
  appointments: AgendaAppointment[];
  groupedAppointments: {
    date: string;
    appointments: AgendaAppointment[];
  }[];
};

const INITIAL_ORGANIZATION_SLUG = "demo-service-company";

export async function getAgendaOrganization() {
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

export async function getAgendaAppointments(
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

export async function getAgendaPageData(searchParams: {
  date?: string;
  view?: string;
}): Promise<AgendaPageData> {
  const organization = await getAgendaOrganization();
  const today = getTodayDate(organization.timezone);
  const selectedDate = resolveSelectedDate(searchParams.date, today);
  const view = parseView(searchParams.view);
  const { start, end } = getDateRange(view, selectedDate);
  const appointments = await getAgendaAppointments(
    organization.id,
    start,
    end,
    organization.timezone,
  );

  return {
    organization,
    today,
    selectedDate,
    view,
    appointments,
    groupedAppointments: groupAppointmentsByDate(
      appointments,
      organization.timezone,
    ),
  };
}
