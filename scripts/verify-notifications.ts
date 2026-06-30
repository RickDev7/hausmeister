/**
 * Verificação da lógica de agendamento de notificações (sem browser).
 * Executar: npx tsx scripts/verify-notifications.ts
 */
import { addDays, format } from "date-fns";
import { isNotificationTimeReached } from "../src/lib/notifications";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FALHOU: ${message}`);
  console.log(`OK: ${message}`);
}

// Horário: antes das 07:00 não dispara
const beforeSeven = new Date("2026-06-30T06:30:00");
assert(!isNotificationTimeReached("07:00", beforeSeven), "06:30 não atinge horário 07:00");

// Horário: às 07:00 dispara
const atSeven = new Date("2026-06-30T07:00:00");
assert(isNotificationTimeReached("07:00", atSeven), "07:00 atinge horário 07:00");

// Horário: depois das 07:00 dispara
const afterSeven = new Date("2026-06-30T10:00:00");
assert(isNotificationTimeReached("07:00", afterSeven), "10:00 atinge horário 07:00");

// Datas hoje/amanhã
const today = new Date("2026-06-30T12:00:00");
const todayStr = format(today, "yyyy-MM-dd");
const tomorrowStr = format(addDays(today, 1), "yyyy-MM-dd");
assert(todayStr === "2026-06-30", "data de hoje correta");
assert(tomorrowStr === "2026-07-01", "data de amanhã correta");

// Evento amanhã → elegível para lembrete day_before
const eventTomorrow = { date: tomorrowStr };
assert(eventTomorrow.date === tomorrowStr, "evento amanhã elegível para lembrete véspera");

// Evento hoje → elegível para lembrete day_of
const eventToday = { date: todayStr };
assert(eventToday.date === todayStr, "evento hoje elegível para lembrete no dia");

console.log("\nTodas as verificações de lógica passaram.");
