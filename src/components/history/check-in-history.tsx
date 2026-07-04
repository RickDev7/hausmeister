"use client";

import { useMemo, useState } from "react";
import { FolderOpen, Undo2, XCircle } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { useI18n } from "@/hooks/use-i18n";
import {
  filterCheckIns,
  groupCheckInsByDate,
  getUniqueAddressNames,
  type CheckInFilters,
} from "@/lib/check-ins";
import { formatCheckInDate, formatCheckInTime } from "@/lib/format-locale";
import { getWasteTypeLabel } from "@/lib/waste-type-labels";
import { WASTE_TYPES, type CheckIn } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export function CheckInHistory() {
  const { checkIns, loading } = useApp();
  const { locale, t } = useI18n();
  const [filters, setFilters] = useState<CheckInFilters>({});

  const filtered = useMemo(() => filterCheckIns(checkIns, filters), [checkIns, filters]);
  const grouped = useMemo(() => groupCheckInsByDate(filtered), [filtered]);
  const addressNames = useMemo(() => getUniqueAddressNames(checkIns), [checkIns]);

  const hasActiveFilters = Boolean(filters.wasteType || filters.addressName);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (checkIns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground" />
          <p className="font-medium">{t.history.empty}</p>
          <p className="text-sm text-muted-foreground">{t.history.emptyHint}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={filters.addressName ?? "all"}
          onValueChange={(v) =>
            setFilters({ ...filters, addressName: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t.history.filterAddress} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.filters.allAddresses}</SelectItem>
            {addressNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.wasteType ?? "all"}
          onValueChange={(v) =>
            setFilters({
              ...filters,
              wasteType: v === "all" ? undefined : (v as CheckInFilters["wasteType"]),
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t.history.filterType} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.filters.allTypes}</SelectItem>
            {WASTE_TYPES.map((wt) => (
              <SelectItem key={wt} value={wt}>
                {getWasteTypeLabel(wt, t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFilters({})}
          className="w-full"
        >
          <X className="h-4 w-4" />
          {t.filters.clear}
        </Button>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t.history.noFilterResults}
        </p>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateKey, items]) => (
            <section key={dateKey} className="space-y-2">
              <h2 className="px-1 text-sm font-semibold text-primary">
                {formatCheckInDate(items[0].checkedAt, locale)}
              </h2>
              <div className="space-y-1">
                {items.map((checkIn) => (
                  <CheckInHistoryItem key={checkIn.id} checkIn={checkIn} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckInHistoryItem({ checkIn }: { checkIn: CheckIn }) {
  const { undoCheckInForEvent } = useApp();
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const isMissed = checkIn.status === "missed";
  const wasteLabel = getWasteTypeLabel(checkIn.wasteType, t);

  const handleUndo = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await undoCheckInForEvent(checkIn.collectionEventId);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">
            {checkIn.addressName} — {wasteLabel}
          </p>
          {isMissed && (
            <Badge variant="outline" className="gap-1 shrink-0 border-destructive/40 bg-destructive/10 text-destructive">
              <XCircle className="h-3 w-3" />
              {t.checkIn.missedDone}
            </Badge>
          )}
        </div>
        {checkIn.note && (
          <p className="truncate text-xs text-muted-foreground">{checkIn.note}</p>
        )}
      </div>
      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
        {formatCheckInTime(checkIn.checkedAt)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleUndo}
        disabled={submitting}
        title={t.checkIn.undo}
        aria-label={t.checkIn.undo}
        className="shrink-0 text-muted-foreground"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
