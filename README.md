# DVR Assistant

Chat UI for finding trips and requesting dashcam footage (DVR clips and
timelapses). A Next.js front end for the Flask DVR backend (`main-DVR.py`).

There is no login: anyone with the URL can use the app.

## Which backend it uses

| Command | Backend |
|---|---|
| `npm run dev` | Flask on `localhost:8080` |
| `npm run build` (and Amplify) | `dvrrequest-flow-production.up.railway.app` |

Both are decided in `next.config.mjs`. `BACKEND_URL` and `NEXT_PUBLIC_WS_URL`
override them (see `.env.local.example`) but aren't needed.

- **HTTP** (`/:fleet/load-data?clientId=…`, `/health`, `/static/*`) is proxied
  through the rewrites in `next.config.mjs`.
- **WebSocket** (`/chat`) connects straight to the backend, because Next
  rewrites can't proxy WebSockets.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
```

Run the Flask backend on `:8080` first.

## Deploying on AWS Amplify

1. Push this repo to GitHub.
2. Amplify console → **New app → Host web app → GitHub** → pick this repo
   and branch. `amplify.yml` is picked up automatically.
3. Deploy. No environment variables are needed; the build uses the Railway
   backend.
