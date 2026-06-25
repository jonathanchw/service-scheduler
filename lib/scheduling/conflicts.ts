import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { getBlockedWindowEnd } from "./blocked-window";

export type SchedulingConflict = {
  technicianId: string;
  conflictingAppointmentId: string;
};

type FindConflictsInput = {
  organizationId: string;
  appointmentId: string;
  technicianIds: string[];
  startAt: string;
  durationMinutes: number;
  travelBufferMinutes: number;
};

export async function findTechnicianSchedulingConflicts({
  organizationId,
  appointmentId,
  technicianIds,
  startAt,
  durationMinutes,
  travelBufferMinutes,
}: FindConflictsInput): Promise<SchedulingConflict[]> {
  if (technicianIds.length === 0) {
    return [];
  }

  const candidateEnd = getBlockedWindowEnd(
    startAt,
    durationMinutes,
    travelBufferMinutes,
  );
  const supabase = createSupabaseAdminClient();

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      `
        id,
        appointment_technicians (technician_id)
      `,
    )
    .eq("organization_id", organizationId)
    .eq("status", "confirmed")
    .neq("id", appointmentId)
    .lt("confirmed_start_at", candidateEnd)
    .gt("confirmed_end_at", startAt);

  if (error) {
    throw new Error("Could not check scheduling conflicts.");
  }

  const technicianIdSet = new Set(technicianIds);
  const conflicts: SchedulingConflict[] = [];
  const seen = new Set<string>();

  for (const appointment of appointments ?? []) {
    const assignments = appointment.appointment_technicians as
      | { technician_id: string }[]
      | { technician_id: string }
      | null;

    const rows = Array.isArray(assignments)
      ? assignments
      : assignments
        ? [assignments]
        : [];

    for (const assignment of rows) {
      if (!technicianIdSet.has(assignment.technician_id)) {
        continue;
      }

      const key = `${assignment.technician_id}:${appointment.id}`;

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      conflicts.push({
        technicianId: assignment.technician_id,
        conflictingAppointmentId: appointment.id,
      });
    }
  }

  return conflicts;
}

export async function getBusyTechnicianIds(
  input: Omit<FindConflictsInput, "technicianIds"> & {
    technicianIds: string[];
  },
) {
  const conflicts = await findTechnicianSchedulingConflicts(input);

  return new Set(conflicts.map((conflict) => conflict.technicianId));
}
