import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../index";

const meta = {
  title: "Data Display/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Greenhouse north cluster</CardTitle>
        <CardDescription>
          Environmental telemetry summary for the last irrigation cycle.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">Healthy</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/45 p-4">
            <p className="text-kicker text-muted-foreground">Temperature</p>
            <p className="mt-2 font-heading text-title-lg text-foreground">23.4°C</p>
          </div>
          <div className="rounded-xl bg-muted/45 p-4">
            <p className="text-kicker text-muted-foreground">Humidity</p>
            <p className="mt-2 font-heading text-title-lg text-foreground">61%</p>
          </div>
          <div className="rounded-xl bg-muted/45 p-4">
            <p className="text-kicker text-muted-foreground">Soil moisture</p>
            <p className="mt-2 font-heading text-title-lg text-foreground">44%</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Stable climate window with mild evapotranspiration acceleration after 14:00.
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-sm text-muted-foreground">Updated 5 minutes ago</span>
        <Button variant="outline">Open cluster</Button>
      </CardFooter>
    </Card>
  ),
};

export const Compact: Story = {
  render: () => (
    <Card size="sm" className="max-w-sm">
      <CardHeader>
        <CardTitle>pH drift</CardTitle>
        <CardDescription>Nutrient solution trend exceeded threshold.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-kicker text-muted-foreground">Current</p>
            <p className="font-heading text-title-lg">6.8</p>
          </div>
          <Badge variant="destructive">Action required</Badge>
        </div>
      </CardContent>
    </Card>
  ),
};
