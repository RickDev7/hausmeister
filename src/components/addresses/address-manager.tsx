"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, Calendar, MapPin } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { saveAddress } from "@/lib/db";
import { buildAddressColorMap, getAddressColor } from "@/lib/address-colors";
import { reimportAddress, removeAddress } from "@/lib/services/address-service";
import type { Address } from "@/types";
import { AddressImport } from "@/components/addresses/address-import";
import { WebcalImport } from "@/components/addresses/webcal-import";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function AddressManager() {
  const { addresses, collections, loading, refresh } = useApp();
  const [editing, setEditing] = useState<Address | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);

  const colorMap = useMemo(() => buildAddressColorMap(addresses), [addresses]);

  const getEventCount = (addressId: string) =>
    collections.filter((c) => c.addressId === addressId).length;

  const handleEdit = (address: Address) => {
    setEditing(address);
    setEditName(address.name);
  };

  const saveEdit = async () => {
    if (!editing || !editName.trim()) return;
    setSaving(true);
    try {
      await saveAddress({
        ...editing,
        name: editName.trim(),
        updatedAt: new Date().toISOString(),
      });
      setEditing(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await removeAddress(deleting.id);
      setDeleting(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleReimport = async (address: Address, file: File) => {
    await reimportAddress(address, file);
    await refresh();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <AddressImport />
      <WebcalImport />

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground" />
            <p className="font-medium">Nenhum endereço ainda</p>
            <p className="text-sm text-muted-foreground">
              Envie arquivos .ics de calendário do seu serviço de coleta.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => {
            const color = getAddressColor(address.id, colorMap);
            return (
            <Card key={address.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: color.light, color: color.main }}
                >
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{address.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {getEventCount(address.id)} coletas
                  </p>
                </div>
                <div className="flex gap-1">
                  <label className="inline-flex cursor-pointer">
                    <input
                      type="file"
                      accept=".ics,text/calendar"
                      className="sr-only"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) await handleReimport(address, file);
                        e.target.value = "";
                      }}
                    />
                    <Button variant="ghost" size="icon" type="button" title="Reimportar">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </label>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(address)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleting(address)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar endereço</DialogTitle>
            <DialogDescription>Altere o nome deste endereço.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do endereço</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              />
            </div>
            <Button onClick={saveEdit} disabled={!editName.trim() || saving} className="w-full">
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir endereço?</DialogTitle>
            <DialogDescription>
              &quot;{deleting?.name}&quot; e todas as coletas associadas serão excluídos
              permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={saving} className="flex-1">
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
