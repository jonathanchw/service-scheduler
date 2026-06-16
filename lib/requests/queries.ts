import { getAgendaOrganization } from "@/lib/agenda/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  pendingRequestStatuses,
  type PendingRequestAppointment,
} from "./types";

export type PendingRequestsPageData = {
  organization: {
    id: string;
    timezone: string;
  };
  requests: PendingRequestAppointment[];
};

export async function getPendingRequestsPageData(): Promise<PendingRequestsPageData> {
  const organization = await getAgendaOrganization();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
        id,
        status,
        requested_start_at,
        created_at,
        address,
        city,
        equipment_type,
        clients (name),
        services (name, is_emergency)
      `,
    )
    .eq("organization_id", organization.id)
    .in("status", [...pendingRequestStatuses])
    .order("requested_start_at", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Could not load pending requests.");
  }

  return {
    organization,
    requests: data as unknown as PendingRequestAppointment[],
  };
}
