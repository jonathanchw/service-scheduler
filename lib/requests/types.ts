export const pendingRequestStatuses = [
  "pending",
  "reschedule_requested",
] as const;

export type PendingRequestAppointment = {
  id: string;
  status: string;
  requested_start_at: string;
  created_at: string;
  address: string;
  city: string;
  equipment_type: string;
  clients: {
    name: string;
  };
  services: {
    name: string;
    is_emergency: boolean;
  };
};
