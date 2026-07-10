"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Minus,
  Plus,
  Moon,
  Sun,
  Monitor,
  Palette,
  Timer,
  Target,
  Type,
  Sparkles,
  Globe,
  Trash2,
  Download,
  AlertTriangle,
} from "lucide-react";
import { useExamStore } from "@/store/exam-store";
import { useTheme } from "next-themes";
import { PageHeader, SectionTitle } from "@/components/shared";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Switch,
  Separator,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "@/i18n";

export default function SettingsPage() {
  const settings = useExamStore((s) => s.settings);
  const updateSettings = useExamStore((s) => s.updateSettings);
  const resetAll = useExamStore((s) => s.resetAll);
  const { setTheme } = useTheme();
  const { t } = useTranslation();

  const [confirmReset, setConfirmReset] = React.useState(false);

  const setThemeMode = (mode: "light" | "dark" | "system") => {
    updateSettings({ darkMode: mode });
    setTheme(mode);
  };

  const fontSizeOptions = [
    { value: "sm", label: t("settings.fontSize"), sample: "text-sm" },
    { value: "md", label: t("common.medium"), sample: "text-base" },
    { value: "lg", label: t("settings.questionSize"), sample: "text-lg" },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
        icon={SettingsIcon}
      />

      <div className="space-y-6">
        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Palette className="size-4 text-primary" />
                <h2 className="font-semibold">{t("settings.appearance")}</h2>
              </div>

              {/* Theme */}
              <div>
                <label className="mb-2 block text-sm font-medium">{t("settings.darkMode")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "light", label: t("settings.themeLight"), icon: Sun },
                    { value: "dark", label: t("settings.themeDark"), icon: Moon },
                    { value: "system", label: t("settings.themeSystem"), icon: Monitor },
                  ].map((opt) => {
                    const active = settings.darkMode === opt.value;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setThemeMode(opt.value as any)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all",
                          active
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        <Icon className="size-4" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator className="my-5" />

              {/* Font size */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Type className="size-4 text-muted-foreground" />
                  <label className="text-sm font-medium">{t("settings.fontSize")}</label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {fontSizeOptions.map((opt) => {
                    const active = settings.fontSize === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => updateSettings({ fontSize: opt.value })}
                        className={cn(
                          "rounded-xl border-2 px-3 py-3 transition-all",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        <span className={cn("font-semibold", opt.sample)}>
                          A
                        </span>
                        <span className="mt-1 block text-[10px] text-muted-foreground">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator className="my-5" />

              {/* Animations */}
              <ToggleRow
                icon={Sparkles}
                title={t("settings.animations")}
                description={t("settings.animationsDesc")}
                checked={settings.animations}
                onCheckedChange={(v) => updateSettings({ animations: v })}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Exam settings */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Timer className="size-4 text-primary" />
                <h2 className="font-semibold">{t("settings.exam")}</h2>
              </div>

              <ToggleRow
                icon={Timer}
                title={t("settings.timer")}
                description={t("settings.timerDesc")}
                checked={settings.timerEnabled}
                onCheckedChange={(v) => updateSettings({ timerEnabled: v })}
              />

              <Separator className="my-5" />

              {/* Default duration */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium">{t("settings.defaultDuration")}</label>
                  <Badge variant="secondary">{settings.defaultExamDuration} {t("common.minutes")}</Badge>
                </div>
                <Stepper
                  value={settings.defaultExamDuration}
                  min={10}
                  max={240}
                  step={5}
                  onChange={(v) => updateSettings({ defaultExamDuration: v })}
                />
              </div>

              <Separator className="my-5" />

              {/* Negative marking */}
              <ToggleRow
                icon={Minus}
                title={t("settings.negativeMarking")}
                description={t("settings.negativeMarkingDesc")}
                checked={settings.negativeMarking}
                onCheckedChange={(v) => updateSettings({ negativeMarking: v })}
              />
              {settings.negativeMarking && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">{t("settings.negativeMarkingDesc")}</label>
                    <Badge variant="secondary">{settings.negativeMarkingValue.toFixed(2)}</Badge>
                  </div>
                  <Stepper
                    value={settings.negativeMarkingValue}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={(v) => updateSettings({ negativeMarkingValue: Number(v.toFixed(2)) })}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Goals */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Target className="size-4 text-primary" />
                <h2 className="font-semibold">{t("dashboard.dailyGoal")}</h2>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium">{t("settings.dailyGoal")}</label>
                  <Badge variant="secondary">{settings.dailyGoal}</Badge>
                </div>
                <Stepper
                  value={settings.dailyGoal}
                  min={0}
                  max={200}
                  step={5}
                  onChange={(v) => updateSettings({ dailyGoal: v })}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("settings.resetHint")}
                </p>
              </div>

              <Separator className="my-5" />

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  <label className="text-sm font-medium">{t("settings.language")}</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "en" as const, label: t("settings.languageEn") },
                    { value: "fa" as const, label: t("settings.languageFa") },
                  ].map((opt) => {
                    const active = settings.language === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => updateSettings({ language: opt.value })}
                        className={cn(
                          "rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all",
                          active
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data management */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-rose-500/20">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="size-4 text-rose-500" />
                <h2 className="font-semibold">{t("settings.data")}</h2>
              </div>

              {!confirmReset ? (
                <Button
                  variant="outline"
                  className="gap-2 border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                  onClick={() => setConfirmReset(true)}
                >
                  <Trash2 className="size-4" />
                  {t("settings.resetAll")}
                </Button>
              ) : (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                    {t("settings.resetConfirm")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("settings.resetHint")}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        resetAll();
                        setConfirmReset(false);
                        toast.success(t("settings.resetDone"));
                      }}
                    >
                      {t("common.reset")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setConfirmReset(false)}>
                      {t("common.cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <p className="pb-4 text-center text-xs text-muted-foreground">
          {t("brand.title")} · {t("settings.resetHint")}
        </p>
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={dec} disabled={value <= min}>
        <Minus className="size-4" />
      </Button>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-primary"
      />
      <Button variant="outline" size="icon" onClick={inc} disabled={value >= max}>
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
