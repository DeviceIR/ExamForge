"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertTriangle, Bell } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

const WARNINGS = [
  { at: 30 * 60, label: "30 min", tone: "amber" },
  { at: 10 * 60, label: "10 min", tone: "amber" },
  { at: 5 * 60, label: "5 min", tone: "rose" },
  { at: 60, label: "1 min", tone: "rose" },
];

export function ExamTimer({
  remaining,
  total,
  ready = true,
  paused,
  onTogglePause,
  onWarning,
  onExpire,
}: {
  remaining: number;
  total: number;
  ready?: boolean;
  paused: boolean;
  onTogglePause: () => void;
  onWarning: (label: string) => void;
  onExpire: () => void;
}) {
  const firedRef = React.useRef<Set<number>>(new Set());
  const expiredRef = React.useRef(false);
  const isDanger = remaining <= 60;
  const isWarning = remaining <= 5 * 60 && remaining > 60;

  // fire warnings / expire once the timer is ready
  React.useEffect(() => {
    if (!ready) return;

    for (const w of WARNINGS) {
      if (remaining > 0 && remaining <= w.at && !firedRef.current.has(w.at)) {
        firedRef.current.add(w.at);
        onWarning(w.label);
      }
    }

    if (remaining <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, ready]);

  return (
    <button
      onClick={onTogglePause}
      className={cn(
        "group relative flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-sm font-semibold transition-all",
        isDanger
          ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
          : isWarning
            ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
            : "border-border bg-card text-foreground"
      )}
      title={paused ? "Resume (click)" : "Pause (click)"}
    >
      <Clock
        className={cn(
          "size-4",
          isDanger && !paused && "animate-pulse"
        )}
      />
      <span className={cn(paired(paused) && "opacity-60")}>
        {formatTime(Math.max(0, remaining))}
      </span>
      {paused && <span className="text-[10px] uppercase">Paused</span>}
      <AnimatePresence>
        {isDanger && !paused && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            exit={{ scale: 0 }}
            className="absolute -right-0.5 -top-0.5 flex size-3"
          >
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-rose-500" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function paired(p: boolean) {
  return p;
}

export function TimeWarningToast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed left-1/2 top-20 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-600 shadow-lg backdrop-blur dark:text-amber-400">
            <Bell className="size-4" />
            {message} remaining
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { AlertTriangle };
