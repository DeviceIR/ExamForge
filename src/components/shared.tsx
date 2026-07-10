"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui";
import dynamic from "next/dynamic";

// ---------------- Page header ----------------
export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-fuchsia-500/10 text-primary">
            <Icon className="size-6" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

// ---------------- Stat card ----------------
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "primary",
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  accent?: "primary" | "emerald" | "amber" | "rose" | "blue" | "violet";
  delay?: number;
}) {
  const accents: Record<string, string> = {
    primary: "from-primary/15 to-primary/5 text-primary",
    emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-500",
    amber: "from-amber-500/15 to-amber-500/5 text-amber-500",
    rose: "from-rose-500/15 to-rose-500/5 text-rose-500",
    blue: "from-blue-500/15 to-blue-500/5 text-blue-500",
    violet: "from-violet-500/15 to-violet-500/5 text-violet-500",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="h-full"
    >
      <Card className="relative h-full overflow-hidden card-hover">
        <div className="flex h-full items-center justify-between p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
            {hint && (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br",
              accents[accent]
            )}
          >
            <Icon className="size-6" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ---------------- Empty state ----------------
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-fuchsia-500/5 text-primary">
        <Icon className="size-8" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------------- KaTeX (client only) ----------------
const KatexInner = dynamic(() => import("./katex-renderer"), { ssr: false });

export function Math({ children, display = false }: { children: string; display?: boolean }) {
  return (
    <KatexInner display={display}>{children}</KatexInner>
  );
}

// ---------------- Code block ----------------
export function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-zinc-950">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-rose-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
        </div>
        {language && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {language}
          </span>
        )}
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-zinc-100">{code}</code>
      </pre>
    </div>
  );
}

// ---------------- Section title ----------------
export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
