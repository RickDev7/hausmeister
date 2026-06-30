import { AppHeader } from "@/components/layout/app-header";
import { AddressManager } from "@/components/addresses/address-manager";

export default function AddressesPage() {
  return (
    <>
      <AppHeader title="Endereços" subtitle="Gerenciar arquivos ICS" />
      <div className="py-4">
        <AddressManager />
      </div>
    </>
  );
}
