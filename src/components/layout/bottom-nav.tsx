"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FolderOpen, MapPin, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Início", icon: CalendarDays },
  { href: "/history", label: "Histórico", icon: FolderOpen },
  { href: "/addresses", label: "Endereços", icon: MapPin },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      translate="no"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-outline-variant bg-surface-container-low/95 backdrop-blur-md pb-safe"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-medium transition-colors sm:text-xs",
                active
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
