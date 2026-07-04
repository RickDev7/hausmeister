import { describe, expect, it } from "vitest";
import { buildPushSchedule } from "@/lib/notification-schedule";
import type { CollectionEvent } from "@/types";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/types";

describe("buildPushSchedule", () => {
  it("creates future day_before notification", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const dateStr = tomorrow.toISOString().slice(0, 10);

    const events: CollectionEvent[] = [
      {
        id: "e1",
        addressId: "a1",
        profileId: "default-profile",
        type: "restmuell",
        typeLabel: "Lixo residual",
        originalTitle: "Restmüll",
        date: dateStr,
      },
    ];

    const schedules = buildPushSchedule(
      events,
      new Map([["a1", "Casa"]]),
      { ...DEFAULT_NOTIFICATION_SETTINGS, enabled: true }
    );

    expect(schedules.some((s) => s.kind === "day_before")).toBe(true);
    expect(schedules.every((s) => new Date(s.sendAt) > new Date())).toBe(true);
  });
});
