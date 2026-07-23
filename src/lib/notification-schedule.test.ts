import { describe, expect, it } from "vitest";
import { buildPushSchedule } from "@/lib/notification-schedule";
import type { CollectionEvent } from "@/types";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/types";
import { computePutOutDate } from "@/lib/put-out-date";

describe("buildPushSchedule", () => {
  it("schedules from putOutDate, not collectionDate", () => {
    const collectionDate = new Date();
    collectionDate.setDate(collectionDate.getDate() + 3);
    const collectionDateStr = collectionDate.toISOString().slice(0, 10);
    const putOutDate = computePutOutDate(collectionDateStr, 1);

    const events: CollectionEvent[] = [
      {
        id: "e1",
        addressId: "a1",
        profileId: "default-profile",
        type: "restmuell",
        typeLabel: "Lixo residual",
        originalTitle: "Restmüll",
        collectionDate: collectionDateStr,
        putOutDate,
      },
    ];

    const schedules = buildPushSchedule(
      events,
      new Map([["a1", "Casa"]]),
      { ...DEFAULT_NOTIFICATION_SETTINGS, enabled: true }
    );

    expect(schedules.some((s) => s.kind === "day_of")).toBe(true);
    expect(schedules.every((s) => new Date(s.sendAt) > new Date())).toBe(true);
    const dayOf = schedules.find((s) => s.kind === "day_of");
    expect(dayOf?.sendAt.startsWith(putOutDate)).toBe(true);
  });
});
