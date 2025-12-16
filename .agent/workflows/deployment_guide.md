---
description: How to deploy Bunks to Vercel via GitHub
---

# Deployment to Vercel

This guide walks through connecting your local Bunks codebase to Vercel for continuous deployment.

## 1. Prepare Local Repository
Ensure your local git repository is committed and clean.
```bash
git add .
git commit -m "Deployment release candidate"
```

## 2. GitHub Setup
1.  Go to [GitHub.com](https://github.com/new).
2.  Create a **New Repository**.
    *   Name: `bunks-platform` (or similar)
    *   Visibility: **Private** (Recommended since it contains business logic).
3.  **Do not** initialize with README/gitignore (we have them).
4.  Copy the remote URL (e.g., `git@github.com:username/bunks-platform.git`).
5.  Link your local folder to GitHub:
    ```bash
    git remote add origin <YOUR_GITHUB_URL>
    git branch -M main
    git push -u origin main
    ```

## 3. Vercel Setup
1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** > **Project**.
3.  Select **Import** next to your `bunks-platform` repository.
4.  **Framework Preset**: Next.js (Default)
5.  **Root Directory**: `./` (Default)
6.  **Environment Variables**: You MUST copy these from your `.env` file to Vercel.
    *   `DATABASE_URL`
    *   `SHADOW_DATABASE_URL` (Optional for prod, but good for migrations)
    *   `NEXT_PUBLIC_APP_URL` (Set to your Vercel URL, e.g. `https://bunks-platform.vercel.app`)
    *   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
    *   `STRIPE_SECRET_KEY`
    *   `STRIPE_WEBHOOK_SECRET`
    *   `RESEND_API_KEY`
    *   `ADMIN_EMAIL`
    *   `CRON_SECRET` (Generate a strong random string)
    
7.  Click **Deploy**.

## 4. Post-Deployment Checks
*   **Database**: Ensure your Production Database (e.g. Supabase, Neon, AWS RDS) allows connections from Vercel (0.0.0.0/0 or Vercel IP range).
*   **Stripe**: Add your Production URL to Stripe Webhook settings.
*   **DNS**: Go to Vercel Settings > Domains to add `www.yourdomain.com`.
