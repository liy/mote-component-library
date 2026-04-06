import type { Meta, StoryObj } from "@storybook/react-vite";

import { Card, CardContent, CardHeader, Skeleton } from "../index";

const meta = {
  title: "Data Display/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LoadingCard: Story = {
  render: () => (
    <Card className="max-w-lg">
      <CardHeader className="space-y-3">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-10 w-full rounded-2xl" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </CardContent>
    </Card>
  ),
};
