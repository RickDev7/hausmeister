import { describe, expect, it } from "vitest";
import { weeklyReportToCsv, type WeeklyReportLabels } from "./weekly-report-export";
import type { WeeklyReport } from "./weekly-report";

const labels: WeeklyReportLabels = {
  locale: "pt-BR",
  appName: "Test App",
  title: "Resumo semanal",
  scheduled: "Agendadas",
  checkIns: "Check-ins",
  pending: "Pendentes",
  byAddress: "Por endereço",
  address: "Endereço",
  date: "Data",
  type: "Tipo",
  status: "Status",
  statusDone: "Concluído",
  statusPending: "Pendente",
  checkedAt: "Check-in em",
  pendingSection: "Pendentes",
  checkInsSection: "Check-ins",
  period: "Período",
  value: "Valor",
  allEvents: "Todas as coletas",
  printHint: "hint",
  printButton: "Print",
  fileName: "relatorio-semanal",
  addressSummary: "{name}: {checkIns}/{scheduled} ({pending} pendentes)",
  pendingLine: "• {date} — {address} ({type})",
};

const sampleReport: WeeklyReport = {
  weekStart: "2026-07-06",
  weekEnd: "2026-07-12",
  scheduled: 2,
  checkIns: 1,
  pending: 1,
  byAddress: [{ addressName: "Hauptstr. 1", scheduled: 2, checkIns: 1, pending: 1 }],
  rows: [
    {
      eventId: "e1",
      date: "2026-07-06",
      addressName: "Hauptstr. 1",
      typeLabel: "Biomüll",
      status: "done",
      checkedAt: "2026-07-06T08:30:00.000Z",
    },
    {
      eventId: "e2",
      date: "2026-07-10",
      addressName: "Hauptstr. 1",
      typeLabel: "Restmüll",
      status: "pending",
    },
  ],
};

describe("weeklyReportToCsv", () => {
  it("uses semicolon separator for Excel", () => {
    const csv = weeklyReportToCsv(sampleReport, labels);
    expect(csv.startsWith("\ufeffsep=;")).toBe(true);
    expect(csv).toContain("Agendadas;2");
    expect(csv).toContain("Biomüll;Concluído");
    expect(csv).toContain("Restmüll;Pendente");
  });

  it("includes unified events table", () => {
    const csv = weeklyReportToCsv(sampleReport, labels);
    expect(csv).toContain("Todas as coletas");
    expect(csv).toContain("Status;Check-in em");
  });
});
