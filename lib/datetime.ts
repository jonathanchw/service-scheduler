export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);

  return value.toISOString().slice(0, 10);
}

export function addMonths(date: string, months: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1 + months, day));

  return value.toISOString().slice(0, 10);
}

function getTimezoneOffset(date: Date, timezone: string) {
  const timezoneDate = new Date(
    date.toLocaleString("en-US", { timeZone: timezone }),
  );

  return timezoneDate.getTime() - date.getTime();
}

export function createZonedDateTime(
  date: string,
  time: string,
  timezone: string,
) {
  const utcGuess = new Date(`${date}T${time}:00.000Z`);
  const timezoneOffset = getTimezoneOffset(utcGuess, timezone);

  return new Date(utcGuess.getTime() - timezoneOffset).toISOString();
}

export function getTodayDate(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function getDateKey(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).format(new Date(value));
}

export function getWeekRange(date: string) {
  const day = new Date(`${date}T12:00:00.000Z`).getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const start = addDays(date, -daysFromMonday);

  return { start, end: addDays(start, 6) };
}

export function getMonthRange(date: string) {
  const start = `${date.slice(0, 7)}-01`;

  return { start, end: addDays(addMonths(start, 1), -1) };
}
