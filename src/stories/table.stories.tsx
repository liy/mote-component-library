import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../index";

const meta = {
  title: "Data Display/Table",
  component: Table,
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FleetOverview: Story = {
  render: () => (
    <div className="max-w-4xl rounded-panel bg-card/90 p-4 shadow-surface backdrop-blur-xl">
      <Table>
        <TableCaption>Active sensor clusters across the current farm network.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Cluster</TableHead>
            <TableHead>Zone</TableHead>
            <TableHead>Battery</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">North mote</TableCell>
            <TableCell>Greenhouse A</TableCell>
            <TableCell>92%</TableCell>
            <TableCell>
              <Badge variant="secondary">Healthy</Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Irrigation loop</TableCell>
            <TableCell>Field 7</TableCell>
            <TableCell>48%</TableCell>
            <TableCell>
              <Badge variant="outline">Watch</Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Drying line</TableCell>
            <TableCell>Processing shed</TableCell>
            <TableCell>17%</TableCell>
            <TableCell>
              <Badge variant="destructive">Critical</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Monitored clusters</TableCell>
            <TableCell>3</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  ),
};
