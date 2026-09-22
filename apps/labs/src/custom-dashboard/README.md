# Custom Dashboard

Custom Dashboard lets users build their own dashboards: they ask a question in plain language, and each answer becomes a chart widget they can arrange on a grid. It is a separate application from Talk to Data / Report Builder. It only calls the talk-to-data HTTP API to get its data.

- Page: `/custom-dashboard`. The flow goes from the persona screen to `/custom-dashboard/dashboards` to `/custom-dashboard/dashboards/[id]`.
- API: `/api/custom-dashboard/*`. It's behind the labs login middleware like every other route.
- Every user sees the same data: one server-side token and one tenant.

## Layout

| Path | What |
|---|---|
| `src/custom-dashboard/ui/` | Client UI (JSX, zustand stores, ECharts, react-grid-layout) |
| `src/custom-dashboard/server/` | Server modules: upstream client, storage, OpenAI calls, chart generation |
| `src/custom-dashboard/styles.css` | All feature CSS, imported once by the route layout |
| `src/app/custom-dashboard/` | Pages |
| `src/app/api/custom-dashboard/` | Route handlers |

Where data comes from:
- **Rows:** `server/upstream.ts` calls `POST {CD_LM_API_BASE}/talk-to-data`.
- **OpenAI:** `server/llm.ts` is the only place that calls it. It's server-side only and used for chart generation, widget/dashboard names, the date-range fallback and persona starter questions.

## Local setup

The feature only adds new files. It doesn't touch the labs `package.json` or config.

1. Install the feature's client libraries into this folder (the result is gitignored):
   ```bash
   cd apps/labs/src/custom-dashboard
   npm install --legacy-peer-deps   # --legacy-peer-deps: reuse labs' React, don't install a second copy
   ```
2. Create `apps/labs/.env.development.local`. It's gitignored and only loaded by `next dev`.
   ```bash
   # Talk-to-data gateway + token (prod: white-v2 / dashboard.lightmetrics.co; QA: qa-is-usw2 / dashboard-qa)
   CD_LM_API_BASE=https://white-v2.lightmetrics.co/llm-chat
   CD_LM_REFERER=https://dashboard.lightmetrics.co/
   CD_LM_ACCESS_TOKEN=<x-access-token from a dashboard login for that environment>
   CD_LM_USER_TIMEZONE=Asia/Calcutta
   CD_CLIENT_ID=lmpresales
   CD_FLEET_ID=acmetransport

   CD_OPENAI_API_KEY=<key>
   CD_VIZ_MODEL=gpt-4o
   CD_UTILITY_MODEL=gpt-4o-mini

   # JSON storage, relative to apps/labs
   CD_DASHBOARD_DATA_DIR=.data/custom-dashboard

   # Labs' own local escape hatch for the login middleware
   SKIP_AUTH=true
   ```
   Optional: `CD_DATERANGE_PICKER_PREFILL`, `CD_USER_NAME`, `CD_SUGGESTION_TTL_DAYS`, `CD_UPSTREAM_CONNECT_TIMEOUT`, `CD_UPSTREAM_READ_TIMEOUT`.
3. Run labs: `cd apps/labs && npx next dev --port 3001`, then open http://localhost:3001/custom-dashboard.
   - `GET /api/custom-dashboard/health` lists any settings that are missing.

A token only works against the gateway of the environment it was issued for. A production login token sent to QA gets `401 Session expired`.

## Not deployable yet

These changes touch existing labs files, so each one needs approval first:

- **Dependencies:** add `echarts`, `echarts-for-react`, `react-grid-layout`, `react-resizable` and `zustand` to `apps/labs/package.json` and `pnpm-lock.yaml`, then delete this folder's `package.json` and `package-lock.json`. Amplify runs `pnpm install --frozen-lockfile`, which never installs this folder, so `next build` fails without this change.
- **`amplify.yml`:** add the `CD_*` names to the `env | grep` list so they reach the server runtime.
- **`.gitignore`:** add `.data/`.
- **`src/app/(site)/ExperimentsShowcase.tsx`:** add a "Custom Dashboard" card. It shows six cards today, so either change `bottomRow` to `FEATURED.slice(3)` or replace a card.

Hosting limits on Amplify:
- Server responses are cut off after 30 seconds, and `/api/custom-dashboard/chat/ask` can take longer.
- JSON files under `.data/` don't persist, so storage needs to move to S3 (see the plan in `server/storage.ts`).
- The token should be a long-lived service token, not a login JWT that expires in a day.
