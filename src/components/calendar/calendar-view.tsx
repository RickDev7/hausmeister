"use client";

import { useMemo, useState } from "react";
import { addMonths, format, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { useI18n } from "@/hooks/use-i18n";
import { buildAddressMap } from "@/lib/address-map";
import { enrichCollections } from "@/lib/collections";
import { getCalendarDays, getEventsForMonth, formatMonthYear } from "@/lib/stats";
import { getTypeMeta } from "@/lib/collection-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CalendarView() {
  const { addresses, collections, loading } = useApp();
  const { t } = useI18n();
  const [month, setMonth] = useState(() => new Date());

  const enriched = useMemo(
    () => enrichCollections(collections, buildAddressMap(addresses)),
    [addresses, collections]
  );

  const eventsByDate = useMemo(
    () => getEventsForMonth(enriched, month),
    [enriched, month]
  );

  const days = useMemo(() => getCalendarDays(month), [month]);
  const firstWeekday = days[0]?.getDay() ?? 0;
  const padding = firstWeekday === 0 ? 6 : firstWeekday - 1;

  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMonth((m) => subMonths(m, 1))}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-base font-semibold capitalize">{formatMonthYear(month)}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: padding }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(dateKey) ?? [];
          const isToday = dateKey === format(new Date(), "yyyy-MM-dd");

          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-14 rounded-xl p-1 text-xs",
                isToday ? "bg-primary-container" : "bg-surface-container-lowest",
                dayEvents.length > 0 && "ring-1 ring-outline-variant"
              )}
            >
              <span className={cn("block text-center font-medium", isToday && "text-on-primary-container")}>
                {format(day, "d")}
              </span>
              <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <span key={e.id} title={e.typeLabel} role="img" aria-label={e.typeLabel}>
                    {getTypeMeta(e.type).icon}
                  </span>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {eventsByDate.size === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {t.home.noFilterResults}
        </p>
      )}
    </div>
  );
}
