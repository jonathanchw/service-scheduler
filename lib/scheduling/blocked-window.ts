export function getBlockedWindowEnd(
  startAt: string,
  durationMinutes: number,
  travelBufferMinutes: number,
) {
  return new Date(
    new Date(startAt).getTime() +
      (durationMinutes + travelBufferMinutes) * 60_000,
  ).toISOString();
}
