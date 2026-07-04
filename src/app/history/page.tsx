import { AppHeader } from "@/components/layout/app-header";
import { HistoryStats } from "@/components/history/history-stats";
import { CheckInHistory } from "@/components/history/check-in-history";

export default function HistoryPage() {
  return (
    <>
      <AppHeader title="Histórico" subtitle="Check-ins de coleta" />
      <div className="space-y-4 py-4">
        <HistoryStats />
        <CheckInHistory />
      </div>
    </>
  );
}
