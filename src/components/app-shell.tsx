"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Brain,
  BarChart3,
  Trophy,
  Settings as SettingsIcon,
  Upload,
  Search,
  Moon,
  Sun,
  Monitor,
  Menu,
  X,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { useTranslation } from "@/i18n";
import { GithubFab } from "@/components/github-fab";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/exams", labelKey: "nav.exams", icon: Library },
  { href: "/practice", labelKey: "nav.practice", icon: Brain },
  { href: "/analytics", labelKey: "nav.analytics", icon: BarChart3 },
  { href: "/search", labelKey: "nav.search", icon: Search },
  { href: "/statistics", labelKey: "nav.statistics", icon: Trophy },
  { href: "/import", labelKey: "nav.library", icon: Upload },
  { href: "/settings", labelKey: "nav.settings", icon: SettingsIcon },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;
  const isDark = theme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="rounded-full"
    >
      <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

function Brand() {
  const { t } = useTranslation();
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="relative">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-fuchsia-500 to-indigo-500 shadow-lg shadow-primary/30">
          <GraduationCap className="size-5 text-white" />
        </div>
        <div className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight">
          {t("brand.title")}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {t("brand.subtitle")}
        </span>
      </div>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  return (
    <nav className="flex flex-col gap-1 px-3" data-sidebar-nav>
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )}
          >
            {active && (
              <motion.div
                layoutId="nav-active"
                className="absolute inset-0 rounded-xl bg-accent"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon
              className={cn(
                "relative z-10 size-[18px] transition-colors",
                active && "text-primary"
              )}
            />
            <span className="relative z-10">{t(item.labelKey)}</span>
            {active && (
              <span className="relative z-10 ml-auto size-1.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const { t } = useTranslation();
  return (
    <div className="px-3 pb-4">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-fuchsia-500/5 to-indigo-500/10 p-4">
        <Sparkles className="absolute -right-2 -top-2 size-16 text-primary/10" />
        <p className="text-xs font-semibold">{t("common.smartStudyTitle")}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {t("common.smartStudyDesc")}
        </p>
        <Link href="/practice?mode=smart">
          <Button size="sm" variant="gradient" className="mt-3 w-full">
            {t("common.generateSession")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* ambient gradient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 size-[400px] rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 size-[400px] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center px-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarContent />
        </div>
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-card shadow-2xl lg:hidden"
            >
              <div className="flex h-16 items-center justify-between px-5">
                <Brand />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </div>
              <SidebarFooter />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="lg:hidden">
            <Brand />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/search"
              className="hidden items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent md:flex"
            >
              <Search className="size-3.5" />
              <span>{t("common.searchPlaceholder")}</span>
              <kbd className="ml-4 rounded border bg-muted px-1.5 text-[10px]">
                /
              </kbd>
            </Link>
            <ThemeToggle />
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="rounded-full">
                <SettingsIcon className="size-5" />
              </Button>
            </Link>
            <div className="ml-1 flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-500 text-xs font-bold text-white">
              ME
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>

      <GithubFab />
    </div>
  );
}
