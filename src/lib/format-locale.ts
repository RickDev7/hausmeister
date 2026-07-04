import type { Locale } from "@/types";

function toBcp47(locale: Locale): string {
  switch (locale) {
    case "de":
      return "de-DE";
    case "en":
      return "en-US";
    default:
      return "pt-BR";
  }
}

function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatMonthYear(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(toBcp47(locale), {
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Segunda a domingo, abreviados. */
export function getWeekdayLabels(locale: Locale): string[] {
  const formatter = new Intl.DateTimeFormat(toBcp47(locale), { weekday: "short" });
  const monday = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return formatter.format(day);
  });
}

export function formatLongDate(dateStr: string, locale: Locale): string {
  return new Intl.DateTimeFormat(toBcp47(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateStr}T12:00:00`));
}

export function formatWeekRange(start: string, end: string, locale: Locale): string {
  const bcp47 = toBcp47(locale);
  const fmt = new Intl.DateTimeFormat(bcp47, { day: "numeric", month: "short" });
  const fmtEnd = new Intl.DateTimeFormat(bcp47, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${fmt.format(new Date(`${start}T12:00:00`))} – ${fmtEnd.format(new Date(`${end}T12:00:00`))}`;
}

export function formatCollectionDate(
  dateStr: string,
  locale: Locale,
  labels: { today: string; tomorrow: string }
): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (dateStr === toDateKey(today)) return labels.today;
  if (dateStr === toDateKey(tomorrow)) return labels.tomorrow;

  return new Intl.DateTimeFormat(toBcp47(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${dateStr}T12:00:00`));
}

export function formatCheckInDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(toBcp47(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${iso.slice(0, 10)}T12:00:00`));
}

export function formatCheckInTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
