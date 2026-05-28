# Quick Setup Checklist

## 🚀 Complete Setup in 5 Minutes

### 1️⃣ Get Supabase Credentials
- [ ] Go to https://app.supabase.com → Your Project
- [ ] Settings → API
- [ ] Copy **Project URL** (VITE_SUPABASE_URL)
- [ ] Copy **Anon Key** (VITE_SUPABASE_ANON_KEY)

### 2️⃣ Get Vercel IDs (if not done yet)
- [ ] Go to https://vercel.com → Your Project
- [ ] Settings → General
- [ ] Copy **VERCEL_ORG_ID**
- [ ] Copy **VERCEL_PROJECT_ID**
- [ ] Settings → Tokens → Create & copy **VERCEL_TOKEN**

### 3️⃣ Add Secrets to GitHub
Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

Click "New repository secret" and add:

```
Name: VITE_SUPABASE_URL
Value: https://your-project.supabase.co

Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Name: GEMINI_API_KEY
Value: AIzaSyD... (optional, if using AI)

Name: VERCEL_TOKEN
Value: from Vercel settings

Name: VERCEL_ORG_ID
Value: from Vercel project

Name: VERCEL_PROJECT_ID
Value: from Vercel project
```

### 4️⃣ Set Custom Domain
- [ ] Go to https://vercel.com → Your Project
- [ ] Settings → Domains
- [ ] Add your custom domain
- [ ] Update DNS if external domain

### 5️⃣ Test Deployment
- [ ] Make a small code change
- [ ] Push to main: `git push origin main`
- [ ] Watch: GitHub → Actions tab
- [ ] Check: Vercel dashboard for deployment
- [ ] Visit: Your custom domain ✨

---

## 📋 Secrets Reference

| What | Where to Get | GitHub Secret Name |
|-----|-------------|-------------------|
| Supabase URL | Supabase → Settings → API | `VITE_SUPABASE_URL` |
| Supabase Key | Supabase → Settings → API | `VITE_SUPABASE_ANON_KEY` |
| Gemini Key | Google AI Studio | `GEMINI_API_KEY` |
| Vercel Token | Vercel → Settings → Tokens | `VERCEL_TOKEN` |
| Vercel Org ID | Vercel Project → Settings | `VERCEL_ORG_ID` |
| Vercel Project ID | Vercel Project → Settings | `VERCEL_PROJECT_ID` |

---

## 🔄 How Auto-Deployment Works

```
git push origin main
    ↓
GitHub Actions triggers
    ↓
Reads secrets from GitHub
    ↓
Creates .env.local (not committed)
    ↓
npm install && npm run build
    ↓
Vite loads VITE_* variables
    ↓
Deploy to Vercel with env vars
    ↓
Vercel serves on custom domain
    ↓
✅ Live with database connection!
```

---

## ❓ Need Help?

- **Full Setup Guide**: See `DATABASE_SECRETS_SETUP.md`
- **Workflow Details**: See `GITHUB_ACTIONS_SETUP.md`
- **Workflow File**: See `.github/workflows/deploy.yml`

---

## 🎯 What's Automated

✅ Build on every push to main  
✅ Run tests/linting  
✅ Deploy to Vercel  
✅ Serve on custom domain  
✅ Database credentials injected  
✅ SSL/HTTPS automatic  
✅ Pull requests get preview deployments  

**No manual deployment needed!** 🚀
