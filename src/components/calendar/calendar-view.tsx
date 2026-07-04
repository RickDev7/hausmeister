"use client";

import { useMemo, useState } from "react";
import { addMonths, format, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { useI18n } from "@/hooks/use-i18n";
import { buildAddressMap } from "@/lib/address-map";
import { buildAddressColorMap, getAddressColor } from "@/lib/address-colors";
import { enrichCollections, type EnrichedCollection } from "@/lib/collections";
import { getCalendarDays, getEventsForMonth } from "@/lib/stats";
import { formatLongDate, formatMonthYear, getWeekdayLabels } from "@/lib/format-locale";
import { getTypeMeta } from "@/lib/collection-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MAX_EVENTS_IN_CELL = 4;

export function CalendarView() {
  const { addresses, collections, loading } = useApp();
  const { t, locale } = useI18n();
  const [month, setMonth] = useState(() => new Date());
  const [filterAddressId, setFilterAddressId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const colorMap = useMemo(() => buildAddressColorMap(addresses), [addresses]);

  const enriched = useMemo(
    () => enrichCollections(collections, buildAddressMap(addresses)),
    [addresses, collections]
  );

  const filteredEnriched = useMemo(() => {
    if (!filterAddressId) return enriched;
    return enriched.filter((e) => e.addressId === filterAddressId);
  }, [enriched, filterAddressId]);

  const eventsByDate = useMemo(
    () => getEventsForMonth(filteredEnriched, month),
    [filteredEnriched, month]
  );

  const days = useMemo(() => getCalendarDays(month), [month]);
  const firstWeekday = days[0]?.getDay() ?? 0;
  const padding = firstWeekday === 0 ? 6 : firstWeekday - 1;

  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);

  const monthLabel = formatMonthYear(month, locale);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return (eventsByDate.get(selectedDate) ?? []) as EnrichedCollection[];
  }, [eventsByDate, selectedDate]);

  const selectedDayLabel = selectedDate ? formatLongDate(selectedDate, locale) : "";

  if (loading) return null;

  const showLegend = addresses.length > 1;

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMonth((m) => subMonths(m, 1))}
          aria-label={t.calendar.prevMonth}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-base font-semibold capitalize">{monthLabel}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          aria-label={t.calendar.nextMonth}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {showLegend && (
        <div className="space-y-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t.calendar.legend}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterAddressId(null)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                filterAddressId === null
                  ? "border-primary bg-primary-container text-on-primary-container"
                  : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container"
              )}
            >
              {t.filters.allAddresses}
            </button>
            {addresses.map((address) => {
              const color = getAddressColor(address.id, colorMap);
              const active = filterAddressId === address.id;
              return (
                <button
                  key={address.id}
                  type="button"
                  onClick={() =>
                    setFilterAddressId((current) =>
                      current === address.id ? null : address.id
                    )
                  }
                  className={cn(
                    "flex max-w-[10rem] items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? ""
                      : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container"
                  )}
                  style={
                    active
                      ? {
                          borderColor: color.main,
                          backgroundColor: color.light,
                          color: color.main,
                        }
                      : undefined
                  }
                  title={address.name}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color.main }}
                    aria-hidden
                  />
                  <span className="truncate">{address.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {weekdayLabels.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: padding }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = (eventsByDate.get(dateKey) ?? []) as EnrichedCollection[];
          const isToday = dateKey === format(new Date(), "yyyy-MM-dd");
          const isSelected = selectedDate === dateKey;
          const hasEvents = dayEvents.length > 0;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => hasEvents && setSelectedDate(dateKey)}
              disabled={!hasEvents}
              aria-label={
                hasEvents
                  ? `${format(day, "d")} — ${dayEvents.length} ${t.calendar.collectionsCount}`
                  : format(day, "d")
              }
              className={cn(
                "min-h-[4.5rem] rounded-xl p-1 text-left text-xs transition-colors",
                isToday ? "bg-primary-container" : "bg-surface-container-lowest",
                hasEvents && "cursor-pointer hover:ring-2 hover:ring-primary/40",
                hasEvents && "ring-1 ring-outline-variant",
                isSelected && "ring-2 ring-primary",
                !hasEvents && "cursor-default opacity-80"
              )}
            >
              <span
                className={cn(
                  "block text-center font-medium",
                  isToday && "text-on-primary-container"
                )}
              >
                {format(day, "d")}
              </span>
              {hasEvents && (
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, MAX_EVENTS_IN_CELL).map((event) => {
                    const color = getAddressColor(event.addressId, colorMap);
                    const meta = getTypeMeta(event.type);
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-0.5 overflow-hidden rounded-sm"
                        title={`${event.addressName} — ${event.typeLabel}`}
                      >
                        <span
                          className="w-1 shrink-0 self-stretch rounded-full"
                          style={{ backgroundColor: color.main }}
                          aria-hidden
                        />
                        <span className="truncate text-[9px] leading-tight" aria-hidden>
                          {meta.icon}
                        </span>
                        {showLegend && (
                          <span
                            className="truncate text-[8px] leading-tight text-muted-foreground"
                            style={{ color: isToday ? undefined : color.main }}
                          >
                            {event.addressName.split(/[\s,]+/)[0]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {dayEvents.length > MAX_EVENTS_IN_CELL && (
                    <span className="block text-center text-[10px] text-muted-foreground">
                      +{dayEvents.length - MAX_EVENTS_IN_CELL}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {eventsByDate.size === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {filterAddressId ? t.home.noFilterResults : t.calendar.noEventsMonth}
        </p>
      )}

      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">{selectedDayLabel}</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2">
            {selectedDayEvents
              .sort(
                (a, b) =>
                  a.addressName.localeCompare(b.addressName) ||
                  a.typeLabel.localeCompare(b.typeLabel)
              )
              .map((event) => {
                const color = getAddressColor(event.addressId, colorMap);
                const meta = getTypeMeta(event.type);
                return (
                  <li
                    key={event.id}
                    className="flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3"
                    style={{ borderLeftWidth: 4, borderLeftColor: color.main }}
                  >
                    <span className="text-xl" role="img" aria-label={meta.label}>
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{event.addressName}</p>
                      <Badge
                        variant={event.type}
                        className={cn(
                          "mt-1",
                          event.type === "gelbe_tonne" && "text-foreground"
                        )}
                      >
                        {event.typeLabel}
                      </Badge>
                    </div>
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: color.main }}
                      title={event.addressName}
                      aria-hidden
                    />
                  </li>
                );
              })}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
