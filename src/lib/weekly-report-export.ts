import type { WeeklyReport, WeeklyReportRow } from "@/lib/weekly-report";
import {
  formatExportDate,
  formatExportDateTime,
  localeToHtmlLang,
} from "@/lib/format-locale";
import type { Locale } from "@/types";

export interface WeeklyReportLabels {
  locale: Locale;
  appName: string;
  title: string;
  scheduled: string;
  checkIns: string;
  missed: string;
  pending: string;
  compliance: string;
  byAddress: string;
  address: string;
  date: string;
  type: string;
  status: string;
  statusDone: string;
  statusMissed: string;
  statusPending: string;
  checkedAt: string;
  note: string;
  pendingSection: string;
  missedSection: string;
  checkInsSection: string;
  period: string;
  value: string;
  allEvents: string;
  printHint: string;
  printButton: string;
  fileName: string;
  addressSummary: string;
  pendingLine: string;
  missedLine: string;
}

/** Excel alemão/europeu usa ponto-e-vírgula como separador de colunas. */
const EXCEL_SEP = ";";
const TABLE_COLS = 6;

function escapeCell(value: string): string {
  if (/[;"'\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function row(cells: (string | number)[]): string {
  return cells.map((c) => escapeCell(String(c))).join(EXCEL_SEP);
}

function formatDate(dateStr: string, locale: Locale): string {
  return formatExportDate(dateStr, locale);
}

function formatDateTime(iso: string | undefined, locale: Locale): string {
  return formatExportDateTime(iso, locale);
}

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function blankRow(cols = TABLE_COLS): string {
  return row(Array(cols).fill(""));
}

function sectionTitle(title: string, cols = TABLE_COLS): string {
  return row([title, ...Array(cols - 1).fill("")]);
}

function statusLabel(r: WeeklyReportRow, labels: WeeklyReportLabels): string {
  if (r.status === "done") return labels.statusDone;
  if (r.status === "missed") return labels.statusMissed;
  return labels.statusPending;
}

export function weeklyReportToCsv(report: WeeklyReport, labels: WeeklyReportLabels): string {
  const lines: string[] = [
    `sep=${EXCEL_SEP}`,
    sectionTitle(`${labels.appName} — ${labels.title}`),
    row([
      labels.period,
      formatDate(report.weekStart, labels.locale),
      formatDate(report.weekEnd, labels.locale),
    ]),
    blankRow(),
    sectionTitle(labels.title),
    row([labels.scheduled, report.scheduled]),
    row([labels.checkIns, report.checkIns]),
    row([labels.missed, report.missed]),
    row([labels.pending, report.pending]),
    row([labels.compliance, `${report.complianceRate}%`]),
    blankRow(),
    sectionTitle(labels.byAddress),
    row([labels.address, labels.scheduled, labels.checkIns, labels.missed, labels.pending]),
    ...report.byAddress.map((a) =>
      row([a.addressName, a.scheduled, a.checkIns, a.missed, a.pending])
    ),
    blankRow(),
    sectionTitle(labels.allEvents),
    row([
      labels.date,
      labels.address,
      labels.type,
      labels.status,
      labels.checkedAt,
      labels.note,
    ]),
    ...report.rows.map((r) => eventRow(r, labels)),
  ];

  return `\ufeff${lines.join("\r\n")}`;
}

function eventRow(r: WeeklyReportRow, labels: WeeklyReportLabels): string {
  return row([
    formatDate(r.date, labels.locale),
    r.addressName,
    r.typeLabel,
    statusLabel(r, labels),
    formatDateTime(r.checkedAt, labels.locale),
    r.note ?? "",
  ]);
}

export function weeklyReportToPlainText(
  report: WeeklyReport,
  labels: WeeklyReportLabels
): string {
  const lines = [
    `${labels.appName} — ${labels.title}`,
    `${formatDate(report.weekStart, labels.locale)} – ${formatDate(report.weekEnd, labels.locale)}`,
    "",
    `${labels.scheduled}: ${report.scheduled}`,
    `${labels.checkIns}: ${report.checkIns}`,
    `${labels.missed}: ${report.missed}`,
    `${labels.pending}: ${report.pending}`,
    `${labels.compliance}: ${report.complianceRate}%`,
    "",
    labels.byAddress,
    ...report.byAddress.map((a) =>
      fillTemplate(labels.addressSummary, {
        name: a.addressName,
        checkIns: a.checkIns,
        scheduled: a.scheduled,
        missed: a.missed,
        pending: a.pending,
      })
    ),
  ];

  const pending = report.rows.filter((r) => r.status === "pending");
  if (pending.length > 0) {
    lines.push("", labels.pendingSection);
    for (const r of pending) {
      lines.push(
        fillTemplate(labels.pendingLine, {
          date: formatDate(r.date, labels.locale),
          address: r.addressName,
          type: r.typeLabel,
        })
      );
    }
  }

  const missed = report.rows.filter((r) => r.status === "missed");
  if (missed.length > 0) {
    lines.push("", labels.missedSection);
    for (const r of missed) {
      lines.push(
        fillTemplate(labels.missedLine, {
          date: formatDate(r.date, labels.locale),
          address: r.addressName,
          type: r.typeLabel,
          note: r.note ?? "",
        })
      );
    }
  }

  return lines.join("\n");
}

export function downloadWeeklyReportCsv(report: WeeklyReport, labels: WeeklyReportLabels): void {
  const csv = weeklyReportToCsv(report, labels);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${labels.fileName}_${report.weekStart}_${report.weekEnd}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildReportHtml(report: WeeklyReport, labels: WeeklyReportLabels): string {
  const period = `${escapeHtml(formatDate(report.weekStart, labels.locale))} – ${escapeHtml(formatDate(report.weekEnd, labels.locale))}`;
  const htmlLang = localeToHtmlLang(labels.locale);

  const addressRows = report.byAddress
    .map(
      (a) =>
        `<tr><td>${escapeHtml(a.addressName)}</td><td class="num">${a.scheduled}</td><td class="num">${a.checkIns}</td><td class="num">${a.missed}</td><td class="num">${a.pending}</td></tr>`
    )
    .join("");

  const allEventsRows = report.rows
    .map(
      (r) =>
        `<tr>
          <td class="nowrap">${escapeHtml(formatDate(r.date, labels.locale))}</td>
          <td>${escapeHtml(r.addressName)}</td>
          <td>${escapeHtml(r.typeLabel)}</td>
          <td><span class="badge ${r.status}">${escapeHtml(statusLabel(r, labels))}</span></td>
          <td class="nowrap">${escapeHtml(formatDateTime(r.checkedAt, labels.locale))}</td>
          <td>${escapeHtml(r.note ?? "")}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(labels.title)} — ${period}</title>
  <style>
    * { box-sizing: border-box; }
    html { background: #e8e8e8; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
      margin: 0 auto;
      padding: 0;
      max-width: 210mm;
      min-height: 100vh;
      color: #1a1a1a;
      font-size: 11pt;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      background: #006a60;
      color: #fff;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .toolbar p { margin: 0; font-size: 13px; line-height: 1.4; opacity: 0.95; }
    .toolbar button {
      background: #fff;
      color: #006a60;
      border: none;
      border-radius: 8px;
      padding: 12px 20px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
    }
    .content { padding: 20px 16px 32px; }
    header { border-bottom: 2px solid #006a60; padding-bottom: 12px; margin-bottom: 20px; }
    h1 { font-size: 18pt; margin: 0 0 4px; color: #006a60; line-height: 1.2; }
    .meta { color: #555; font-size: 11pt; margin: 0; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 24px; }
    @media (min-width: 480px) { .stats { grid-template-columns: repeat(4, 1fr); } }
    .stat { border: 1px solid #ccc; border-radius: 8px; padding: 14px 8px; text-align: center; background: #fafafa; }
    .stat .num { font-size: 24pt; font-weight: 700; color: #006a60; display: block; line-height: 1.1; }
    .stat .lbl { font-size: 8pt; color: #666; margin-top: 6px; display: block; text-transform: uppercase; letter-spacing: 0.03em; }
    .stat.pending .num { color: #b3261e; }
    .stat.missed .num { color: #9a3412; }
    .compliance { text-align: center; margin: -12px 0 20px; font-size: 12pt; color: #006a60; font-weight: 600; }
    h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.06em; color: #006a60; margin: 24px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9.5pt; table-layout: fixed; }
    th, td { border: 1px solid #ccc; padding: 7px 6px; text-align: left; vertical-align: top; word-wrap: break-word; }
    th { background: #e8f5f3; font-weight: 600; font-size: 8.5pt; }
    td.num { text-align: center; font-variant-numeric: tabular-nums; }
    td.nowrap { white-space: nowrap; }
    tr:nth-child(even) td { background: #fafafa; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 8pt; font-weight: 600; }
    .badge.done { background: #c7efcf; color: #1b5e20; }
    .badge.pending { background: #ffd9d9; color: #8b1a1a; }
    .badge.missed { background: #ffe0cc; color: #9a3412; }
    footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 8pt; color: #888; text-align: center; }
    @page { size: A4 portrait; margin: 12mm; }
    @media print {
      html { background: #fff; }
      body { max-width: none; min-height: auto; }
      .toolbar { display: none !important; }
      .content { padding: 0; }
      table { font-size: 9pt; }
      tr { break-inside: avoid; }
      h2 { break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <p>${escapeHtml(labels.printHint)}</p>
    <button type="button" onclick="window.print()">${escapeHtml(labels.printButton)}</button>
  </div>
  <div class="content">
    <header>
      <h1>${escapeHtml(labels.appName)}</h1>
      <p class="meta">${escapeHtml(labels.title)} · ${period}</p>
    </header>
    <div class="stats">
      <div class="stat"><span class="num">${report.scheduled}</span><span class="lbl">${escapeHtml(labels.scheduled)}</span></div>
      <div class="stat"><span class="num">${report.checkIns}</span><span class="lbl">${escapeHtml(labels.checkIns)}</span></div>
      <div class="stat missed"><span class="num">${report.missed}</span><span class="lbl">${escapeHtml(labels.missed)}</span></div>
      <div class="stat pending"><span class="num">${report.pending}</span><span class="lbl">${escapeHtml(labels.pending)}</span></div>
    </div>
    <p class="compliance">${escapeHtml(labels.compliance)}: ${report.complianceRate}%</p>
    <h2>${escapeHtml(labels.byAddress)}</h2>
    <table>
      <thead><tr><th>${escapeHtml(labels.address)}</th><th>${escapeHtml(labels.scheduled)}</th><th>${escapeHtml(labels.checkIns)}</th><th>${escapeHtml(labels.missed)}</th><th>${escapeHtml(labels.pending)}</th></tr></thead>
      <tbody>${addressRows}</tbody>
    </table>
    <h2>${escapeHtml(labels.allEvents)}</h2>
    <table>
      <thead><tr><th>${escapeHtml(labels.date)}</th><th>${escapeHtml(labels.address)}</th><th>${escapeHtml(labels.type)}</th><th>${escapeHtml(labels.status)}</th><th>${escapeHtml(labels.checkedAt)}</th><th>${escapeHtml(labels.note)}</th></tr></thead>
      <tbody>${allEventsRows}</tbody>
    </table>
    <footer>${escapeHtml(labels.appName)} · ${period}</footer>
  </div>
  <script>
    if (!/iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent)) {
      window.addEventListener("load", function () {
        setTimeout(function () { window.print(); }, 400);
      });
    }
  </script>
</body>
</html>`;
}

export function printWeeklyReport(report: WeeklyReport, labels: WeeklyReportLabels): void {
  const html = buildReportHtml(report, labels);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const cleanup = () => {
    window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
  };

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) {
    cleanup();
    return;
  }

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${labels.fileName}_${report.weekStart}.html`;
  anchor.click();
  cleanup();
}

export function emailWeeklyReport(report: WeeklyReport, labels: WeeklyReportLabels): void {
  const subject = encodeURIComponent(
    `${labels.title} (${formatDate(report.weekStart, labels.locale)} – ${formatDate(report.weekEnd, labels.locale)})`
  );
  const body = encodeURIComponent(weeklyReportToPlainText(report, labels));
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

export async function shareWeeklyReport(
  report: WeeklyReport,
  labels: WeeklyReportLabels
): Promise<boolean> {
  if (!navigator.share) return false;

  const text = weeklyReportToPlainText(report, labels);
  try {
    const csv = weeklyReportToCsv(report, labels);
    const file = new File(
      [csv],
      `${labels.fileName}_${report.weekStart}.csv`,
      { type: "text/csv" }
    );
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: labels.title, text, files: [file] });
    } else {
      await navigator.share({ title: labels.title, text });
    }
    return true;
  } catch {
    return false;
  }
}
