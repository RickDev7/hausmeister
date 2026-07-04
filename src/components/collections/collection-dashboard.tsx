"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { useI18n } from "@/hooks/use-i18n";
import { buildAddressMap } from "@/lib/address-map";
import {
  enrichCollections,
  filterCollections,
  groupByDate,
  groupCollections,
  type CollectionFilters,
} from "@/lib/collections";
import { formatCollectionDate } from "@/lib/format-locale";
import { CollectionFiltersBar } from "@/components/collections/collection-filters";
import { CollectionGroup, CollectionItem } from "@/components/collections/collection-item";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function CollectionDashboard() {
  const { addresses, collections, loading } = useApp();
  const { t, locale } = useI18n();
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
          <p className="text-lg font-medium">{t.home.welcome}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t.home.welcomeHint}</p>
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
        title={t.home.today}
        events={grouped.today}
        emptyMessage={t.home.noToday}
      />

      <CollectionGroup
        title={t.home.tomorrow}
        events={grouped.tomorrow}
        emptyMessage={t.home.noTomorrow}
      />

      {grouped.upcoming.length > 0 && (
        <section className="space-y-4">
          <h2 className="px-1 text-sm font-semibold uppercase tracking-wider text-primary">
            {t.home.upcoming}
          </h2>
          {Array.from(upcomingByDate.entries()).map(([date, events]) => (
            <div key={date} className="space-y-1">
              <h3 className="px-1 text-sm font-medium text-muted-foreground">
                {formatCollectionDate(date, locale, {
                  today: t.home.today,
                  tomorrow: t.home.tomorrow,
                })}
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
          {t.home.noFilterResults}
        </p>
      )}
    </div>
  );
}
