import { describe, expect, it } from "vitest";
import { parseIcsFile } from "@/lib/ics-parser";
import { detectCollectionType } from "@/lib/collection-types";
import { computeCheckInStats } from "@/lib/stats";
import type { CheckIn } from "@/types";

const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-1
SUMMARY:Restmüll
DTSTART:20260704
END:VEVENT
BEGIN:VEVENT
UID:test-2
SUMMARY:Biomüll
DTSTART:20260705T070000
END:VEVENT
BEGIN:VEVENT
UID:test-rrule
SUMMARY:Papiertonne
DTSTART:20260701
RRULE:FREQ=WEEKLY;COUNT=3
END:VEVENT
END:VCALENDAR`;

describe("parseIcsFile", () => {
  it("parses single and recurring events", () => {
    const events = parseIcsFile(SAMPLE_ICS, "addr-1");
    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events.some((e) => e.type === "restmuell")).toBe(true);
    expect(events.some((e) => e.type === "biomuell")).toBe(true);
    expect(events.every((e) => e.profileId === "default-profile")).toBe(true);
  });
});

describe("detectCollectionType", () => {
  it("detects glas", () => {
    const result = detectCollectionType("Altglas Container");
    expect(result.type).toBe("glas");
  });

  it("detects gelbe tonne", () => {
    const result = detectCollectionType("Gelbe Tonne");
    expect(result.type).toBe("gelbe_tonne");
  });
});

describe("computeCheckInStats", () => {
  it("computes totals and streak", () => {
    const today = new Date().toISOString();
    const checkIns: CheckIn[] = [
      {
        id: "1",
        collectionEventId: "e1",
        profileId: "default-profile",
        addressName: "Casa",
        wasteType: "Restmüll",
        putOutDate: today.slice(0, 10),
        collectionDate: today.slice(0, 10),
        eventDate: today.slice(0, 10),
        checkedAt: today,
      },
    ];
    const stats = computeCheckInStats(checkIns);
    expect(stats.totalCheckIns).toBe(1);
    expect(stats.thisMonth).toBe(1);
    expect(stats.currentStreak).toBeGreaterThanOrEqual(1);
  });
});
