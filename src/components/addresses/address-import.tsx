"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { parseIcsFile, suggestAddressName } from "@/lib/ics-parser";
import {
  filterIcsFiles,
  importMultipleAddresses,
  importNewAddress,
} from "@/lib/services/address-service";
import { generateId } from "@/lib/utils";
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

interface PendingImport {
  file: File;
  suggestedName: string;
  eventCount: number;
  addressId: string;
}

export function AddressImport() {
  const { refresh } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [name, setName] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const icsFiles = filterIcsFiles(files);
    if (icsFiles.length === 0) return;

    setImporting(true);
    try {
      if (icsFiles.length === 1) {
        const file = icsFiles[0];
        const addressId = generateId();
        const content = await file.text();
        const events = parseIcsFile(content, addressId);

        setPending({
          file,
          suggestedName: suggestAddressName(file.name),
          eventCount: events.length,
          addressId,
        });
        setName(suggestAddressName(file.name));
      } else {
        await importMultipleAddresses(icsFiles);
        await refresh();
      }
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const confirmImport = async () => {
    if (!pending || !name.trim()) return;
    setImporting(true);
    try {
      await importNewAddress(pending.file, name.trim(), pending.addressId);
      setPending(null);
      setName("");
      await refresh();
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".ics,text/calendar"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <Button
        onClick={() => inputRef.current?.click()}
        disabled={importing}
        className="w-full"
      >
        {importing && !pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileUp className="h-4 w-4" />
        )}
        Importar arquivo .ics
      </Button>

      <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nomear endereço</DialogTitle>
            <DialogDescription>
              {pending && (
                <>
                  {pending.eventCount} coletas encontradas em &quot;{pending.file.name}&quot;.
                  Digite um nome para este endereço.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address-name">Nome do endereço</Label>
              <Input
                id="address-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex.: Rua Principal, 15"
                onKeyDown={(e) => e.key === "Enter" && confirmImport()}
              />
            </div>
            <Button onClick={confirmImport} disabled={!name.trim() || importing} className="w-full">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
