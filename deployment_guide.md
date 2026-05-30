# Deployment Guide - AI Usage Guardian 🚀

This document outlines instructions for deploying **AI Usage Guardian** components to cloud environments.

---

## 💾 Database: Supabase Production Settings
For a production environment:
1. Ensure your tables are protected with Row Level Security (RLS) policies if you connect directly client-side. In our current architecture, the extension and SaaS frontend route requests through our FastAPI backend, which acts as the security layer.
2. In the Supabase Console, navigate to **Settings** -> **Database** -> **Connection pooling** and use the **Transaction Pooler** connection port (typically `6543`) to prevent socket exhaustion during scaling.

---

## ⚡ Backend: FastAPI on Render
Render is a developer-friendly platform to host Python web services for free.

### Setup Steps:
1. Push your code repository (or backend subdirectory) to GitHub or GitLab.
2. Log into [Render](https://render.com/) and create a new **Web Service**.
3. Link your GitHub repository.
4. Configure the following details:
   - **Name:** `ai-usage-guardian-api`
   - **Region:** Choose the region closest to your users.
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Click **Advanced** and add the environment variables:
   - `DATABASE_URL`: Add your production Supabase Transaction Pooler URI.
   - `SECRET_KEY`: Set a long, random alphanumeric string for token validation.
6. Click **Create Web Service**. Render will automatically provision an SSL certificate and assign a URL like `https://ai-usage-guardian-api.onrender.com`.

---

## 🖥️ Frontend: React on Vercel
Vercel provides optimized speed and automatic edge-network deployments for React/Vite builds.

### Setup Steps:
1. Log into [Vercel](https://vercel.com/) and click **Add New Project**.
2. Select your GitHub repository.
3. Configure the Root Directory or Framework settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend/` (if deploying from monorepo)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variables (optional if configuring backend overrides):
   - Add a key `VITE_API_URL` pointing to your deployed Render URL `https://ai-usage-guardian-api.onrender.com/api/v1` if you parameterized the endpoint.
5. Click **Deploy**. Vercel will build and assign a custom sub-domain like `https://ai-usage-guardian.vercel.app`.

---

## 🔌 Browser Extension Publishing (Chrome Web Store)
To share the Chrome extension with other users:
1. Build the production build locally:
   ```bash
   cd extension
   npm run build
   ```
2. Compress the contents of the `extension/dist/` directory into a `.zip` archive.
3. Go to the [Chrome Developer Console](https://chrome.google.com/webstore/devconsole/).
4. Pay the developer registration fee (one-time $5 fee requested by Google).
5. Click **Add new item** and upload the zip file.
6. Fill in the store listing metadata:
   - **Name:** AI Usage Guardian
   - **Detailed Description:** Local limits tracker, messaging budget notifications, prompt optimizer, and productivity insights.
   - **Icons:** Upload a 128x128 screenshot of your orange shield icon.
   - **Screenshots:** Provide images demonstrating the injected "Usage summary" widget.
7. Under **Privacy Practices**, declare the permissions requested:
   - `storage`: Needed to keep local token cache.
   - `alarms`: Needed to run periodic sync worker.
   - `notifications`: Needed to warn user at 50/75/90/100% budget exhaustion.
8. Submit for review. Standard approvals take 24-72 hours.
