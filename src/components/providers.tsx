"use client";

import * as React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui";
import { Toaster } from "sonner";
import { useExamStore } from "@/store/exam-store";
import { LocaleSync, useTranslation } from "@/i18n";

function HydrationGate({ children }: { children: React.ReactNode }) {
  const hydrated = useExamStore((s) => s.hydrated);
  const { t } = useTranslation();

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <TooltipProvider delayDuration={200}>
        <LocaleSync />
        <HydrationGate>{children}</HydrationGate>
        <Toaster position="top-center" richColors closeButton />
      </TooltipProvider>
    </ThemeProvider>
  );
}
