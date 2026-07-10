"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart,
} from "recharts";
import { useTheme } from "next-themes";
import { useTranslation } from "@/i18n";

const PIE_COLORS = ["#10b981", "#f43f5e", "#94a3b8"];

export function OutcomePie({
  correct,
  wrong,
  skipped,
}: {
  correct: number;
  wrong: number;
  skipped: number;
}) {
  const { t } = useTranslation();
  const data = [
    { name: t("results.correct"), value: correct },
    { name: t("results.wrong"), value: wrong },
    { name: t("results.skipped"), value: skipped },
  ].filter((d) => d.value > 0);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <RTooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function YearTrendChart({
  data,
}: {
  data: Array<{ year: string; score: number }>;
}) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const grid = dark ? "#334155" : "#e2e8f0";
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} />
        <YAxis
          domain={[0, 100]}
          stroke="#94a3b8"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <RTooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
          }}
          formatter={(v: number) => [`${v}%`, t("results.score")]}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          fill="url(#scoreGrad)"
          dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopicRadar({
  data,
}: {
  data: Array<{ topic: string; score: number }>;
}) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  if (data.length < 3) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        {t("analytics.empty")}
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke={dark ? "#334155" : "#e2e8f0"} />
        <PolarAngleAxis
          dataKey="topic"
          tick={{ fontSize: 10, fill: "#94a3b8" }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{ fontSize: 9, fill: "#94a3b8" }}
          axisLine={false}
        />
        <Radar
          name={t("results.score")}
          dataKey="score"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.35}
          strokeWidth={2}
        />
        <RTooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function TopicBar({
  data,
}: {
  data: Array<{ topic: string; correct: number; wrong: number; skipped: number }>;
}) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const grid = dark ? "#334155" : "#e2e8f0";
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 42)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 20, right: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
        <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
        <YAxis
          type="category"
          dataKey="topic"
          stroke="#94a3b8"
          fontSize={11}
          width={110}
          tickLine={false}
          axisLine={false}
        />
        <RTooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
          }}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="correct" name={t("results.correct")} stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
        <Bar dataKey="wrong" name={t("results.wrong")} stackId="a" fill="#f43f5e" />
        <Bar dataKey="skipped" name={t("results.skipped")} stackId="a" fill="#94a3b8" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DifficultyChart({
  data,
}: {
  data: Array<{ difficulty: string; correct: number; wrong: number }>;
}) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const grid = dark ? "#334155" : "#e2e8f0";
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey="difficulty" stroke="#94a3b8" fontSize={11} tickLine={false} />
        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
        <RTooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
          }}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="correct" name={t("results.correct")} fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="wrong" name={t("results.wrong")} fill="#f43f5e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ActivityHeatmap({
  days,
}: {
  days: Array<{ date: string; count: number; level: number }>;
}) {
  // level 0..4
  const colors = [
    "bg-muted",
    "bg-emerald-500/30",
    "bg-emerald-500/55",
    "bg-emerald-500/75",
    "bg-emerald-500",
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {days.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.count} questions`}
          className={`size-3 rounded-[3px] ${colors[d.level] ?? colors[0]}`}
        />
      ))}
    </div>
  );
}
