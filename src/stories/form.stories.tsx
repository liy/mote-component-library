import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Input, Label } from "../index";

function SearchIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

const meta = {
  title: "Forms/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    icon: { control: false },
  },
  args: {
    placeholder: "Greenhouse north cluster",
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-md space-y-2">
      <Label htmlFor="workspace-name">Workspace name</Label>
      <Input id="workspace-name" {...args} />
    </div>
  ),
};

export const SearchField: Story = {
  args: {
    placeholder: "Search metrics",
  },
  render: (args) => (
    <div className="max-w-2xl">
      <Input
        aria-label="Search metrics"
        icon={<SearchIcon />}
        type="search"
        {...args}
      />
    </div>
  ),
};

export const FormStack: Story = {
  render: () => (
    <form className="max-w-md space-y-5 rounded-panel bg-card/85 p-6 shadow-surface backdrop-blur-xl">
      <div className="space-y-2">
        <Label htmlFor="site-name">Site name</Label>
        <Input id="site-name" placeholder="Canopy West" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="operator-email">Operator email</Label>
        <Input id="operator-email" type="email" placeholder="ops@mote.farm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" placeholder="Emergency irrigation protocol enabled" />
      </div>
      <div className="flex justify-end">
        <Button>Save configuration</Button>
      </div>
    </form>
  ),
};
