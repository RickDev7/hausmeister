"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FolderOpen, LayoutGrid, MapPin, Settings } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", labelKey: "home" as const, icon: LayoutGrid },
  { href: "/calendar", labelKey: "calendar" as const, icon: CalendarDays },
  { href: "/history", labelKey: "history" as const, icon: FolderOpen },
  { href: "/addresses", labelKey: "addresses" as const, icon: MapPin },
  { href: "/settings", labelKey: "settings" as const, icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      translate="no"
      aria-label={t.nav.main}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-outline-variant bg-surface-container-low/95 backdrop-blur-md pb-safe"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-0.5 py-2">
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-0.5 py-2 text-[9px] font-medium transition-colors sm:text-[10px]",
                active
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">{t.nav[labelKey]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
