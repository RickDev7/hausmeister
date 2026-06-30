import type { Address } from "@/types";

export function buildAddressMap(addresses: Address[]): Map<string, string> {
  return new Map(addresses.map((a) => [a.id, a.name]));
}
