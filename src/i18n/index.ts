import type { Locale } from "@/types";
import { ptBR, type Messages } from "./messages/pt-BR";
import { de } from "./messages/de";
import { en } from "./messages/en";

const catalogs: Record<Locale, Messages> = {
  "pt-BR": ptBR,
  de,
  en,
};

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? ptBR;
}

export type { Messages };
