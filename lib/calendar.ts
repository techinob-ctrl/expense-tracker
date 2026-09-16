// Use the same calendar timezone on Vercel and in the browser.
export const CALENDAR_TIME_ZONE = "America/New_York";

export function getCurrentMonth(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CALENDAR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")!.value;
  const month = parts.find((part) => part.type === "month")!.value;
  return `${year}-${month}`;
}
