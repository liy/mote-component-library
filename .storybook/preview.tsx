import type { Preview } from "@storybook/react-vite";

import "../src/styles/storybook.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Preview the Mote design system themes.",
      defaultValue: "light",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    backgrounds: { disable: true },
    controls: {
      expanded: true,
      sort: "requiredFirst",
    },
  },
  decorators: [
    (Story, context) => {
      const themeClass =
        context.globals.theme === "dark" ? "theme-dark" : "theme-light";

      return (
        <div
          className={`${themeClass} mote-theme mote-ambient-grid`}
          style={{ minHeight: "100vh", padding: "32px" }}
        >
          <div style={{ maxWidth: "1120px" }}>
            <Story />
          </div>
        </div>
      );
    },
  ],
};

export default preview;
