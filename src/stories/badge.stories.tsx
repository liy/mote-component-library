import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "../index";

const meta = {
  title: "Data Display/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: {
    children: "Stable",
    variant: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">Stable</Badge>
      <Badge variant="secondary">Pending</Badge>
      <Badge variant="destructive">Alert</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Muted</Badge>
      <Badge variant="link">Linked</Badge>
    </div>
  ),
};
