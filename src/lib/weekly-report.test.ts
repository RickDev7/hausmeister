import { describe, expect, it } from "vitest";
import { computeWeeklyReport, getWeekBounds } from "./weekly-report";
import type { CheckIn, CollectionEvent } from "@/types";

const addressMap = new Map([["addr-1", "Hauptstr. 1"], ["addr-2", "Bahnhofweg 2"]]);

function event(id: string, addressId: string, date: string): CollectionEvent {
  return {
    id,
    addressId,
    profileId: "default-profile",
    type: "biomuell",
    typeLabel: "Biomüll",
    originalTitle: "Biomüll",
    date,
  };
}

function checkIn(eventId: string, eventDate: string): CheckIn {
  return {
    id: `ci-${eventId}`,
    collectionEventId: eventId,
    profileId: "default-profile",
    addressName: "Hauptstr. 1",
    wasteType: "Biomüll",
    eventDate,
    checkedAt: `${eventDate}T10:00:00.000Z`,
  };
}

describe("computeWeeklyReport", () => {
  it("counts scheduled, check-ins and pending for the week", () => {
    const ref = parseISO("2026-07-08"); // Wed in week Mon 6 - Sun 12 Jul 2026
    const collections = [
      event("e1", "addr-1", "2026-07-06"),
      event("e2", "addr-1", "2026-07-08"),
      event("e3", "addr-2", "2026-07-10"),
      event("e4", "addr-2", "2026-07-15"), // next week
    ];
    const checkIns = [checkIn("e1", "2026-07-06"), checkIn("e2", "2026-07-08")];

    const report = computeWeeklyReport(collections, checkIns, addressMap, ref);

    expect(report.scheduled).toBe(3);
    expect(report.checkIns).toBe(2);
    expect(report.pending).toBe(1);
    expect(report.byAddress).toHaveLength(2);
  });

  it("returns empty week when no events", () => {
    const report = computeWeeklyReport([], [], addressMap, new Date("2026-07-08"));
    expect(report.scheduled).toBe(0);
    expect(report.pending).toBe(0);
  });
});

describe("getWeekBounds", () => {
  it("uses Monday as week start", () => {
    const bounds = getWeekBounds(new Date("2026-07-08"));
    expect(bounds.start).toBe("2026-07-06");
    expect(bounds.end).toBe("2026-07-12");
  });
});

function parseISO(s: string): Date {
  return new Date(`${s}T12:00:00`);
}
