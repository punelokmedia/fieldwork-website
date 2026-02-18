# Deployment Guide for FieldWork

This guide will help you deploy the **Backend directly to Railway** and the **Frontend to Vercel**.

## 🚀 1. Deploy Frontend (Vercel)

1.  **Create a New Project on Vercel**:
    *   Dashboard -> Add New -> Project -> Import Git Repository.
    *   Find this `filed-work-website` repo.

2.  **Configure Project Settings**:
    *   **Root Directory**: Set this to `client` (Click Edit next to Root Directory).
    *   **Framework Preset**: Vite (should be auto-detected).
    *   **Build Command**: `npm run build` (default).
    *   **Output Directory**: `dist` (default).

3.  **Environment Variables**:
    *   Add `VITE_API_URL` -> Set this to your Railway Backend URL (e.g., `https://your-app.up.railway.app`).
        *   *Note: Since you haven't deployed the backend yet, you can leave this blank initially or put a placeholder, then return to update it later and redeploy.*

4.  **Click Deploy**.

---

## 🚂 2. Deploy Backend (Railway)

1.  **Create a New Service on Railway**:
    *   Dashboard -> New Project -> Deploy from GitHub repo.
    *   Select this `filed-work-website` repo.

2.  **Configure Service Settings**:
    *   **Variables**: Add all the environment variables from your `server/.env` file. These are CRITICAL.
        *   `NODE_ENV` = `production`
        *   `PORT` = `5000` (Railway provides `PORT`, but setting a default is safe)
        *   `MONGO_URI`
        *   `JWT_SECRET`
        *   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
        *   `OPENAI_API_KEY`
        *   `GEMINI_API_KEY`
        *   Facebook/Instagram Tokens (`FACEBOOK_PAGE_ACCESS_TOKEN`, etc.)

3.  **Settings -> Root Directory**:
    *   Find the "Root Directory" or "Watch Paths" setting.
    *   Set it to `/server` so Railway knows where the backend code lives.
    *   Alternatively, you can just deploy the `server` folder if your repo structure supports it, but setting the Root Directory is standard for monorepos.

4.  **Wait for Build**: Railway will detect the `package.json` and `Procfile` inside `/server` and start the app.

---

## 🔗 3. Final Connection

1.  **Get Railway URL**: Once the backend is live, copy the public URL (e.g., `https://fieldwork-production.up.railway.app`).
2.  **Update Vercel**:
    *   Go back to your Vercel Project Settings -> Environment Variables.
    *   Update `VITE_API_URL` with the Railway URL (no trailing slash).
    *   Go to **Deployments** and **Redeploy** the latest commit for changes to take effect.

## ✅ Verification
- Open your Vercel app URL.
- Try to Login.
- If it works, you are live!
