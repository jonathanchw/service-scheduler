type AppointmentSchedulingSource = {
  requested_start_at: string;
  confirmed_start_at: string | null;
  estimated_duration_minutes: number | null;
  travel_buffer_minutes: number;
  services:
    | { default_duration_minutes: number }
    | { default_duration_minutes: number }[]
    | null;
};

function resolveService(
  services: AppointmentSchedulingSource["services"],
) {
  if (!services) {
    return null;
  }

  return Array.isArray(services) ? services[0] : services;
}

export function getAppointmentSchedulingWindow(
  appointment: AppointmentSchedulingSource,
) {
  const service = resolveService(appointment.services);

  if (!service) {
    throw new Error("Service not found.");
  }

  return {
    startAt: appointment.confirmed_start_at ?? appointment.requested_start_at,
    durationMinutes:
      appointment.estimated_duration_minutes ??
      service.default_duration_minutes,
    travelBufferMinutes: appointment.travel_buffer_minutes,
  };
}
