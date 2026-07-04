"use client";

import { AppHeader } from "@/components/layout/app-header";
import { HistoryStats } from "@/components/history/history-stats";
import { WeeklyReportCard } from "@/components/history/weekly-report-card";
import { CheckInHistory } from "@/components/history/check-in-history";
import { useI18n } from "@/hooks/use-i18n";

export function HistoryPageContent() {
  const { t } = useI18n();

  return (
    <>
      <AppHeader title={t.history.title} subtitle={t.history.subtitle} />
      <div className="space-y-4 py-4">
        <WeeklyReportCard />
        <HistoryStats />
        <CheckInHistory />
      </div>
    </>
  );
}
