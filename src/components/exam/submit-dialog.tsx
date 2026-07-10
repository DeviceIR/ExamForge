"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CheckCircle2, AlertTriangle, Loader2, Flag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { useTranslation } from "@/i18n";

export function SubmitDialog({
  open,
  onOpenChange,
  total,
  answered,
  review,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  total: number;
  answered: number;
  review: number;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();
  const unanswered = total - answered;
  const allAnswered = unanswered === 0;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl")}>
          <div className="flex items-start justify-between">
            <CheckCircle2 className="size-6 text-primary" />
            <DialogPrimitive.Close className="rounded-lg p-1 text-muted-foreground hover:bg-accent">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Title className="mt-4 text-xl font-bold">
            {t("submitDialog.title")}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
            {allAnswered
              ? t("submitDialog.allAnswered")
              : t("submitDialog.unanswered", { count: unanswered })}
          </DialogPrimitive.Description>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Stat value={answered} label={t("submitDialog.answered")} />
            <Stat value={unanswered} label={t("submitDialog.unansweredLabel")} />
            <Stat value={review} label={t("submitDialog.marked")} icon />
          </div>
          {!allAnswered && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {t("submitDialog.warning")}
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <DialogPrimitive.Close asChild>
              <Button variant="outline">{t("submitDialog.keepWorking")}</Button>
            </DialogPrimitive.Close>
            <Button variant="gradient" onClick={onSubmit} disabled={submitting} className="gap-2">
              {submitting ? (
                <><Loader2 className="size-4 animate-spin" /> {t("submitDialog.submitting")}</>
              ) : (
                <><CheckCircle2 className="size-4" /> {t("submitDialog.submitNow")}</>
              )}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Stat({ value, label, icon }: { value: number; label: string; icon?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-2xl font-bold">
        {icon && <Flag className="size-3.5 fill-amber-500 text-amber-500" />}
        {value}
      </div>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
    </div>
  );
}
