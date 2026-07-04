"use client";

import { useMemo } from "react";
import { Flame, TrendingUp } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { useI18n } from "@/hooks/use-i18n";
import { computeCheckInStats } from "@/lib/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HistoryStats() {
  const { checkIns } = useApp();
  const { t } = useI18n();

  const stats = useMemo(() => computeCheckInStats(checkIns), [checkIns]);

  if (checkIns.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5" />
          {t.history.stats}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-surface-container-lowest p-3">
            <p className="text-2xl font-bold tabular-nums">{stats.totalCheckIns}</p>
            <p className="text-xs text-muted-foreground">{t.history.total}</p>
          </div>
          <div className="rounded-2xl bg-surface-container-lowest p-3">
            <p className="text-2xl font-bold tabular-nums">{stats.thisMonth}</p>
            <p className="text-xs text-muted-foreground">{t.history.thisMonth}</p>
          </div>
          <div className="rounded-2xl bg-primary-container p-3">
            <p className="flex items-center justify-center gap-1 text-2xl font-bold tabular-nums text-on-primary-container">
              <Flame className="h-5 w-5" aria-hidden />
              {stats.currentStreak}
            </p>
            <p className="text-xs text-on-primary-container">{t.history.streak}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
