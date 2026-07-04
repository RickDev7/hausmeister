"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
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

interface CheckInDialogProps {
  event: EnrichedCollection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note?: string, photoDataUrl?: string) => Promise<void>;
}

export function CheckInDialog({ event, open, onOpenChange, onConfirm }: CheckInDialogProps) {
  const { t } = useI18n();
  const [note, setNote] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.checkIn.confirm}</DialogTitle>
          <DialogDescription>
            {event && `${event.addressName} — ${event.typeLabel}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checkin-note">{t.checkIn.note}</Label>
            <Input
              id="checkin-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="..."
            />
          </div>
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
              {photoPreview ? "Alterar foto" : t.checkIn.photo}
            </Button>
            {photoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="" className="max-h-32 rounded-xl object-cover" />
            )}
          </div>
          <Button onClick={handleConfirm} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t.checkIn.confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
