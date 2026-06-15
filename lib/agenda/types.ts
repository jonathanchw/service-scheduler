export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const agendaStatuses = [
  "pending",
  "confirmed",
  "reschedule_requested",
] as const;
export const agendaViews = ["daily", "weekly", "monthly"] as const;

export type AgendaView = (typeof agendaViews)[number];

export type AgendaAppointment = {
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
