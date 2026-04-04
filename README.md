# Mote Component Library

React UI primitives for Mote products, using the shared visual tokens from `mote-design-system`.

## Included in v1

- `Button`
- `Card` and related subcomponents
- `Input`
- `Label`
- `Badge`
- `Skeleton`
- `Table` and related subcomponents

## Development

Install dependencies:

```bash
npm install
```

Run Storybook:

```bash
npm run storybook
```

Build the package:

```bash
npm run build
```

Verify the published tarball contents:

```bash
npm run pack:check
```

## Consuming the Library

This package ships raw Tailwind class names, so the consuming application must own the Tailwind build and load the design-system CSS.

Import the design-system Tailwind entry once in the application stylesheet:

```css
@import "mote-design-system/tailwind.css";
@source "../node_modules/mote-component-library";
```

The application should also install the required peers:

- `react`
- `react-dom`
- `tailwindcss`
- `mote-design-system`

## Local Storybook Styling

Storybook imports `mote-design-system/tailwind.css` and scans this repository's source files so components render with the same tokens, semantic utilities, and light/dark theme variables used by product apps.
