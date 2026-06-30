"use client";

import { Search, X } from "lucide-react";
import { getAllCollectionTypes } from "@/lib/collection-types";
import { hasActiveCollectionFilters, type CollectionFilters } from "@/lib/collections";
import type { Address } from "@/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface CollectionFiltersBarProps {
  filters: CollectionFilters;
  addresses: Address[];
  onChange: (filters: CollectionFilters) => void;
}

export function CollectionFiltersBar({
  filters,
  addresses,
  onChange,
}: CollectionFiltersBarProps) {
  const types = getAllCollectionTypes();
  const hasActiveFilters = hasActiveCollectionFilters(filters);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar endereço..."
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select
          value={filters.addressId ?? "all"}
          onValueChange={(v) =>
            onChange({ ...filters, addressId: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Endereço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os endereços</SelectItem>
            {addresses.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.type ?? "all"}
          onValueChange={(v) =>
            onChange({ ...filters, type: v === "all" ? undefined : (v as CollectionFilters["type"]) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipo de lixo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {types.map((t) => (
              <SelectItem key={t.type} value={t.type}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) =>
            onChange({ ...filters, dateFrom: e.target.value || undefined })
          }
          aria-label="Data inicial"
        />
        <Input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) =>
            onChange({ ...filters, dateTo: e.target.value || undefined })
          }
          aria-label="Data final"
        />
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ search: filters.search })}
          className="w-full"
        >
          <X className="h-4 w-4" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
