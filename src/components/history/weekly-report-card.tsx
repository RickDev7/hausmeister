"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileText, Mail, Share2 } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { useI18n } from "@/hooks/use-i18n";
import { buildAddressMap } from "@/lib/address-map";
import { formatWeekRange } from "@/lib/format-locale";
import { getCollectionTypeLabel } from "@/lib/waste-type-labels";
import {
  downloadWeeklyReportCsv,
  emailWeeklyReport,
  printWeeklyReport,
  shareWeeklyReport,
  type WeeklyReportLabels,
} from "@/lib/weekly-report-export";
import { computeWeeklyReport, shiftWeek, type WeeklyReport } from "@/lib/weekly-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function localizeReport(
  report: WeeklyReport,
  typeByEventId: Map<string, Parameters<typeof getCollectionTypeLabel>[0]>,
  t: Parameters<typeof getCollectionTypeLabel>[1]
): WeeklyReport {
  return {
    ...report,
    rows: report.rows.map((row) => ({
      ...row,
      typeLabel: getCollectionTypeLabel(typeByEventId.get(row.eventId) ?? "unknown", t),
    })),
  };
}

export function WeeklyReportCard() {
  const { collections, checkIns, addresses, loading } = useApp();
  const { t, locale } = useI18n();
  const [weekRef, setWeekRef] = useState(() => new Date());

  const addressMap = useMemo(() => buildAddressMap(addresses), [addresses]);

  const typeByEventId = useMemo(
    () => new Map(collections.map((c) => [c.id, c.type])),
    [collections]
  );

  const report = useMemo(() => {
    const base = computeWeeklyReport(collections, checkIns, addressMap, weekRef);
    return localizeReport(base, typeByEventId, t);
  }, [collections, checkIns, addressMap, weekRef, typeByEventId, t]);

  const weekLabel = formatWeekRange(report.weekStart, report.weekEnd, locale);

  const labels: WeeklyReportLabels = useMemo(
    () => ({
      locale,
      appName: t.appName,
      title: t.history.report.title,
      scheduled: t.history.report.scheduled,
      checkIns: t.history.report.checkIns,
      missed: t.history.report.missed,
      pending: t.history.report.pending,
      compliance: t.history.report.compliance,
      byAddress: t.history.report.byAddress,
      address: t.history.report.address,
      date: t.history.report.date,
      type: t.history.report.type,
      status: t.history.report.status,
      statusDone: t.history.report.statusDone,
      statusMissed: t.history.report.statusMissed,
      statusPending: t.history.report.statusPending,
      checkedAt: t.history.report.checkedAt,
      note: t.history.report.note,
      pendingSection: t.history.report.pendingSection,
      missedSection: t.history.report.missedSection,
      checkInsSection: t.history.report.checkInsSection,
      period: t.history.report.period,
      value: t.history.report.value,
      allEvents: t.history.report.allEvents,
      printHint: t.history.report.printHint,
      printButton: t.history.report.printButton,
      fileName: t.history.report.fileName,
      addressSummary: t.history.report.addressSummary,
      pendingLine: t.history.report.pendingLine,
      missedLine: t.history.report.missedLine,
    }),
    [t, locale]
  );

  if (loading || addresses.length === 0) return null;

  const summaryText = t.history.report.summary
    .replace("{scheduled}", String(report.scheduled))
    .replace("{checkIns}", String(report.checkIns))
    .replace("{missed}", String(report.missed))
    .replace("{pending}", String(report.pending))
    .replace("{compliance}", String(report.complianceRate));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            {t.history.report.title}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekRef((d) => shiftWeek(d, -1))}
              aria-label={t.history.report.prevWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekRef((d) => shiftWeek(d, 1))}
              aria-label={t.history.report.nextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm capitalize text-muted-foreground">{weekLabel}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.scheduled === 0 ? (
          <p className="text-center text-sm text-muted-foreground">{t.history.report.noData}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{summaryText}</p>
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              <div className="rounded-2xl bg-surface-container-lowest p-3">
                <p className="text-2xl font-bold tabular-nums">{report.scheduled}</p>
                <p className="text-xs text-muted-foreground">{t.history.report.scheduled}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-lowest p-3">
                <p className="text-2xl font-bold tabular-nums text-primary">{report.checkIns}</p>
                <p className="text-xs text-muted-foreground">{t.history.report.checkIns}</p>
              </div>
              <div className="rounded-2xl bg-orange-100 p-3 dark:bg-orange-950/40">
                <p className="text-2xl font-bold tabular-nums text-orange-800 dark:text-orange-200">
                  {report.missed}
                </p>
                <p className="text-xs text-orange-800 dark:text-orange-200">{t.history.report.missed}</p>
              </div>
              <div className="rounded-2xl bg-error-container p-3">
                <p className="text-2xl font-bold tabular-nums text-on-error-container">
                  {report.pending}
                </p>
                <p className="text-xs text-on-error-container">{t.history.report.pending}</p>
              </div>
            </div>
            <p className="text-center text-sm font-medium text-primary">
              {t.history.report.compliance}: {report.complianceRate}%
            </p>

            {report.byAddress.length > 1 && (
              <ul className="space-y-1 text-sm">
                {report.byAddress.map((a) => (
                  <li
                    key={a.addressName}
                    className="flex justify-between gap-2 rounded-xl bg-surface-container-lowest px-3 py-2"
                  >
                    <span className="truncate font-medium">{a.addressName}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {a.checkIns}/{a.scheduled}
                      {a.missed > 0 && ` · ${a.missed} ✗`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={report.scheduled === 0}
            onClick={() => downloadWeeklyReportCsv(report, labels)}
          >
            <Download className="h-4 w-4" />
            {t.history.report.excel}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={report.scheduled === 0}
            onClick={() => printWeeklyReport(report, labels)}
          >
            <FileText className="h-4 w-4" />
            {t.history.report.pdf}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={report.scheduled === 0}
            onClick={() => emailWeeklyReport(report, labels)}
          >
            <Mail className="h-4 w-4" />
            {t.history.report.email}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={report.scheduled === 0}
            onClick={() => shareWeeklyReport(report, labels)}
          >
            <Share2 className="h-4 w-4" />
            {t.history.report.share}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
