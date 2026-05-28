# GitHub Secrets Setup Guide for Database Credentials

## Overview
This guide explains how to add database and API credentials as GitHub Secrets so they're automatically available during deployment without exposing them in your code.

## What Credentials You Need

Your application uses:
1. **Supabase Database** (required)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. **Gemini API** (optional, if using AI features)
   - `GEMINI_API_KEY`

3. **Vercel Deployment** (required for deployment)
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

---

## Step 1: Get Supabase Credentials

### Find Your Supabase URL & Anon Key:

1. **Go to Supabase Dashboard**
   - Visit https://app.supabase.com
   - Select your project

2. **Navigate to Settings**
   - Click **Settings** in the left sidebar
   - Click **API** tab

3. **Copy the credentials:**
   - **Project URL** → This is your `VITE_SUPABASE_URL`
   - **Anon public key** (under "Project API keys") → This is your `VITE_SUPABASE_ANON_KEY`

Example:
```
VITE_SUPABASE_URL: https://xyzabc.supabase.co
VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 2: Get Gemini API Key (Optional)

If your app uses Gemini AI features:

1. **Go to Google AI Studio**
   - Visit https://aistudio.google.com/app/apikey

2. **Create API Key**
   - Click "Create API Key"
   - Copy the generated key

3. **This is your `GEMINI_API_KEY`**

---

## Step 3: Add Secrets to GitHub

### Method A: Using GitHub Web UI (Recommended)

1. **Go to Your GitHub Repository**
   - Navigate to your repository: https://github.com/innovatesagor/Billing

2. **Open Settings**
   - Click on **Settings** tab at the top

3. **Go to Secrets and Variables**
   - In the left sidebar, click **Secrets and variables** → **Actions**

4. **Add Each Secret**
   - Click **"New repository secret"** button
   - Enter the secret name and value
   - Click **"Add secret"**

### Secrets to Add:

| Secret Name | Value | Where to Get |
|------------|-------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon Key | Supabase Dashboard → Settings → API |
| `GEMINI_API_KEY` | Your Gemini API Key | Google AI Studio (optional) |
| `VERCEL_TOKEN` | Your Vercel Token | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Your Vercel Org ID | Vercel Project → Settings → General |
| `VERCEL_PROJECT_ID` | Your Vercel Project ID | Vercel Project → Settings → General |

### Method B: Using GitHub CLI

If you have GitHub CLI installed:

```bash
gh secret set VITE_SUPABASE_URL -b "https://your-project.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY -b "your-anon-key-here"
gh secret set GEMINI_API_KEY -b "your-gemini-key-here"
gh secret set VERCEL_TOKEN -b "your-vercel-token"
gh secret set VERCEL_ORG_ID -b "your-org-id"
gh secret set VERCEL_PROJECT_ID -b "your-project-id"
```

---

## Step 4: Verify Secrets in Workflow

The workflow file `.github/workflows/deploy.yml` automatically:

1. **Creates `.env.local` file** during build with your secrets:
   ```yaml
   - name: Create .env.local file
     run: |
       cat > .env.local << EOF
       VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }}
       VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }}
       GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}
       EOF
   ```

2. **Passes them to Vercel deployment** via environment variables

3. **Vite picks them up** as `VITE_*` prefixed variables during build

---

## How It Works During Deployment

```
1. You push code to main branch
   ↓
2. GitHub Actions triggers the workflow
   ↓
3. Workflow reads secrets from GitHub
   ↓
4. Creates .env.local with secret values (never committed)
   ↓
5. Runs: npm run build
   ↓
6. Vite loads VITE_* variables into your app
   ↓
7. App can access them via: import.meta.env.VITE_SUPABASE_URL
   ↓
8. Deploys to Vercel with all variables
   ↓
9. Custom domain serves your app with live database connection
```

---

## Important Security Notes

⚠️ **DO NOT:**
- ❌ Commit `.env.local` to Git
- ❌ Paste secrets in code or comments
- ❌ Share secret values with others
- ❌ Log secrets in console output

✅ **DO:**
- ✅ Use GitHub Secrets Manager
- ✅ Keep `.env.local` in `.gitignore` (should already be there)
- ✅ Rotate keys periodically
- ✅ Use different keys for dev/prod if possible

---

## Troubleshooting

### "Build failed with missing environment variables"
- **Solution**: Check that all `VITE_*` secrets are added to GitHub
- **Verify**: Go to Settings → Secrets and variables → Actions

### "Supabase connection failed"
- **Check**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- **Verify**: Copy-paste directly from Supabase, avoid typos
- **Test**: Run `npm run build` locally with `.env.local` file

### "Secrets show as empty in logs"
- **Expected**: GitHub masks secrets in logs for security
- **Don't worry**: They're still passed correctly to your app

### "Deployment succeeds but app shows blank/errors"
- **Check**: All required secrets are set
- **Verify**: Variables are accessible in your components
- **Test**: `console.log(import.meta.env.VITE_SUPABASE_URL)` to confirm

---

## Next Steps

1. ✅ Copy credentials from Supabase, Gemini, and Vercel
2. ✅ Add all 6 secrets to GitHub
3. ✅ Make a test commit to main branch
4. ✅ Watch GitHub Actions → Actions tab for workflow run
5. ✅ Check deployment status on Vercel dashboard
6. ✅ Visit your custom domain to test the live app

**That's it! Your app will now automatically deploy with database credentials every time you push to main.** 🚀
