import { describe, expect, it } from "vitest";
import { buildAddressColorMap, getAddressColor } from "./address-colors";

describe("buildAddressColorMap", () => {
  it("assigns stable colors by creation order", () => {
    const map = buildAddressColorMap([
      { id: "b", createdAt: "2024-02-01T00:00:00.000Z" },
      { id: "a", createdAt: "2024-01-01T00:00:00.000Z" },
    ]);

    expect(map.get("a")?.main).toBeTruthy();
    expect(map.get("b")?.main).toBeTruthy();
    expect(map.get("a")).not.toEqual(map.get("b"));
  });

  it("returns fallback for unknown address", () => {
    const map = buildAddressColorMap([{ id: "a", createdAt: "2024-01-01T00:00:00.000Z" }]);
    expect(getAddressColor("missing", map).main).toBe("#79747e");
  });
});
