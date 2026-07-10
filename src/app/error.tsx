"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui";
import { useTranslation } from "@/i18n";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
        <AlertTriangle className="size-8" />
      </div>
      <h1 className="text-xl font-semibold">{t("error.title")}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{t("error.description")}</p>
      <div className="flex gap-2">
        <Button variant="gradient" onClick={reset} className="gap-2">
          <RotateCcw className="size-4" /> {t("error.retry")}
        </Button>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="size-4" /> {t("error.home")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
