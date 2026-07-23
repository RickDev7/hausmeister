"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { getCollectionTypeLabel } from "@/lib/waste-type-labels";
import { formatExportDate } from "@/lib/format-locale";
import type { EnrichedCollection } from "@/lib/collections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type CheckInDialogMode = "completed" | "missed";

interface CheckInDialogProps {
  event: EnrichedCollection | null;
  mode: CheckInDialogMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note?: string, photoDataUrl?: string) => Promise<void>;
}

export function CheckInDialog({
  event,
  mode,
  open,
  onOpenChange,
  onConfirm,
}: CheckInDialogProps) {
  const { t, locale } = useI18n();
  const [note, setNote] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isMissed = mode === "missed";
  const typeLabel = event ? getCollectionTypeLabel(event.type, t) : "";

  const handlePhoto = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (isMissed && !note.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(note.trim() || undefined, photoPreview ?? undefined);
      setNote("");
      setPhotoPreview(null);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setNote("");
      setPhotoPreview(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isMissed ? t.checkIn.missedConfirm : t.checkIn.confirm}</DialogTitle>
          <DialogDescription>
            {event && `${event.addressName} — ${typeLabel}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {event && (
            <div className="rounded-2xl bg-surface-container-lowest px-3 py-2 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">{t.checkIn.putOutDate}: </span>
                {formatExportDate(event.putOutDate, locale)}
              </p>
              <p>
                <span className="text-muted-foreground">{t.checkIn.collectionDate}: </span>
                {formatExportDate(event.collectionDate, locale)}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="checkin-note">
              {isMissed ? t.checkIn.missedReason : t.checkIn.note}
            </Label>
            <Input
              id="checkin-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isMissed ? t.checkIn.missedReasonPlaceholder : "..."}
            />
            {isMissed && !note.trim() && (
              <p className="text-xs text-muted-foreground">{t.checkIn.missedReasonRequired}</p>
            )}
          </div>
          {!isMissed && (
            <div className="space-y-2">
              <Label>{t.checkIn.photo}</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                {photoPreview ? t.checkIn.changePhoto : t.checkIn.photo}
              </Button>
              {photoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="" className="max-h-32 rounded-xl object-cover" />
              )}
            </div>
          )}
          <Button
            onClick={handleConfirm}
            disabled={submitting || (isMissed && !note.trim())}
            className="w-full"
            variant={isMissed ? "destructive" : "default"}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isMissed ? (
              t.checkIn.missedConfirm
            ) : (
              t.checkIn.confirm
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
