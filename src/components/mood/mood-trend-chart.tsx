"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { day: "Mon", mood: 6, stress: 7 },
  { day: "Tue", mood: 7, stress: 5 },
  { day: "Wed", mood: 5, stress: 8 },
  { day: "Thu", mood: 6, stress: 6 },
  { day: "Fri", mood: 7, stress: 4 },
];

export function MoodTrendChart() {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Recent mood trend</CardTitle>
        <CardDescription>示範趨勢；真實趨勢會由 RLS mood logs 載入。</CardDescription>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <LineChart data={data}>
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 10]} tickLine={false} axisLine={false} width={24} />
            <Tooltip />
            <Line type="monotone" dataKey="mood" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="stress" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
