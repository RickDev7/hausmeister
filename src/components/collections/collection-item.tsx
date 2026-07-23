"use client";

import { useState } from "react";
import { Check, CheckCircle2, Undo2, XCircle } from "lucide-react";
import { getTypeMeta } from "@/lib/collection-types";
import { getCollectionTypeLabel } from "@/lib/waste-type-labels";
import { formatExportDate } from "@/lib/format-locale";
import type { EnrichedCollection } from "@/lib/collections";
import { useApp } from "@/hooks/use-app";
import { useI18n } from "@/hooks/use-i18n";
import { CheckInDialog, type CheckInDialogMode } from "@/components/collections/check-in-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CollectionItemProps {
  event: EnrichedCollection;
  showDate?: boolean;
}

export function CollectionItem({ event, showDate = false }: CollectionItemProps) {
  const {
    completedEventIds,
    missedEventIds,
    checkInForEvent,
    missedCollectionForEvent,
    undoCheckInForEvent,
    settings,
  } = useApp();
  const { t, locale } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<CheckInDialogMode>("completed");

  const isCompleted = completedEventIds.has(event.id);
  const isMissed = missedEventIds.has(event.id);
  const isResolved = isCompleted || isMissed;
  const meta = getTypeMeta(event.type);
  const typeLabel = getCollectionTypeLabel(event.type, t);
  const compact = settings.viewMode === "compact";

  const openDialog = (mode: CheckInDialogMode) => {
    setDialogMode(mode);
    setDialogOpen(true);
  };

  const handleCheckIn = async () => {
    if (isResolved || submitting) return;
    if (settings.viewMode === "detailed") {
      openDialog("completed");
      return;
    }
    setSubmitting(true);
    try {
      await checkInForEvent(event);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMissed = () => {
    if (isResolved || submitting) return;
    openDialog("missed");
  };

  const handleConfirmDialog = async (note?: string, photoDataUrl?: string) => {
    if (dialogMode === "missed") {
      if (!note?.trim()) return;
      await missedCollectionForEvent(event, note.trim());
      return;
    }
    await checkInForEvent(event, { note, photoDataUrl });
  };

  const handleUndo = async () => {
    if (!isResolved || submitting) return;
    setSubmitting(true);
    try {
      await undoCheckInForEvent(event.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-4 transition-colors",
          compact ? "py-2" : "py-3",
          isResolved ? "opacity-75" : "hover:bg-surface-container"
        )}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-7 w-7 shrink-0 text-primary" aria-label={t.checkIn.done} />
        ) : isMissed ? (
          <XCircle className="h-7 w-7 shrink-0 text-destructive" aria-label={t.checkIn.missedDone} />
        ) : (
          <span className={cn("shrink-0", compact ? "text-xl" : "text-2xl")} role="img" aria-label={typeLabel}>
            {meta.icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate font-medium",
              isResolved && "line-through text-muted-foreground"
            )}
          >
            {event.addressName}
          </p>
          {!compact && (
            <div className="mt-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={event.type} className={cn(event.type === "gelbe_tonne" && "text-foreground")}>
                  {typeLabel}
                </Badge>
                {isCompleted && (
                  <Badge variant="secondary" className="gap-1 bg-primary-container text-on-primary-container">
                    <Check className="h-3 w-3" />
                    {t.checkIn.done}
                  </Badge>
                )}
                {isMissed && (
                  <Badge variant="outline" className="gap-1 border-destructive/40 bg-destructive/10 text-destructive">
                    <XCircle className="h-3 w-3" />
                    {t.checkIn.missedDone}
                  </Badge>
                )}
              </div>
              <div className="space-y-0.5 text-xs text-muted-foreground">
                <p>
                  {t.checkIn.putOutDate}: {formatExportDate(event.putOutDate, locale)}
                </p>
                <p>
                  {t.checkIn.collectionDate}: {formatExportDate(event.collectionDate, locale)}
                </p>
              </div>
            </div>
          )}
          {compact && showDate && (
            <span className="text-xs text-muted-foreground">
              {formatExportDate(event.putOutDate, locale)}
            </span>
          )}
        </div>
        {isResolved ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUndo}
            disabled={submitting}
            className="shrink-0 text-muted-foreground"
            title={t.checkIn.undo}
            aria-label={t.checkIn.undo}
          >
            <Undo2 className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">{t.checkIn.undo}</span>
          </Button>
        ) : (
          <div className="flex shrink-0 flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckIn}
              disabled={submitting}
              aria-label={t.checkIn.action}
            >
              {submitting && dialogMode === "completed" ? "..." : t.checkIn.action}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMissed}
              disabled={submitting}
              className="text-destructive hover:text-destructive"
              aria-label={t.checkIn.missed}
            >
              {t.checkIn.missed}
            </Button>
          </div>
        )}
      </div>

      <CheckInDialog
        event={event}
        mode={dialogMode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmDialog}
      />
    </>
  );
}

interface CollectionGroupProps {
  title: string;
  events: EnrichedCollection[];
  showDate?: boolean;
  emptyMessage?: string;
}

export function CollectionGroup({
  title,
  events,
  showDate = false,
  emptyMessage,
}: CollectionGroupProps) {
  if (events.length === 0 && !emptyMessage) return null;

  return (
    <section className="space-y-2" aria-labelledby={`group-${title}`}>
      <h2 id={`group-${title}`} className="px-1 text-sm font-semibold uppercase tracking-wider text-primary">
        {title}
      </h2>
      {events.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="space-y-1">
          {events.map((event) => (
            <CollectionItem key={event.id} event={event} showDate={showDate} />
          ))}
        </div>
      )}
    </section>
  );
}
