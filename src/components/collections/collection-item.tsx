"use client";

import { useState } from "react";
import { Check, CheckCircle2, Undo2 } from "lucide-react";
import { getTypeMeta } from "@/lib/collection-types";
import type { EnrichedCollection } from "@/lib/collections";
import { useApp } from "@/hooks/use-app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CollectionItemProps {
  event: EnrichedCollection;
  showDate?: boolean;
}

export function CollectionItem({ event, showDate = false }: CollectionItemProps) {
  const { checkedEventIds, checkInForEvent, undoCheckInForEvent } = useApp();
  const [submitting, setSubmitting] = useState(false);
  const isCompleted = checkedEventIds.has(event.id);
  const meta = getTypeMeta(event.type);

  const handleCheckIn = async () => {
    if (isCompleted || submitting) return;
    setSubmitting(true);
    try {
      await checkInForEvent(event);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!isCompleted || submitting) return;
    setSubmitting(true);
    try {
      await undoCheckInForEvent(event.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3 transition-colors",
        isCompleted ? "opacity-75" : "hover:bg-surface-container"
      )}
    >
      {isCompleted ? (
        <CheckCircle2 className="h-7 w-7 shrink-0 text-primary" aria-label="Concluído" />
      ) : (
        <span className="text-2xl shrink-0" role="img" aria-label={meta.label}>
          {meta.icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-medium", isCompleted && "line-through text-muted-foreground")}>
          {event.addressName}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant={event.type} className={cn(event.type === "gelbe_tonne" && "text-foreground")}>
            {event.typeLabel}
          </Badge>
          {isCompleted && (
            <Badge variant="secondary" className="gap-1 bg-primary-container text-on-primary-container">
              <Check className="h-3 w-3" />
              Concluído
            </Badge>
          )}
          {showDate && (
            <span className="text-xs text-muted-foreground">{event.date}</span>
          )}
        </div>
      </div>
      {isCompleted ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleUndo}
          disabled={submitting}
          className="shrink-0 text-muted-foreground"
          title="Desfazer check-in"
        >
          <Undo2 className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Desfazer</span>
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={handleCheckIn}
          disabled={submitting}
          className="shrink-0"
        >
          {submitting ? "..." : "Check-in"}
        </Button>
      )}
    </div>
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
    <section className="space-y-2">
      <h2 className="px-1 text-sm font-semibold uppercase tracking-wider text-primary">
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
