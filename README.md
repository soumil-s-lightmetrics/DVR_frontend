# LMLabs Monorepo

A pnpm + Turborepo monorepo for multiple landing-page sites.

## Structure

- `apps/labs` — clone of labs.google's landing page, built with Next.js.
- `packages/ui` — shared component library (`Header`, `Footer`, `Button`, `Pill`, `ExperimentCard`) and design tokens (`src/styles/tokens.css`), extracted from labs.google's own stylesheet.

## Adding a new site

1. Copy `apps/labs` to `apps/<new-site>`, update its `package.json` name.
2. Reuse `@lmlabs/ui` for shared building blocks and tokens; add site-specific styling in the app itself.

## Commands

```bash
pnpm install
pnpm dev      # runs all apps in dev mode via Turborepo
pnpm build
```
