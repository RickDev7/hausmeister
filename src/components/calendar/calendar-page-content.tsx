"use client";

import { AppHeader } from "@/components/layout/app-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { useI18n } from "@/hooks/use-i18n";

export function CalendarPageContent() {
  const { t } = useI18n();

  return (
    <>
      <AppHeader title={t.calendar.title} subtitle={t.calendar.subtitle} />
      <CalendarView />
    </>
  );
}
