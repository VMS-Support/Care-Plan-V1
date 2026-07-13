export interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();
const formatter = (timezone: string) => {
  let value = formatterCache.get(timezone);
  if (!value) {
    value = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatterCache.set(timezone, value);
  }
  return value;
};

export function isValidTimezone(timezone: string) {
  try {
    formatter(timezone).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function getLocalDateTimeParts(
  instant: string | Date,
  timezone: string,
): LocalDateTimeParts {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  const parts = formatter(timezone).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value || 0);
  const hour = get("hour");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: hour === 24 ? 0 : hour,
    minute: get("minute"),
    second: get("second"),
  };
}

const tuple = (parts: LocalDateTimeParts) =>
  ((((parts.year * 13 + parts.month) * 32 + parts.day) * 25 + parts.hour) * 61 + parts.minute) *
    61 +
  parts.second;
const same = (left: LocalDateTimeParts, right: LocalDateTimeParts) => tuple(left) === tuple(right);

/**
 * Resolve a nursing-home wall time without using the browser timezone.
 * Ambiguous autumn times choose the earliest instant. Missing spring times move
 * to the first valid local minute after the gap. Both choices are deterministic.
 */
export function zonedDateTimeToUtc(parts: LocalDateTimeParts, timezone: string) {
  if (!isValidTimezone(timezone)) throw new Error(`Invalid timezone: ${timezone}`);
  const approximate = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const exact: number[] = [];
  let firstAfter: number | undefined;
  for (let offsetMinutes = -240; offsetMinutes <= 240; offsetMinutes += 1) {
    const candidate = approximate + offsetMinutes * 60_000;
    const local = getLocalDateTimeParts(new Date(candidate), timezone);
    if (same(local, parts)) exact.push(candidate);
    if (tuple(local) > tuple(parts) && (firstAfter === undefined || candidate < firstAfter))
      firstAfter = candidate;
  }
  if (exact.length) return new Date(Math.min(...exact)).toISOString();
  if (firstAfter !== undefined) return new Date(firstAfter).toISOString();
  throw new Error(`Unable to resolve local time in ${timezone}.`);
}

export const localDateKey = (parts: Pick<LocalDateTimeParts, "year" | "month" | "day">) =>
  `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;

export function addLocalDays(
  parts: Pick<LocalDateTimeParts, "year" | "month" | "day">,
  days: number,
) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export const localWeekday = (parts: Pick<LocalDateTimeParts, "year" | "month" | "day">) =>
  new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();

export const localDaysBetween = (
  from: Pick<LocalDateTimeParts, "year" | "month" | "day">,
  to: Pick<LocalDateTimeParts, "year" | "month" | "day">,
) =>
  Math.floor(
    (Date.UTC(to.year, to.month - 1, to.day) - Date.UTC(from.year, from.month - 1, from.day)) /
      86_400_000,
  );
