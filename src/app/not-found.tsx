"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { useTranslation } from "@/i18n";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <div className="text-7xl font-bold gradient-text">404</div>
      <h1 className="text-xl font-semibold">{t("notFound.title")}</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {t("notFound.description")}
      </p>
      <Link href="/">
        <Button variant="gradient">{t("notFound.home")}</Button>
      </Link>
    </div>
  );
}
