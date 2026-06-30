import { detectCollectionType } from "@/lib/collection-types";
import { generateId } from "@/lib/utils";
import type { CollectionEvent } from "@/types";

function unfoldIcsLines(content: string): string[] {
  const rawLines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines: string[] = [];

  for (const line of rawLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else if (line.trim()) {
      lines.push(line);
    }
  }

  return lines;
}

function formatDateParts(year: string, month: string, day: string) {
  return `${year}-${month}-${day}`;
}

function parseIcsDate(value: string): { date: string; datetime?: string } | null {
  const cleaned = value.replace(/;.*$/, "").trim();

  if (/^\d{8}$/.test(cleaned)) {
    return {
      date: formatDateParts(cleaned.slice(0, 4), cleaned.slice(4, 6), cleaned.slice(6, 8)),
    };
  }

  const datetimeMatch = cleaned.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z|[+-]\d{4})?$/);
  if (datetimeMatch) {
    const [, year, month, day, hour, minute, second, tz] = datetimeMatch;
    const date = formatDateParts(year, month, day);
    const datetime = `${date}T${hour}:${minute}:${second}${tz ?? ""}`;
    return { date, datetime };
  }

  const parsed = new Date(cleaned);
  if (!Number.isNaN(parsed.getTime())) {
    const date = formatDateParts(
      String(parsed.getFullYear()),
      String(parsed.getMonth() + 1).padStart(2, "0"),
      String(parsed.getDate()).padStart(2, "0")
    );
    return { date, datetime: parsed.toISOString() };
  }

  return null;
}

function parseVeventBlock(block: string): {
  uid: string;
  summary: string;
  dtstart: string;
} | null {
  const lines = unfoldIcsLines(block);
  let uid = "";
  let summary = "";
  let description = "";
  let dtstart = "";

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).split(";")[0].toUpperCase();
    const value = line.slice(colonIndex + 1).trim();

    if (key === "UID") uid = value;
    if (key === "SUMMARY") summary = value;
    if (key === "DESCRIPTION") description = value;
    if (key === "DTSTART") dtstart = value;
  }

  const title = summary || description;
  if (!title || !dtstart) return null;

  return { uid, summary: title, dtstart };
}

function buildEventId(addressId: string, uid: string, dtstart: string): string {
  if (uid) return `${addressId}:${uid}`;
  return `${addressId}:${dtstart}:${generateId()}`;
}

export function parseIcsFile(content: string, addressId: string): CollectionEvent[] {
  const unfolded = unfoldIcsLines(content);
  const fullContent = unfolded.join("\n");
  const events: CollectionEvent[] = [];

  const veventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/gi;
  let match: RegExpExecArray | null;

  while ((match = veventRegex.exec(fullContent)) !== null) {
    const parsed = parseVeventBlock(match[0]);
    if (!parsed) continue;

    const dateInfo = parseIcsDate(parsed.dtstart);
    if (!dateInfo) continue;

    const { type, label } = detectCollectionType(parsed.summary);

    events.push({
      id: buildEventId(addressId, parsed.uid, parsed.dtstart),
      addressId,
      type,
      typeLabel: label,
      originalTitle: parsed.summary,
      date: dateInfo.date,
      datetime: dateInfo.datetime,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function suggestAddressName(filename: string): string {
  return filename
    .replace(/\.ics$/i, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
