export function parseDurationHoursToMinutes(value: string | number | undefined) {
  if (value === undefined || value === "") return undefined;
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    throw new Error(/[a-z]/i.test(text) ? "The Course duration must contain numbers only." : "The Course duration must be a positive number of hours.");
  }
  const hours = Number(text);
  if (!Number.isFinite(hours) || hours <= 0) throw new Error("The Course duration must be a positive number of hours.");
  return Math.round(hours * 60);
}

export function minutesToDurationHours(minutes?: number) {
  if (!minutes) return "";
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : String(Math.round(hours * 100) / 100);
}

export function formatTrainingDuration(minutes?: number) {
  if (!minutes) return "Not set";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hourLabel = `${hours} ${hours === 1 ? "hr" : "hrs"}`;
  return mins ? `${hourLabel} ${mins} min` : hourLabel;
}
