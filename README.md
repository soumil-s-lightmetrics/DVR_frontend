# LMLabs Monorepo

A pnpm + Turborepo monorepo for multiple landing-page sites and experiments.

## Structure

- `apps/labs` — clone of labs.google's landing page, built with Next.js (package name `labs-clone`).
- `apps/mounting-verification` — Dashcam Mount Analyzer: upload a dashcam image and classify the camera mounting via Google Gemini. The card in `apps/labs` links to it.
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

Fixed dev ports: `apps/labs` → http://localhost:3000, `apps/mounting-verification` → http://localhost:3001.

To run a single app:

```bash
pnpm --filter labs-clone dev
pnpm --filter mounting-verification dev
```

## Environment variables

`apps/mounting-verification` needs a Google Gemini key. Copy the example and fill it in:

```bash
cp apps/mounting-verification/.env.local.example apps/mounting-verification/.env.local
```

| App | Variable | Required | Notes |
|-----|----------|----------|-------|
| mounting-verification | `GEMINI_API_KEY` | yes | Server-side only; used by the `/api/analyze` route. |
| mounting-verification | `GEMINI_MODEL` | no | Defaults to `gemini-3-flash-preview`. |
| labs | `NEXT_PUBLIC_MOUNTING_VERIFICATION_URL` | no (prod) | URL the "Mounting Verification" card links to. Defaults to `http://localhost:3001` in dev. `NEXT_PUBLIC_*` is baked in at **build time**. |

> Only `.env*.local` is git-ignored. Never put real secrets in a plain `.env` file — it would be committed.

## Deploying to AWS Amplify

The two apps deploy as **two separate Amplify apps** connected to this same repo. The root [`amplify.yml`](./amplify.yml) contains a build block for each (`applications:` with an `appRoot` per app); Amplify runs only the block matching the app root you configure.

They use **different Amplify platforms**:

| App | Rendering | Amplify platform | Output dir |
|-----|-----------|------------------|------------|
| labs | Static export (no server code) | **Web** (static) | `apps/labs/out` |
| mounting-verification | SSR (has an API route) | **Web compute** (SSR) | `apps/mounting-verification/.next` |

> **pnpm + SSR:** The root [`.npmrc`](./.npmrc) sets `node-linker=hoisted` so pnpm produces a flat `node_modules`. This is required for the SSR app — Amplify's Next.js runtime needs the real `next` package present, not a pnpm symlink. Without it the deploy fails with *"The 'node_modules' folder is missing the 'next' dependency"*.

### First-time setup (per app)

1. Push this repo to GitHub/GitLab/Bitbucket.
2. **Amplify console → New app → Host web app** → connect the repo and branch.
   - If you see a GitHub `403 "Resource not accessible by integration"`, the AWS Amplify GitHub App lacks webhook access: GitHub → Settings → Applications → AWS Amplify → Configure → grant this repo. Org repos may need an owner to approve the app.
3. **Enable the monorepo option** and set the app root:
   - First Amplify app → `apps/labs`
   - Second Amplify app → `apps/mounting-verification`
4. Amplify auto-detects Next.js and picks up `amplify.yml`. Confirm the build image uses **Node ≥ 20**.
5. Add **Environment variables** (see the table above) for that app.
6. Deploy.

### Build settings reference (if setting them in the console instead of `amplify.yml`)

| App | App root | Build command | Output directory | Platform |
|-----|----------|---------------|------------------|----------|
| labs | `apps/labs` | `npx turbo run build --filter=labs-clone` | `apps/labs/out` | Web (static) |
| mounting-verification | `apps/mounting-verification` | `npx turbo run build --filter=mounting-verification` | `apps/mounting-verification/.next` | Web compute (SSR) |

If Amplify shows the **Welcome** placeholder with a tip about a missing `index.html`, the app is being served as static when it needs SSR (or vice-versa). Fix the **platform** to match the table above (`aws amplify update-app --app-id <ID> --platform WEB_COMPUTE|WEB`) and redeploy.

Install step (preBuild) for both: `npm install -g pnpm@10.24.0 && pnpm install --frozen-lockfile`.

### Updating a deployment

- **Code changes:** push to the connected branch — Amplify auto-builds and redeploys.
- **Changed `amplify.yml`:** commit and push it; the next build uses the new spec. You can also edit build settings in the console (**App settings → Build settings**), but the committed `amplify.yml` takes precedence.
- **Changed env vars:** update them under **App settings → Environment variables**, then **redeploy** (Amplify → Deployments → Redeploy this version). Note `NEXT_PUBLIC_*` vars only take effect on a fresh build, not a restart.
- **Linking labs → analyzer in prod:** after the mounting-verification app has a domain, set `NEXT_PUBLIC_MOUNTING_VERIFICATION_URL` on the **labs** app to that domain and redeploy labs.
