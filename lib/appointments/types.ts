export const assignableStatuses = [
  "pending",
  "reschedule_requested",
  "confirmed",
] as const;

export type AssignableStatus = (typeof assignableStatuses)[number];

export type AppointmentDetail = {
  id: string;
  status: string;
  requested_start_at: string;
  confirmed_start_at: string | null;
  estimated_duration_minutes: number | null;
  travel_buffer_minutes: number;
  created_at: string;
  address: string;
  city: string;
  equipment_type: string;
  brand_model: string | null;
  problem_description: string;
  client_notes: string | null;
  clients: {
    name: string;
    email: string;
    phone: string;
  };
  services: {
    name: string;
    is_emergency: boolean;
    default_duration_minutes: number;
  };
  appointment_technicians: {
    technician_id: string;
    technicians: {
      name: string;
    };
  }[];
};
