import type { Meta, StoryObj } from "@storybook/react-vite";
import type * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  TrendEventChart,
  type TrendEventChartEvent,
  type TrendEventChartSeries,
} from "../index";

type TelemetryPoint = {
  timestamp: string;
  temperature: number;
  soilMoisture: number;
  humidity: number;
};

const telemetryData: TelemetryPoint[] = [
  { timestamp: "2026-03-26T11:00:00.000Z", temperature: 21.8, soilMoisture: 44.1, humidity: 67.3 },
  { timestamp: "2026-03-27T11:00:00.000Z", temperature: 21.6, soilMoisture: 44.9, humidity: 69.1 },
  { timestamp: "2026-03-28T11:00:00.000Z", temperature: 22.1, soilMoisture: 44.2, humidity: 70.2 },
  { timestamp: "2026-03-29T11:00:00.000Z", temperature: 22.2, soilMoisture: 44.4, humidity: 67.7 },
  { timestamp: "2026-03-30T11:00:00.000Z", temperature: 21.7, soilMoisture: 45.1, humidity: 69.5 },
  { timestamp: "2026-03-31T11:00:00.000Z", temperature: 22.0, soilMoisture: 43.9, humidity: 68.3 },
  { timestamp: "2026-04-01T11:00:00.000Z", temperature: 21.9, soilMoisture: 44.7, humidity: 70.1 },
  { timestamp: "2026-04-02T11:00:00.000Z", temperature: 22.1, soilMoisture: 44.3, humidity: 68.6 },
];

const telemetrySeries: TrendEventChartSeries<TelemetryPoint>[] = [
  {
    key: "soilMoisture",
    label: "Soil moisture",
    unit: "%",
    color: "var(--metric-soil)",
    valueFormatter: (value) => value.toFixed(1),
  },
  {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    color: "var(--metric-temperature)",
    valueFormatter: (value) => value.toFixed(1),
  },
  {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    color: "var(--metric-humidity)",
    valueFormatter: (value) => value.toFixed(1),
  },
];

const applicationEvents: TrendEventChartEvent[] = [
  {
    id: "evt-foliar",
    timestamp: "2026-03-30T05:00:00.000Z",
    color: "var(--metric-humidity)",
    title: "Foliar feed",
    subtitle: "River Bend",
    rows: [
      { label: "Area", value: "3.5 ha" },
      { label: "Operator", value: "M. Ortiz" },
      { label: "Calcium blend", value: "2.4 L/ha" },
      { label: "Seaweed extract", value: "1.2 L/ha" },
    ],
  },
  {
    id: "evt-pesticide",
    timestamp: "2026-04-01T09:00:00.000Z",
    color: "var(--metric-temperature)",
    title: "Pesticide",
    subtitle: "North Slope",
    rows: [
      { label: "Area", value: "5.1 ha" },
      { label: "Operator", value: "K. Foster" },
      { label: "Copper hydroxide", value: "1.8 kg/ha" },
    ],
  },
  {
    id: "evt-irrigation",
    timestamp: "2026-04-02T04:00:00.000Z",
    color: "var(--metric-soil)",
    title: "Irrigation correction",
    subtitle: "Orchard East",
    rows: [
      { label: "Area", value: "4.2 ha" },
      { label: "Operator", value: "T. Huang" },
      { label: "Pulse correction", value: "18 min" },
    ],
  },
];

function DemoTrendEventChart(
  props: React.ComponentProps<typeof TrendEventChart<TelemetryPoint>>
) {
  return <TrendEventChart<TelemetryPoint> {...props} />;
}

const meta = {
  title: "Data Display/Trend Event Chart",
  component: DemoTrendEventChart,
  tags: ["autodocs"],
  args: {
    data: telemetryData,
    series: telemetrySeries,
    events: applicationEvents,
  },
} satisfies Meta<typeof DemoTrendEventChart>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: (args) => (
    <Card className="max-w-6xl rounded-frame bg-card/88 shadow-frame backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Telemetry + application timeline</CardTitle>
        <CardDescription>
          Hover any data point to see metric values and application events together in a single tooltip.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DemoTrendEventChart {...args} className="rounded-panel" />
      </CardContent>
    </Card>
  ),
};

export const Compact: Story = {
  args: {
    compact: true,
  },
  render: (args) => (
    <Card className="max-w-4xl rounded-panel bg-card/88 shadow-surface backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Zone card preview</CardTitle>
        <CardDescription>
          Compact density for the per-zone cards used deeper in the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DemoTrendEventChart {...args} />
      </CardContent>
    </Card>
  ),
};
