"use client";

import { AppHeader } from "@/components/layout/app-header";
import { AddressManager } from "@/components/addresses/address-manager";
import { useI18n } from "@/hooks/use-i18n";

export function AddressesPageContent() {
  const { t } = useI18n();

  return (
    <>
      <AppHeader title={t.addresses.title} subtitle={t.addresses.subtitle} />
      <div className="py-4">
        <AddressManager />
      </div>
    </>
  );
}
