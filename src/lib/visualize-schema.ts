import { z } from "zod";

export const BlockTypeEnum = z.enum([
  "bar_chart",
  "line_chart",
  "pie_chart",
  "timeline",
  "comparison_cards",
  "table",
  "map",
  "video",
  "images",
  "trip_plan",
  "text_only",
]);

export const RouterResponseSchema = z.object({
  summary: z.string(),
  needs_live_research: z.boolean(),
  research_query: z.string().optional(),
  blocks: z
    .array(z.object({ type: BlockTypeEnum, reason: z.string() }))
    .max(6),
});
export type RouterResponse = z.infer<typeof RouterResponseSchema>;

export const BarChartData = z.object({
  title: z.string(),
  unit: z.string().optional(),
  data: z.array(z.object({ label: z.string(), value: z.number() })).min(1),
});
export const LineChartData = z.object({
  title: z.string(),
  series: z.array(
    z.object({ label: z.string(), points: z.array(z.object({ x: z.string(), y: z.number() })).min(1) })
  ).min(1),
});
export const PieChartData = z.object({
  title: z.string(),
  data: z.array(z.object({ label: z.string(), value: z.number() })).min(1),
});
export const TimelineData = z.object({
  events: z.array(z.object({ date: z.string(), label: z.string(), description: z.string() })).min(1),
});
export const ComparisonCardsData = z.object({
  items: z.array(
    z.object({ title: z.string(), facts: z.array(z.object({ label: z.string(), value: z.string() })) })
  ).min(1),
});
export const TableData = z.object({
  columns: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string())).min(1),
});

export const TripPlanData = z.object({
  destination: z.string(),
  thingsToDo: z.array(z.string()).min(3).max(8),
});

export const GENERATIVE_SCHEMAS: Record<string, z.ZodTypeAny> = {
  bar_chart: BarChartData,
  line_chart: LineChartData,
  pie_chart: PieChartData,
  timeline: TimelineData,
  comparison_cards: ComparisonCardsData,
  table: TableData,
  trip_plan: TripPlanData,
};
