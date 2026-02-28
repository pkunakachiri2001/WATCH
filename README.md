# RYLO Watch + Hub Deployment

This repo contains:
- `watch-app/` → Vite + React smartwatch frontend
- `hub-server/` → Node.js WebSocket hub for Watch ↔ Unity
- `unity-scripts/` → Unity C# integration scripts

## 1) Push to GitHub

From repo root:

```bash
git init
git add .
git commit -m "Initial RYLO watch + hub"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 2) Deploy on Render (Recommended)

### Option A: Blueprint (using `render.yaml`)
1. In Render dashboard, choose **New +** → **Blueprint**.
2. Connect your GitHub repo.
3. Render will create two services from `render.yaml`:
   - `rylo-hub` (Node web service)
   - `rylo-watch` (static site)

### Option B: Manual services
Create:
1. Web Service from `hub-server`
2. Static Site from `watch-app`

## 3) Configure environment variables

After deploy, set this on the **rylo-watch** service:
- `VITE_HUB_URL = wss://<your-rylo-hub-domain>.onrender.com`

Then redeploy the static site.

## 4) Verify deployment

- Hub health endpoint:
  - `https://<your-rylo-hub-domain>.onrender.com/health`
- Watch app:
  - `https://<your-rylo-watch-domain>.onrender.com`

In the watch UI, connection status should show online once hub is reachable.

## 5) Unity connection

In Unity (`RyloHubClient.cs`), set hub URL to:
- `wss://<your-rylo-hub-domain>.onrender.com`

For local development, keep:
- `ws://localhost:8080`

## Local development

### Hub
```bash
cd hub-server
npm install
npm start
```

### Watch app
```bash
cd watch-app
npm install
npm run dev
```

Optional local env (`watch-app/.env.local`):
```env
VITE_HUB_URL=ws://localhost:8080
```

## Notes

- Free Render instances can sleep; first request may take longer.
- Use `wss://` for production secure WebSocket connections.
