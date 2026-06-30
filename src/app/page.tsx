import { AppHeader } from "@/components/layout/app-header";
import { CollectionDashboard } from "@/components/collections/collection-dashboard";

export default function HomePage() {
  return (
    <>
      <AppHeader subtitle="Suas datas de coleta" />
      <div className="py-4">
        <CollectionDashboard />
      </div>
    </>
  );
}
