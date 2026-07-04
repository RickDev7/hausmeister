import type { Address } from "@/types";

export interface AddressColor {
  main: string;
  light: string;
  onMain: string;
}

/** Paleta distinta para distinguir muitos imóveis no calendário. */
export const ADDRESS_COLOR_PALETTE: AddressColor[] = [
  { main: "#006a60", light: "#b2ece4", onMain: "#ffffff" },
  { main: "#6750a4", light: "#eaddff", onMain: "#ffffff" },
  { main: "#984062", light: "#ffd8e4", onMain: "#ffffff" },
  { main: "#1e6588", light: "#cce5ff", onMain: "#ffffff" },
  { main: "#386a20", light: "#c7efaf", onMain: "#ffffff" },
  { main: "#725318", light: "#ffddb0", onMain: "#ffffff" },
  { main: "#8c4a00", light: "#ffdcbe", onMain: "#ffffff" },
  { main: "#526344", light: "#d6e8c7", onMain: "#ffffff" },
  { main: "#006874", light: "#a1eff4", onMain: "#ffffff" },
  { main: "#7d5260", light: "#ffd8e1", onMain: "#ffffff" },
  { main: "#4a4458", light: "#e8def8", onMain: "#ffffff" },
  { main: "#8b4513", light: "#e8d4c4", onMain: "#ffffff" },
];

const FALLBACK_COLOR: AddressColor = {
  main: "#79747e",
  light: "#e6e0e9",
  onMain: "#ffffff",
};

/** Cores estáveis por ordem de criação do endereço. */
export function buildAddressColorMap(
  addresses: Pick<Address, "id" | "createdAt">[]
): Map<string, AddressColor> {
  const sorted = [...addresses].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  );
  const map = new Map<string, AddressColor>();
  sorted.forEach((addr, i) => {
    map.set(addr.id, ADDRESS_COLOR_PALETTE[i % ADDRESS_COLOR_PALETTE.length]!);
  });
  return map;
}

export function getAddressColor(
  addressId: string,
  colorMap: Map<string, AddressColor>
): AddressColor {
  return colorMap.get(addressId) ?? FALLBACK_COLOR;
}
