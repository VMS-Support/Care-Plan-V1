const DUBLIN_TIME_ZONE = "Europe/Dublin";

export function dublinHour(date: Date) {
  return Number(
    new Intl.DateTimeFormat("en-IE", {
      timeZone: DUBLIN_TIME_ZONE,
      hour: "2-digit",
      hour12: false,
    }).format(date),
  );
}

export function formatDublinDate(date: Date, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-IE", {
    timeZone: DUBLIN_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatDublinTime(date: Date, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-IE", {
    timeZone: DUBLIN_TIME_ZONE,
    ...options,
  }).format(date);
}

export function toDublinDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-IE", {
    timeZone: DUBLIN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function dublinDateTimeToUtcDate(dateKey: string, time: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour || 0, minute || 0);
}
