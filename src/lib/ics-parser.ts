import { RRule } from "rrule";
import { detectCollectionType } from "@/lib/collection-types";
import { generateId } from "@/lib/utils";
import type { CollectionEvent } from "@/types";

const MAX_RRULE_OCCURRENCES = 365;

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

function parseIcsDate(value: string): { date: string; datetime?: string; jsDate?: Date } | null {
  const cleaned = value.replace(/;.*$/, "").trim();

  if (/^\d{8}$/.test(cleaned)) {
    const date = formatDateParts(cleaned.slice(0, 4), cleaned.slice(4, 6), cleaned.slice(6, 8));
    const [y, m, d] = date.split("-").map(Number);
    return { date, jsDate: new Date(y, m - 1, d) };
  }

  const datetimeMatch = cleaned.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z|[+-]\d{4})?$/);
  if (datetimeMatch) {
    const [, year, month, day, hour, minute, second, tz] = datetimeMatch;
    const date = formatDateParts(year, month, day);
    const datetime = `${date}T${hour}:${minute}:${second}${tz ?? ""}`;
    const jsDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );
    return { date, datetime, jsDate };
  }

  const parsed = new Date(cleaned);
  if (!Number.isNaN(parsed.getTime())) {
    const date = formatDateParts(
      String(parsed.getFullYear()),
      String(parsed.getMonth() + 1).padStart(2, "0"),
      String(parsed.getDate()).padStart(2, "0")
    );
    return { date, datetime: parsed.toISOString(), jsDate: parsed };
  }

  return null;
}

function parseVeventBlock(block: string): {
  uid: string;
  summary: string;
  dtstart: string;
  rrule?: string;
  exdate?: string[];
} | null {
  const lines = unfoldIcsLines(block);
  let uid = "";
  let summary = "";
  let description = "";
  let dtstart = "";
  let rrule = "";
  const exdate: string[] = [];

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const keyPart = line.slice(0, colonIndex);
    const key = keyPart.split(";")[0].toUpperCase();
    const value = line.slice(colonIndex + 1).trim();

    if (key === "UID") uid = value;
    if (key === "SUMMARY") summary = value;
    if (key === "DESCRIPTION") description = value;
    if (key === "DTSTART") dtstart = value;
    if (key === "RRULE") rrule = value;
    if (key === "EXDATE") exdate.push(value);
  }

  const title = summary || description;
  if (!title || !dtstart) return null;

  return { uid, summary: title, dtstart, rrule: rrule || undefined, exdate: exdate.length ? exdate : undefined };
}

function buildEventId(addressId: string, uid: string, dtstart: string): string {
  if (uid) return `${addressId}:${uid}:${dtstart}`;
  return `${addressId}:${dtstart}:${generateId()}`;
}

function expandRRuleDates(
  dtstart: string,
  rruleStr: string,
  exdates?: string[]
): { date: string; datetime?: string }[] {
  const startInfo = parseIcsDate(dtstart);
  if (!startInfo?.jsDate) return [];

  try {
    const rule = RRule.fromString(`DTSTART:${dtstart.replace(/;.*$/, "")}\nRRULE:${rruleStr}`);
    const until = new Date();
    until.setFullYear(until.getFullYear() + 1);

    const occurrences = rule.between(startInfo.jsDate, until, true).slice(0, MAX_RRULE_OCCURRENCES);

    const excluded = new Set<string>();
    if (exdates) {
      for (const ex of exdates) {
        for (const part of ex.split(",")) {
          const info = parseIcsDate(part.trim());
          if (info) excluded.add(info.date);
        }
      }
    }

    return occurrences
      .map((d) => {
        const date = formatDateParts(
          String(d.getFullYear()),
          String(d.getMonth() + 1).padStart(2, "0"),
          String(d.getDate()).padStart(2, "0")
        );
        return { date, datetime: d.toISOString() };
      })
      .filter((d) => !excluded.has(d.date));
  } catch {
    return startInfo.date ? [{ date: startInfo.date, datetime: startInfo.datetime }] : [];
  }
}

function buildEvent(
  addressId: string,
  profileId: string,
  parsed: { uid: string; summary: string; dtstart: string; rrule?: string; exdate?: string[] },
  dateInfo: { date: string; datetime?: string }
): CollectionEvent {
  const { type, label } = detectCollectionType(parsed.summary);
  return {
    id: buildEventId(addressId, parsed.uid, dateInfo.date),
    addressId,
    profileId,
    type,
    typeLabel: label,
    originalTitle: parsed.summary,
    /** Data oficial do .ics — nunca alterar. putOutDate é aplicado depois. */
    collectionDate: dateInfo.date,
    putOutDate: dateInfo.date,
    datetime: dateInfo.datetime,
  };
}

export function parseIcsFile(
  content: string,
  addressId: string,
  profileId?: string
): CollectionEvent[] {
  const unfolded = unfoldIcsLines(content);
  const fullContent = unfolded.join("\n");
  const events: CollectionEvent[] = [];
  const pid = profileId ?? "default-profile";

  const veventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/gi;
  let match: RegExpExecArray | null;

  while ((match = veventRegex.exec(fullContent)) !== null) {
    const parsed = parseVeventBlock(match[0]);
    if (!parsed) continue;

    if (parsed.rrule) {
      const dates = expandRRuleDates(parsed.dtstart, parsed.rrule, parsed.exdate);
      for (const dateInfo of dates) {
        events.push(buildEvent(addressId, pid, parsed, dateInfo));
      }
      continue;
    }

    const dateInfo = parseIcsDate(parsed.dtstart);
    if (!dateInfo) continue;

    events.push(buildEvent(addressId, pid, parsed, dateInfo));
  }

  const unique = new Map<string, CollectionEvent>();
  for (const e of events) {
    unique.set(e.id, e);
  }

  return Array.from(unique.values()).sort((a, b) =>
    a.collectionDate.localeCompare(b.collectionDate)
  );
}

export function suggestAddressName(filename: string): string {
  return filename
    .replace(/\.ics$/i, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
