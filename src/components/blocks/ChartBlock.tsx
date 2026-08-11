"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#7C6CFF", "#FF6B4A", "#4ADE80", "#FBBF24", "#60A5FA", "#F472B6"];

export function BarChartBlock({ data }: { data: { title: string; unit?: string; data: { label: string; value: number }[] } }) {
  return (
    <div className="chart-block">
      <div className="chart-title">{data.title}</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
          <XAxis dataKey="label" stroke="#9A9DB0" fontSize={12} />
          <YAxis stroke="#9A9DB0" fontSize={12} unit={data.unit ? ` ${data.unit}` : ""} />
          <Tooltip contentStyle={{ background: "#0F1117", border: "1px solid #ffffff10", borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="value" fill="#7C6CFF" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineChartBlock({ data }: { data: { title: string; series: { label: string; points: { x: string; y: number }[] }[] } }) {
  const merged: Record<string, string | number | null>[] = [];
  const xSet = new Set<string>();
  data.series.forEach((s) => s.points.forEach((p) => xSet.add(p.x)));
  Array.from(xSet).forEach((x) => {
    const row: Record<string, string | number | null> = { x };
    data.series.forEach((s) => {
      const point = s.points.find((p) => p.x === x);
      row[s.label] = point?.y ?? null;
    });
    merged.push(row);
  });

  return (
    <div className="chart-block">
      <div className="chart-title">{data.title}</div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={merged}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
          <XAxis dataKey="x" stroke="#9A9DB0" fontSize={12} />
          <YAxis stroke="#9A9DB0" fontSize={12} />
          <Tooltip contentStyle={{ background: "#0F1117", border: "1px solid #ffffff10", borderRadius: 8, fontSize: 12 }} />
          {data.series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {data.series.map((s, i) => (
            <Line key={s.label} type="monotone" dataKey={s.label} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieChartBlock({ data }: { data: { title: string; data: { label: string; value: number }[] } }) {
  return (
    <div className="chart-block">
      <div className="chart-title">{data.title}</div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data.data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90} label={{ fontSize: 11, fill: "#9A9DB0" }}>
            {data.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: "#0F1117", border: "1px solid #ffffff10", borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
