import { AppHeader } from "@/components/layout/app-header";
import { SettingsPanel } from "@/components/settings/settings-panel";

export default function SettingsPage() {
  return (
    <>
      <AppHeader title="Configurações" />
      <div className="py-4">
        <SettingsPanel />
      </div>
    </>
  );
}
