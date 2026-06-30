"use client";

import { Recycle } from "lucide-react";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AppHeader({ title = "Planejador de Lixo", subtitle }: AppHeaderProps) {
  return (
    <header
      translate="no"
      className="sticky top-0 z-30 border-b border-outline-variant bg-surface/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container">
          <Recycle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}
