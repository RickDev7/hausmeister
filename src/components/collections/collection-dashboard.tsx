"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { buildAddressMap } from "@/lib/address-map";
import {
  enrichCollections,
  filterCollections,
  groupByDate,
  groupCollections,
  formatCollectionDate,
  type CollectionFilters,
} from "@/lib/collections";
import { CollectionFiltersBar } from "@/components/collections/collection-filters";
import { CollectionGroup, CollectionItem } from "@/components/collections/collection-item";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function CollectionDashboard() {
  const { addresses, collections, loading } = useApp();
  const [filters, setFilters] = useState<CollectionFilters>({});

  const enriched = useMemo(() => {
    return enrichCollections(collections, buildAddressMap(addresses));
  }, [addresses, collections]);

  const filtered = useMemo(
    () => filterCollections(enriched, filters),
    [enriched, filters]
  );

  const grouped = useMemo(() => groupCollections(filtered), [filtered]);
  const upcomingByDate = useMemo(() => groupByDate(grouped.upcoming), [grouped.upcoming]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (addresses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium">Bem-vindo ao Planejador de Lixo!</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Importe arquivos .ics do seu serviço de coleta em &quot;Endereços&quot; para
            ver suas datas de coleta.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <CollectionFiltersBar
        filters={filters}
        addresses={addresses}
        onChange={setFilters}
      />

      <CollectionGroup
        title="Hoje"
        events={grouped.today}
        emptyMessage="Sem coleta hoje"
      />

      <CollectionGroup
        title="Amanhã"
        events={grouped.tomorrow}
        emptyMessage="Sem coleta amanhã"
      />

      {grouped.upcoming.length > 0 && (
        <section className="space-y-4">
          <h2 className="px-1 text-sm font-semibold uppercase tracking-wider text-primary">
            Próximos dias
          </h2>
          {Array.from(upcomingByDate.entries()).map(([date, events]) => (
            <div key={date} className="space-y-1">
              <h3 className="px-1 text-sm font-medium text-muted-foreground">
                {formatCollectionDate(date)}
              </h3>
              <div className="space-y-1">
                {events.map((event) => (
                  <CollectionItem key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {filtered.length === 0 && addresses.length > 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhuma coleta encontrada para os filtros selecionados.
        </p>
      )}
    </div>
  );
}
