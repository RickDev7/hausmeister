"use client";

import { useState } from "react";
import { CalendarDays, Bell, FileUp } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { useI18n } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const steps = [
  { icon: FileUp, titleKey: "step1title" as const, descKey: "step1desc" as const },
  { icon: CalendarDays, titleKey: "step2title" as const, descKey: "step2desc" as const },
  { icon: Bell, titleKey: "step3title" as const, descKey: "step3desc" as const },
];

export function Onboarding() {
  const { settings, updateSettings } = useApp();
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  if (settings.onboardingCompleted) return null;

  const current = steps[step];
  const Icon = current.icon;

  const finish = async () => {
    await updateSettings({ ...settings, onboardingCompleted: true });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-container">
              <Icon className="h-8 w-8 text-on-primary-container" aria-hidden />
            </div>
            <div>
              <h2 id="onboarding-title" className="text-lg font-semibold">
                {t.onboarding[current.titleKey]}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.onboarding[current.descKey]}
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-2" aria-hidden>
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full",
                  i === step ? "bg-primary" : "bg-outline-variant"
                )}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={finish}>
              {t.onboarding.skip}
            </Button>
            {step < steps.length - 1 ? (
              <Button className="flex-1" onClick={() => setStep((s) => s + 1)}>
                {t.onboarding.next}
              </Button>
            ) : (
              <Button className="flex-1" onClick={finish}>
                {t.onboarding.finish}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
