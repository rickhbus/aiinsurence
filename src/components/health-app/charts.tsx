"use client";

import { useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MacroDatum, MetricDatum } from "@/lib/health-app/types";
import { cn } from "@/lib/utils";

type ChartProps = {
  data: MetricDatum[];
  variant?: "area" | "bar" | "line";
  height?: number;
  className?: string;
};

export function ProgressChart({
  data,
  variant = "area",
  height = 168,
  className,
}: ChartProps) {
  const mounted = useMounted();
  const axisColor = "var(--muted-foreground)";
  const gridColor = "var(--border)";
  const primary = "var(--chart-1)";
  const secondary = "var(--chart-2)";

  if (!mounted) {
    return (
      <div
        className={cn("grid h-40 min-h-40 w-full place-items-center rounded-lg bg-muted/35", className)}
        style={{ height }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={cn("h-40 min-h-40 w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {variant === "bar" ? (
          <BarChart data={data} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
            <Tooltip content={<HealthTooltip />} cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey="value" radius={[8, 8, 2, 2]} fill={primary} />
            <Bar dataKey="secondary" radius={[8, 8, 2, 2]} fill={secondary} />
          </BarChart>
        ) : variant === "line" ? (
          <LineChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
            <Tooltip content={<HealthTooltip />} />
            <Line dataKey="value" type="monotone" stroke={primary} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        ) : (
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="healthArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={primary} stopOpacity={0.42} />
                <stop offset="95%" stopColor={primary} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
            <Tooltip content={<HealthTooltip />} />
            <Area dataKey="value" type="monotone" stroke={primary} strokeWidth={3} fill="url(#healthArea)" />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function MacroChart({ data }: { data: MacroDatum[] }) {
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="grid grid-cols-[112px_1fr] items-center gap-4" aria-hidden="true">
        <div className="size-28 rounded-full bg-muted/45" />
        <div className="flex flex-col gap-2">
          <div className="h-4 rounded bg-muted/45" />
          <div className="h-4 rounded bg-muted/45" />
          <div className="h-4 rounded bg-muted/45" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[112px_1fr] items-center gap-4">
      <div className="h-28 min-h-28">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={34} outerRadius={54} paddingAngle={3}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<HealthTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: item.fill }} />
              {item.name}
            </span>
            <strong className="font-medium">{item.value}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function MuscleGroupChart({ data }: { data: MetricDatum[] }) {
  return <ProgressChart data={data} variant="bar" height={180} />;
}

export function ProgressRing({
  value,
  label,
  size = 132,
  tone = "primary",
}: {
  value: number;
  label: string;
  size?: number;
  tone?: "primary" | "secondary";
}) {
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone === "primary" ? "var(--chart-1)" : "var(--chart-2)"}
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <strong className="text-3xl font-semibold tracking-normal">{value}</strong>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function HealthTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      <div className="flex flex-col gap-1">
        {payload.map((item) => (
          <span key={`${item.name}-${item.value}`} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: item.color ?? "var(--chart-1)" }} />
            {item.name}: {item.value}
          </span>
        ))}
      </div>
    </div>
  );
}
