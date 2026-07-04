import type { WeeklyReport, WeeklyReportRow } from "@/lib/weekly-report";

export interface WeeklyReportLabels {
  appName: string;
  title: string;
  scheduled: string;
  checkIns: string;
  pending: string;
  byAddress: string;
  address: string;
  date: string;
  type: string;
  status: string;
  statusDone: string;
  statusPending: string;
  checkedAt: string;
  pendingSection: string;
  checkInsSection: string;
  period: string;
  value: string;
  allEvents: string;
}

/** Excel alemão/europeu usa ponto-e-vírgula como separador de colunas. */
const EXCEL_SEP = ";";

function escapeCell(value: string): string {
  if (/[;"'\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function row(cells: (string | number)[]): string {
  return cells.map((c) => escapeCell(String(c))).join(EXCEL_SEP);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

function formatDateTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function blankRow(cols = 5): string {
  return row(Array(cols).fill(""));
}

function sectionTitle(title: string, cols = 5): string {
  return row([title, ...Array(cols - 1).fill("")]);
}

export function weeklyReportToCsv(report: WeeklyReport, labels: WeeklyReportLabels): string {
  const lines: string[] = [
    `sep=${EXCEL_SEP}`,
    sectionTitle(`${labels.appName} — ${labels.title}`),
    row([labels.period, formatDate(report.weekStart), formatDate(report.weekEnd)]),
    blankRow(),
    sectionTitle(labels.title),
    row([labels.scheduled, report.scheduled]),
    row([labels.checkIns, report.checkIns]),
    row([labels.pending, report.pending]),
    blankRow(),
    sectionTitle(labels.byAddress),
    row([labels.address, labels.scheduled, labels.checkIns, labels.pending]),
    ...report.byAddress.map((a) =>
      row([a.addressName, a.scheduled, a.checkIns, a.pending])
    ),
    blankRow(),
    sectionTitle(labels.allEvents),
    row([labels.date, labels.address, labels.type, labels.status, labels.checkedAt]),
    ...report.rows.map((r) => eventRow(r, labels)),
  ];

  return `\ufeff${lines.join("\r\n")}`;
}

function eventRow(r: WeeklyReportRow, labels: WeeklyReportLabels): string {
  return row([
    formatDate(r.date),
    r.addressName,
    r.typeLabel,
    r.status === "done" ? labels.statusDone : labels.statusPending,
    formatDateTime(r.checkedAt),
  ]);
}

export function weeklyReportToPlainText(
  report: WeeklyReport,
  labels: WeeklyReportLabels
): string {
  const lines = [
    `${labels.appName} — ${labels.title}`,
    `${formatDate(report.weekStart)} – ${formatDate(report.weekEnd)}`,
    "",
    `${labels.scheduled}: ${report.scheduled}`,
    `${labels.checkIns}: ${report.checkIns}`,
    `${labels.pending}: ${report.pending}`,
    "",
    labels.byAddress,
    ...report.byAddress.map(
      (a) => `• ${a.addressName}: ${a.checkIns}/${a.scheduled} (${a.pending} ${labels.pending.toLowerCase()})`
    ),
  ];

  const pending = report.rows.filter((r) => r.status === "pending");
  if (pending.length > 0) {
    lines.push("", labels.pendingSection);
    for (const r of pending) {
      lines.push(`• ${formatDate(r.date)} — ${r.addressName} (${r.typeLabel})`);
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
  anchor.download = `relatorio-semanal_${report.weekStart}_${report.weekEnd}.csv`;
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
  const pending = report.rows.filter((r) => r.status === "pending");
  const done = report.rows.filter((r) => r.status === "done");
  const period = `${escapeHtml(formatDate(report.weekStart))} – ${escapeHtml(formatDate(report.weekEnd))}`;

  const addressRows = report.byAddress
    .map(
      (a) =>
        `<tr><td>${escapeHtml(a.addressName)}</td><td>${a.scheduled}</td><td>${a.checkIns}</td><td>${a.pending}</td></tr>`
    )
    .join("");

  const eventTable = (rows: WeeklyReportRow[], showChecked: boolean) =>
    rows
      .map(
        (r) =>
          `<tr>
            <td>${escapeHtml(formatDate(r.date))}</td>
            <td>${escapeHtml(r.addressName)}</td>
            <td>${escapeHtml(r.typeLabel)}</td>
            ${showChecked ? `<td>${escapeHtml(formatDateTime(r.checkedAt))}</td>` : ""}
          </tr>`
      )
      .join("");

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(labels.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; margin: 0; padding: 24px; color: #1a1a1a; font-size: 11pt; }
    header { border-bottom: 2px solid #006a60; padding-bottom: 12px; margin-bottom: 20px; }
    h1 { font-size: 16pt; margin: 0 0 4px; color: #006a60; }
    .meta { color: #555; font-size: 10pt; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat { border: 1px solid #ccc; border-radius: 6px; padding: 12px; text-align: center; }
    .stat .num { font-size: 22pt; font-weight: 700; color: #006a60; display: block; }
    .stat .lbl { font-size: 9pt; color: #666; margin-top: 4px; }
    .stat.pending .num { color: #b3261e; }
    h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.05em; color: #006a60; margin: 20px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #e8f5f3; font-weight: 600; }
    tr:nth-child(even) td { background: #fafafa; }
    footer { margin-top: 24px; font-size: 8pt; color: #888; text-align: center; }
    @media print {
      body { padding: 12px; }
      .stat { break-inside: avoid; }
      table { break-inside: auto; }
      tr { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(labels.appName)} — ${escapeHtml(labels.title)}</h1>
    <p class="meta">${period}</p>
  </header>
  <div class="stats">
    <div class="stat"><span class="num">${report.scheduled}</span><span class="lbl">${escapeHtml(labels.scheduled)}</span></div>
    <div class="stat"><span class="num">${report.checkIns}</span><span class="lbl">${escapeHtml(labels.checkIns)}</span></div>
    <div class="stat pending"><span class="num">${report.pending}</span><span class="lbl">${escapeHtml(labels.pending)}</span></div>
  </div>
  <h2>${escapeHtml(labels.byAddress)}</h2>
  <table>
    <thead><tr><th>${escapeHtml(labels.address)}</th><th>${escapeHtml(labels.scheduled)}</th><th>${escapeHtml(labels.checkIns)}</th><th>${escapeHtml(labels.pending)}</th></tr></thead>
    <tbody>${addressRows}</tbody>
  </table>
  ${
    pending.length
      ? `<h2>${escapeHtml(labels.pendingSection)}</h2>
  <table>
    <thead><tr><th>${escapeHtml(labels.date)}</th><th>${escapeHtml(labels.address)}</th><th>${escapeHtml(labels.type)}</th></tr></thead>
    <tbody>${eventTable(pending, false)}</tbody>
  </table>`
      : ""
  }
  ${
    done.length
      ? `<h2>${escapeHtml(labels.checkInsSection)}</h2>
  <table>
    <thead><tr><th>${escapeHtml(labels.date)}</th><th>${escapeHtml(labels.address)}</th><th>${escapeHtml(labels.type)}</th><th>${escapeHtml(labels.checkedAt)}</th></tr></thead>
    <tbody>${eventTable(done, true)}</tbody>
  </table>`
      : ""
  }
  <footer>${escapeHtml(labels.appName)} · ${period}</footer>
</body>
</html>`;
}

export function printWeeklyReport(report: WeeklyReport, labels: WeeklyReportLabels): void {
  const html = buildReportHtml(report, labels);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.setAttribute(
    "style",
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden"
  );
  iframe.src = url;
  document.body.appendChild(iframe);

  const cleanup = () => {
    URL.revokeObjectURL(url);
    iframe.remove();
  };

  iframe.onload = () => {
    window.setTimeout(() => {
      try {
        const win = iframe.contentWindow;
        if (!win) {
          cleanup();
          return;
        }
        win.focus();
        win.addEventListener("afterprint", cleanup, { once: true });
        win.print();
        window.setTimeout(cleanup, 120_000);
      } catch {
        cleanup();
      }
    }, 300);
  };
}

export function emailWeeklyReport(report: WeeklyReport, labels: WeeklyReportLabels): void {
  const subject = encodeURIComponent(
    `${labels.title} (${formatDate(report.weekStart)} – ${formatDate(report.weekEnd)})`
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
      `relatorio-semanal_${report.weekStart}.csv`,
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
