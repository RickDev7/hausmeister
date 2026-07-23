import { describe, expect, it } from "vitest";
import { computeWeeklyReport, getWeekBounds } from "./weekly-report";
import type { CheckIn, CollectionEvent } from "@/types";

const addressMap = new Map([["addr-1", "Hauptstr. 1"], ["addr-2", "Bahnhofweg 2"]]);

function event(id: string, addressId: string, collectionDate: string, putOutDate: string): CollectionEvent {
  return {
    id,
    addressId,
    profileId: "default-profile",
    type: "biomuell",
    typeLabel: "Biomüll",
    originalTitle: "Biomüll",
    collectionDate,
    putOutDate,
  };
}

function checkIn(eventId: string, putOutDate: string, collectionDate: string, status: CheckIn["status"] = "completed"): CheckIn {
  return {
    id: `ci-${eventId}`,
    collectionEventId: eventId,
    profileId: "default-profile",
    addressName: "Hauptstr. 1",
    wasteType: "Biomüll",
    putOutDate,
    collectionDate,
    eventDate: collectionDate,
    checkedAt: `${putOutDate}T10:00:00.000Z`,
    status,
  };
}

describe("computeWeeklyReport", () => {
  it("groups by putOutDate within the week", () => {
    const ref = parseISO("2026-07-08");
    const collections = [
      event("e1", "addr-1", "2026-07-07", "2026-07-06"),
      event("e2", "addr-1", "2026-07-09", "2026-07-08"),
      event("e3", "addr-2", "2026-07-11", "2026-07-10"),
      event("e4", "addr-2", "2026-07-16", "2026-07-15"),
    ];
    const checkIns = [
      checkIn("e1", "2026-07-06", "2026-07-07"),
      checkIn("e2", "2026-07-08", "2026-07-09"),
      { ...checkIn("e3", "2026-07-10", "2026-07-11", "missed"), note: "Esqueci" },
    ];

    const report = computeWeeklyReport(collections, checkIns, addressMap, ref);

    expect(report.scheduled).toBe(3);
    expect(report.checkIns).toBe(2);
    expect(report.missed).toBe(1);
    expect(report.pending).toBe(0);
    expect(report.complianceRate).toBe(67);
  });

  it("returns empty week when no events", () => {
    const report = computeWeeklyReport([], [], addressMap, new Date("2026-07-08"));
    expect(report.scheduled).toBe(0);
    expect(report.pending).toBe(0);
    expect(report.complianceRate).toBe(100);
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
