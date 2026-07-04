import { AppHeader } from "@/components/layout/app-header";
import { CalendarView } from "@/components/calendar/calendar-view";

export default function CalendarPage() {
  return (
    <>
      <AppHeader title="Calendário" subtitle="Visão mensal das coletas" />
      <CalendarView />
    </>
  );
}
