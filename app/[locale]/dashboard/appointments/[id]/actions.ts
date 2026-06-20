"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAgendaOrganization } from "@/lib/agenda/queries";
import {
  assignSuccessParam,
  assignSuccessValue,
  confirmSuccessParam,
  confirmSuccessValue,
  durationPresets,
} from "@/lib/appointments/constants";
import { canAssignStatus, canConfirmStatus } from "@/lib/appointments/status";
import { requireRole } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function readTechnicianIds(formData: FormData) {
  return formData.getAll("technicianIds").map(String).filter(Boolean);
}

function getConfirmedEndAt(
  startAt: string,
  durationMinutes: number,
  travelBufferMinutes: number,
) {
  return new Date(
    new Date(startAt).getTime() +
      (durationMinutes + travelBufferMinutes) * 60_000,
  ).toISOString();
}

export async function confirmAppointment(
  locale: string,
  appointmentId: string,
) {
  const user = await requireRole("supervisor");
  const organization = await getAgendaOrganization();
  const supabase = createSupabaseAdminClient();

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select(
      `
        id,
        status,
        requested_start_at,
        estimated_duration_minutes,
        travel_buffer_minutes,
        services (default_duration_minutes)
      `,
    )
    .eq("id", appointmentId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error || !appointment) {
    throw new Error("Appointment not found.");
  }

  if (!canConfirmStatus(appointment.status)) {
    throw new Error("Appointment cannot be confirmed.");
  }

  const serviceRelation = appointment.services as
    | { default_duration_minutes: number }
    | { default_duration_minutes: number }[];
  const service = Array.isArray(serviceRelation)
    ? serviceRelation[0]
    : serviceRelation;

  if (!service) {
    throw new Error("Service not found.");
  }

  const durationMinutes =
    appointment.estimated_duration_minutes ?? service.default_duration_minutes;
  const confirmedStartAt = appointment.requested_start_at;
  const confirmedEndAt = getConfirmedEndAt(
    confirmedStartAt,
    durationMinutes,
    appointment.travel_buffer_minutes,
  );

  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      status: "confirmed",
      confirmed_start_at: confirmedStartAt,
      confirmed_end_at: confirmedEndAt,
      estimated_duration_minutes: durationMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)
    .eq("organization_id", organization.id);

  if (updateError) {
    throw new Error("Could not confirm appointment.");
  }

  const { error: eventError } = await supabase
    .from("appointment_events")
    .insert({
      appointment_id: appointmentId,
      actor_user_id: user.id,
      event_type: "confirmed",
    });

  if (eventError) {
    throw new Error("Could not log appointment event.");
  }

  revalidatePath(`/${locale}/dashboard/appointments/${appointmentId}`);
  revalidatePath(`/${locale}/dashboard/requests`);
  revalidatePath(`/${locale}/dashboard/agenda`);
  redirect(
    `/${locale}/dashboard/appointments/${appointmentId}?${confirmSuccessParam}=${confirmSuccessValue}`,
  );
}

export async function assignTechnicians(
  locale: string,
  appointmentId: string,
  formData: FormData,
) {
  const user = await requireRole("supervisor");
  const organization = await getAgendaOrganization();
  const supabase = createSupabaseAdminClient();
  const technicianIds = readTechnicianIds(formData);

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, status")
    .eq("id", appointmentId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error || !appointment) {
    throw new Error("Appointment not found.");
  }

  if (!canAssignStatus(appointment.status)) {
    throw new Error("Technicians cannot be assigned to this appointment.");
  }

  if (technicianIds.length > 0) {
    const { data: technicians, error: techniciansError } = await supabase
      .from("technicians")
      .select("id")
      .eq("organization_id", organization.id)
      .eq("active", true)
      .in("id", technicianIds);

    if (techniciansError || technicians?.length !== technicianIds.length) {
      throw new Error("Invalid technician selection.");
    }
  }

  const { error: deleteError } = await supabase
    .from("appointment_technicians")
    .delete()
    .eq("appointment_id", appointmentId);

  if (deleteError) {
    throw new Error("Could not update technician assignments.");
  }

  if (technicianIds.length > 0) {
    const { error: insertError } = await supabase
      .from("appointment_technicians")
      .insert(
        technicianIds.map((technicianId) => ({
          appointment_id: appointmentId,
          technician_id: technicianId,
        })),
      );

    if (insertError) {
      throw new Error("Could not save technician assignments.");
    }
  }

  const { error: eventError } = await supabase
    .from("appointment_events")
    .insert({
      appointment_id: appointmentId,
      actor_user_id: user.id,
      event_type: "technician_assigned",
      metadata: { technician_ids: technicianIds },
    });

  if (eventError) {
    throw new Error("Could not log appointment event.");
  }

  revalidatePath(`/${locale}/dashboard/appointments/${appointmentId}`);
  revalidatePath(`/${locale}/dashboard/agenda`);
  redirect(
    `/${locale}/dashboard/appointments/${appointmentId}?${assignSuccessParam}=${assignSuccessValue}`,
  );
}

export async function removeTechnician(
  locale: string,
  appointmentId: string,
  technicianId: string,
) {
  const user = await requireRole("supervisor");
  const organization = await getAgendaOrganization();
  const supabase = createSupabaseAdminClient();

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, status")
    .eq("id", appointmentId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error || !appointment) {
    throw new Error("Appointment not found.");
  }

  if (!canAssignStatus(appointment.status)) {
    throw new Error("Technicians cannot be removed from this appointment.");
  }

  const { data: technician, error: technicianError } = await supabase
    .from("technicians")
    .select("id")
    .eq("id", technicianId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (technicianError || !technician) {
    throw new Error("Invalid technician.");
  }

  const { error: deleteError } = await supabase
    .from("appointment_technicians")
    .delete()
    .eq("appointment_id", appointmentId)
    .eq("technician_id", technicianId);

  if (deleteError) {
    throw new Error("Could not remove technician assignment.");
  }

  const { error: eventError } = await supabase
    .from("appointment_events")
    .insert({
      appointment_id: appointmentId,
      actor_user_id: user.id,
      event_type: "technician_removed",
      metadata: { technician_id: technicianId },
    });

  if (eventError) {
    throw new Error("Could not log appointment event.");
  }

  revalidatePath(`/${locale}/dashboard/appointments/${appointmentId}`);
  revalidatePath(`/${locale}/dashboard/agenda`);
  redirect(`/${locale}/dashboard/appointments/${appointmentId}`);
}

export async function updateEstimatedDuration(
  locale: string,
  appointmentId: string,
  durationMinutes: number,
) {
  if (!(durationPresets as readonly number[]).includes(durationMinutes)) {
    throw new Error("Invalid duration.");
  }

  const user = await requireRole("supervisor");
  const organization = await getAgendaOrganization();
  const supabase = createSupabaseAdminClient();

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, status, confirmed_start_at, travel_buffer_minutes")
    .eq("id", appointmentId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error || !appointment) {
    throw new Error("Appointment not found.");
  }

  if (!canAssignStatus(appointment.status)) {
    throw new Error("Duration cannot be updated for this appointment.");
  }

  const updatePayload: {
    estimated_duration_minutes: number;
    updated_at: string;
    confirmed_end_at?: string;
  } = {
    estimated_duration_minutes: durationMinutes,
    updated_at: new Date().toISOString(),
  };

  if (appointment.status === "confirmed" && appointment.confirmed_start_at) {
    updatePayload.confirmed_end_at = getConfirmedEndAt(
      appointment.confirmed_start_at,
      durationMinutes,
      appointment.travel_buffer_minutes,
    );
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update(updatePayload)
    .eq("id", appointmentId)
    .eq("organization_id", organization.id);

  if (updateError) {
    throw new Error("Could not update estimated duration.");
  }

  const { error: eventError } = await supabase
    .from("appointment_events")
    .insert({
      appointment_id: appointmentId,
      actor_user_id: user.id,
      event_type: "duration_updated",
      metadata: { estimated_duration_minutes: durationMinutes },
    });

  if (eventError) {
    throw new Error("Could not log appointment event.");
  }

  revalidatePath(`/${locale}/dashboard/appointments/${appointmentId}`);
  revalidatePath(`/${locale}/dashboard/agenda`);
  redirect(`/${locale}/dashboard/appointments/${appointmentId}`);
}
