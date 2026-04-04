import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { Label, Select } from "../index";

function TimerResetIcon(props: React.ComponentProps<"svg">) {
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
      <path d="M3 2v6h6" />
      <path d="M3.05 13a9 9 0 1 0 2.13-5.67L3 8" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

const meta = {
  title: "Forms/Select",
  component: Select,
  tags: ["autodocs"],
  argTypes: {
    children: { control: false },
    icon: { control: false },
    onChange: { action: "change" },
    onValueChange: { action: "valueChange" },
  },
  args: {
    placeholder: "Select timeframe",
    value: "1h",
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DashboardStyle: Story = {
  render: (args) => {
    const [value, setValue] = React.useState(String(args.value ?? ""));

    React.useEffect(() => {
      setValue(String(args.value ?? ""));
    }, [args.value]);

    return (
      <div className="max-w-2xl space-y-2">
        <Label htmlFor="time-range">Time range</Label>
        <Select
          {...args}
          id="time-range"
          icon={<TimerResetIcon className="size-5" />}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            args.onChange?.(event);
          }}
          onValueChange={(nextValue) => {
            setValue(nextValue);
            args.onValueChange?.(nextValue);
          }}
        >
          <option value="15m">15m</option>
          <option value="1h">1h</option>
          <option value="6h">6h</option>
          <option value="24h">24h</option>
        </Select>
      </div>
    );
  },
};

export const InForm: Story = {
  render: () => {
    const [farm, setFarm] = React.useState("north");

    return (
      <form className="max-w-md space-y-5 rounded-panel bg-card/85 p-6 shadow-surface backdrop-blur-xl">
        <div className="space-y-2">
          <Label htmlFor="farm">Farm</Label>
          <Select
            id="farm"
            value={farm}
            onValueChange={setFarm}
            placeholder="Choose a farm"
          >
            <option value="north">North greenhouse</option>
            <option value="west">West orchard</option>
            <option value="south">South propagation</option>
          </Select>
        </div>
      </form>
    );
  },
};
