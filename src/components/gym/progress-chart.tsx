"use client";

import { useSyncExternalStore } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { day: "Mon", volume: 2400 },
  { day: "Wed", volume: 2800 },
  { day: "Fri", volume: 2600 },
];

export function ProgressChart() {
  const mounted = useMounted();

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader><CardTitle>Progress chart</CardTitle></CardHeader>
      <CardContent className="h-56">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart data={data}>
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={42} />
              <Tooltip />
              <Bar dataKey="volume" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full min-h-56 rounded-lg bg-muted/35" aria-hidden="true" />
        )}
      </CardContent>
    </Card>
  );
}

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
