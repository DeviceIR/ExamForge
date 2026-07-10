"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github } from "lucide-react";

const GITHUB_URL = "https://github.com/DeviceIR";

export function GithubFab() {
  const [mounted, setMounted] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  // "ring" pulse — fires periodically like a bell
  const [ringKey, setRingKey] = React.useState(0);

  React.useEffect(() => {
    const showTimer = setTimeout(() => setMounted(true), 900);
    return () => clearTimeout(showTimer);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => setRingKey((k) => k + 1), 4500);
    return () => clearInterval(interval);
  }, [mounted]);

  return (
    <AnimatePresence>
      {mounted && (
        <motion.a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub — DeviceIR"
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="fixed bottom-6 end-6 z-50 flex items-center gap-3"
        >
          {/* expanding label on hover (toward screen center) */}
          <AnimatePresence>
            {hovered && (
              <motion.span
                initial={{ opacity: 0, x: 8, width: 0 }}
                animate={{ opacity: 1, x: 0, width: "auto" }}
                exit={{ opacity: 0, x: 8, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap rounded-full border border-border/60 bg-card/90 px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur"
              >
                DeviceIR
                <span className="ms-1.5 text-xs font-normal text-muted-foreground">
                  · GitHub
                </span>
              </motion.span>
            )}
          </AnimatePresence>

          {/* button + rings */}
          <span className="relative flex size-14 shrink-0 items-center justify-center">
            {/* expanding bell rings */}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {[0, 1].map((i) => (
                <motion.span
                  key={`${ringKey}-${i}`}
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 1.4, delay: i * 0.35, ease: "easeOut" }}
                  className="absolute size-14 rounded-full bg-primary/40"
                />
              ))}
            </span>

            {/* soft glow */}
            <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/40 blur-xl" />

            {/* the circle */}
            <motion.span
              className="relative flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-primary via-fuchsia-500 to-indigo-500 text-white shadow-lg shadow-primary/40"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.08 }}
              animate={hovered ? { rotate: 0 } : { rotate: [0, -14, 12, -8, 6, 0] }}
              transition={
                hovered
                  ? { duration: 0.2 }
                  : { duration: 0.9, repeat: Infinity, repeatDelay: 3.6, ease: "easeInOut" }
              }
            >
              <Github className="size-6" />
              {/* notification dot */}
              <span className="absolute -end-0.5 -top-0.5 flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-emerald-400 ring-2 ring-background" />
              </span>
            </motion.span>
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
