"use client";

import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { useI18n } from "@/hooks/use-i18n";
import { importFromWebcal } from "@/lib/services/address-service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WebcalImport() {
  const { refresh, settings } = useApp();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!url.trim() || !name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await importFromWebcal(url.trim(), name.trim(), settings.activeProfileId);
      setOpen(false);
      setUrl("");
      setName("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao importar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <Link2 className="h-4 w-4" />
        {t.addresses.importWebcal}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.addresses.importWebcal}</DialogTitle>
            <DialogDescription>
              Cole a URL webcal ou https do calendário de coleta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webcal-url">URL</Label>
              <Input
                id="webcal-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="webcal://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webcal-name">{t.addresses.nameAddress}</Label>
              <Input
                id="webcal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex.: Casa"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={handleImport}
              disabled={loading || !url.trim() || !name.trim()}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.addresses.import}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
