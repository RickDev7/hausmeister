import type { CollectionType } from "@/types";

interface TypePattern {
  type: CollectionType;
  label: string;
  patterns: RegExp[];
  color: string;
  icon: string;
}

const TYPE_PATTERNS: TypePattern[] = [
  {
    type: "restmuell",
    label: "Lixo residual",
    patterns: [/restm[uü]ll/i, /hausm[uü]ll/i, /restabfall/i, /hausabfall/i, /grau/i],
    color: "var(--type-restmuell)",
    icon: "🗑️",
  },
  {
    type: "biomuell",
    label: "Orgânico",
    patterns: [/biom[uü]ll/i, /bioabfall/i, /biotonne/i, /bio\b/i, /grün/i, /gruen/i],
    color: "var(--type-biomuell)",
    icon: "🌿",
  },
  {
    type: "papier",
    label: "Papel",
    patterns: [/papier/i, /papiertonne/i, /altpapier/i],
    color: "var(--type-papier)",
    icon: "📄",
  },
  {
    type: "gelbe_tonne",
    label: "Lixo amarelo",
    patterns: [
      /gelbe?\s*tonne/i,
      /gelber?\s*sack/i,
      /verpackung/i,
      /wertstoff/i,
      /gelb/i,
      /leichtverpackung/i,
    ],
    color: "var(--type-gelbe-tonne)",
    icon: "♻️",
  },
  {
    type: "sondermuell",
    label: "Lixo especial",
    patterns: [/sonderm[uü]ll/i, /schadstoff/i, /sperrm[uü]ll/i, /sonderabfall/i],
    color: "var(--type-sondermuell)",
    icon: "⚠️",
  },
];

export function detectCollectionType(title: string): {
  type: CollectionType;
  label: string;
  color: string;
  icon: string;
} {
  const normalized = title.trim();

  for (const pattern of TYPE_PATTERNS) {
    if (pattern.patterns.some((p) => p.test(normalized))) {
      return {
        type: pattern.type,
        label: pattern.label,
        color: pattern.color,
        icon: pattern.icon,
      };
    }
  }

  return {
    type: "unknown",
    label: normalized || "Desconhecido",
    color: "var(--type-unknown)",
    icon: "📦",
  };
}

export function getAllCollectionTypes(): {
  type: CollectionType;
  label: string;
}[] {
  return [
    ...TYPE_PATTERNS.map(({ type, label }) => ({ type, label })),
    { type: "unknown", label: "Outros" },
  ];
}

export function getTypeMeta(type: CollectionType) {
  const found = TYPE_PATTERNS.find((p) => p.type === type);
  if (found) {
    return { label: found.label, color: found.color, icon: found.icon };
  }
  return { label: "Outros", color: "var(--type-unknown)", icon: "📦" };
}
