import { describe, expect, it } from "vitest";
import {
  applyPutOutDates,
  computePutOutDate,
  normalizeCollectionEvent,
} from "./put-out-date";
import type { CollectionEvent } from "@/types";

function baseEvent(collectionDate: string): CollectionEvent {
  return {
    id: "e1",
    addressId: "a1",
    profileId: "default-profile",
    type: "biomuell",
    typeLabel: "Orgânico",
    originalTitle: "Biomüll",
    collectionDate,
    putOutDate: collectionDate,
  };
}

describe("computePutOutDate", () => {
  it("defaults to 1 day before collection", () => {
    expect(computePutOutDate("2026-07-25", 1)).toBe("2026-07-24");
  });

  it("supports same day and 2 days before", () => {
    expect(computePutOutDate("2026-07-25", 0)).toBe("2026-07-25");
    expect(computePutOutDate("2026-07-25", 2)).toBe("2026-07-23");
  });
});

describe("applyPutOutDates", () => {
  it("keeps collectionDate and updates putOutDate", () => {
    const [event] = applyPutOutDates([baseEvent("2026-07-25")], 1);
    expect(event.collectionDate).toBe("2026-07-25");
    expect(event.putOutDate).toBe("2026-07-24");
  });
});

describe("normalizeCollectionEvent", () => {
  it("migrates legacy date field to collectionDate", () => {
    const legacy = {
      id: "e1",
      addressId: "a1",
      profileId: "default-profile",
      type: "biomuell" as const,
      typeLabel: "Orgânico",
      originalTitle: "Biomüll",
      date: "2026-07-25",
    };
    const normalized = normalizeCollectionEvent(legacy as CollectionEvent & { date?: string }, 1);
    expect(normalized.collectionDate).toBe("2026-07-25");
    expect(normalized.putOutDate).toBe("2026-07-24");
  });
});
