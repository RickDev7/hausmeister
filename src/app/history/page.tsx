import { AppHeader } from "@/components/layout/app-header";
import { CheckInHistory } from "@/components/history/check-in-history";

export default function HistoryPage() {
  return (
    <>
      <AppHeader title="Histórico" subtitle="Check-ins de coleta" />
      <div className="py-4">
        <CheckInHistory />
      </div>
    </>
  );
}
