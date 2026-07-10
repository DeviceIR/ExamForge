"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

export function NoteDialog({
  open,
  onOpenChange,
  value,
  onSave,
  questionLabel,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: string;
  onSave: (note: string) => void;
  questionLabel: string;
}) {
  const { t } = useTranslation();
  const [text, setText] = React.useState(value);
  React.useEffect(() => setText(value), [value, open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="size-5 text-amber-500" />
              <div>
                <DialogPrimitive.Title className="text-base font-semibold">
                  {t("noteDialog.title")}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs text-muted-foreground">
                  {questionLabel}
                </DialogPrimitive.Description>
              </div>
            </div>
            <DialogPrimitive.Close className="rounded-lg p-1 text-muted-foreground hover:bg-accent">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("noteDialog.placeholder")}
            className="mt-4 h-32 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary"
            autoFocus
          />
          <div className="mt-4 flex justify-end gap-2">
            <DialogPrimitive.Close className="rounded-xl px-4 py-2 text-sm hover:bg-accent">
              {t("common.cancel")}
            </DialogPrimitive.Close>
            <button
              onClick={() => onSave(text)}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {t("noteDialog.save")}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
