"use client";

import { useMemo, useState } from "react";
import { FolderOpen, Undo2 } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { useI18n } from "@/hooks/use-i18n";
import {
  filterCheckIns,
  groupCheckInsByDate,
  getUniqueAddressNames,
  type CheckInFilters,
} from "@/lib/check-ins";
import { formatCheckInDate, formatCheckInTime } from "@/lib/format-locale";
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
import { X } from "lucide-react";

export function CheckInHistory() {
  const { checkIns, loading } = useApp();
  const { locale } = useI18n();
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
          <p className="font-medium">Nenhum check-in ainda</p>
          <p className="text-sm text-muted-foreground">
            Marque coletas como feitas na visão geral para vê-las aqui.
          </p>
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
            <SelectValue placeholder="Endereço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os endereços</SelectItem>
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
            <SelectValue placeholder="Tipo de lixo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {WASTE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
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
          Limpar filtros
        </Button>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum check-in encontrado para os filtros selecionados.
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
  const [submitting, setSubmitting] = useState(false);

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
        <p className="truncate font-medium">
          {checkIn.addressName} — {checkIn.wasteType}
        </p>
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
        title="Desfazer check-in"
        className="shrink-0 text-muted-foreground"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
