# Step-by-Step: Adding GitHub Secrets

## 🎯 Visual Guide to Adding Your Database Credentials

---

## Step 1: Go to Your GitHub Repository

```
Browser → https://github.com/innovatesagor/Billing
```

You should see your project repo page.

---

## Step 2: Click Settings Tab

```
Repository page
│
├── Code (current tab)
├── Issues
├── Pull requests
├── Discussions
├── Actions
└── Settings ← CLICK HERE
```

Click the **Settings** tab at the top of your repository.

---

## Step 3: Find Secrets in Left Sidebar

```
Settings page
│
├── General
├── Collaborators and access
├── Moderation options
├── Code and automation
│   ├── Actions
│   ├── Deployment
│   ├── Environments
│   ├── Branches
│   └── Rules
│
└── Security
    ├── Secret scanning
    ├── Dependabot
    ├── Code security and analysis
    └── Secrets and variables ← LOOK HERE
        └── Actions ← CLICK HERE
```

In the left sidebar, expand **"Security"** section, then click **"Secrets and variables"** → **"Actions"**.

---

## Step 4: Create Each Secret

You should see a page like this:

```
┌──────────────────────────────────────────────────┐
│ Actions secrets and variables                     │
│                                                   │
│ [New repository secret] [New environment secret] │
│                                                   │
│ Repository secrets                               │
│ ┌────────────────────────────────────────────┐   │
│ │ (None yet - add secrets below)              │   │
│ └────────────────────────────────────────────┘   │
│                                                   │
│ Repository variables                             │
│ ┌────────────────────────────────────────────┐   │
│ │ (None yet)                                  │   │
│ └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

Click **"New repository secret"** button.

---

## Step 5: Add First Secret - VITE_SUPABASE_URL

A form will appear:

```
┌────────────────────────────────────────────┐
│ Add a new secret                           │
├────────────────────────────────────────────┤
│                                            │
│ Name *                                     │
│ ┌──────────────────────────────────────┐  │
│ │ VITE_SUPABASE_URL                    │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Value *                                    │
│ ┌──────────────────────────────────────┐  │
│ │ https://xyzabc.supabase.co           │  │
│ └──────────────────────────────────────┘  │
│                                            │
│                    [Add secret] [Cancel]   │
│                                            │
└────────────────────────────────────────────┘
```

**Fill in:**
- **Name:** `VITE_SUPABASE_URL`
- **Value:** Your Supabase URL (from Supabase → Settings → API)

Click **"Add secret"**

---

## Step 6: Add Second Secret - VITE_SUPABASE_ANON_KEY

Repeat Step 4, then:

```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

(From Supabase → Settings → API → Anon public key)

Click **"Add secret"**

---

## Step 7: Add Third Secret - GEMINI_API_KEY (Optional)

If using AI features:

```
Name: GEMINI_API_KEY
Value: AIzaSyD...
```

(From Google AI Studio)

Click **"Add secret"** (or skip if not using)

---

## Step 8: Add Fourth Secret - VERCEL_TOKEN

```
Name: VERCEL_TOKEN
Value: your_vercel_token_here
```

(From Vercel → Settings → Tokens)

Click **"Add secret"**

---

## Step 9: Add Fifth Secret - VERCEL_ORG_ID

```
Name: VERCEL_ORG_ID
Value: your_org_id_here
```

(From Vercel → Project → Settings → General)

Click **"Add secret"**

---

## Step 10: Add Sixth Secret - VERCEL_PROJECT_ID

```
Name: VERCEL_PROJECT_ID
Value: your_project_id_here
```

(From Vercel → Project → Settings → General)

Click **"Add secret"**

---

## ✅ Verify All Secrets Added

After adding all 6, your secrets page should show:

```
┌────────────────────────────────────────────┐
│ Actions secrets and variables              │
│                                            │
│ Repository secrets (6)                     │
│ ┌──────────────────────────────────────┐   │
│ │ VITE_SUPABASE_URL    [Edit] [Delete] │   │
│ │ VITE_SUPABASE_ANON_KEY [Edit] [Delete] │
│ │ GEMINI_API_KEY       [Edit] [Delete] │   │
│ │ VERCEL_TOKEN         [Edit] [Delete] │   │
│ │ VERCEL_ORG_ID        [Edit] [Delete] │   │
│ │ VERCEL_PROJECT_ID    [Edit] [Delete] │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ Repository variables (0)                   │
│ ┌──────────────────────────────────────┐   │
│ │ (None)                               │   │
│ └──────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

---

## 🎉 Done!

All secrets are now stored securely in GitHub. The workflow will automatically use them when you push code.

---

## 🔒 Important Notes

- ✅ Secrets are **encrypted** in GitHub
- ✅ **Never displayed** in logs
- ✅ Only used by **GitHub Actions workflow**
- ✅ **Cannot be viewed** after creation (only edited/deleted)
- ✅ You can **edit** them anytime if values change
- ✅ You can **delete** them if no longer needed

---

## 🚨 If You Made a Mistake

**Exposed a secret?** Don't worry, regenerate it:

### For Supabase:
1. Go to Supabase → Settings → API
2. Click "Regenerate" on the anon key
3. Update the secret in GitHub

### For Vercel:
1. Go to Vercel → Settings → Tokens
2. Delete the old token
3. Create a new one
4. Update in GitHub

### For Gemini:
1. Go to Google AI Studio
2. Delete old key
3. Create new key
4. Update in GitHub

---

## 🔄 What Happens Next

```
1. Secrets are stored in GitHub
   ↓
2. You push code: git push origin main
   ↓
3. GitHub Actions workflow triggers
   ↓
4. Workflow reads secrets (never shown in logs)
   ↓
5. Creates .env.local with secret values
   ↓
6. Builds your app with npm run build
   ↓
7. Passes secrets to Vercel
   ↓
8. Vercel deploys your app
   ↓
9. Your app connects to Supabase database
   ↓
10. ✅ Live on custom domain!
```

---

## 📝 Checklist

- [ ] Found Settings → Secrets and variables → Actions
- [ ] Added VITE_SUPABASE_URL
- [ ] Added VITE_SUPABASE_ANON_KEY
- [ ] Added GEMINI_API_KEY (optional)
- [ ] Added VERCEL_TOKEN
- [ ] Added VERCEL_ORG_ID
- [ ] Added VERCEL_PROJECT_ID
- [ ] All 6 secrets show in the list

**You're ready to deploy!** 🚀

---

## 💡 Quick Commands for Next Step

After adding secrets:

```bash
# Make a small change to test
echo "// test" >> App.tsx

# Commit and push
git add .
git commit -m "Add deployment workflow"
git push origin main

# Watch it deploy!
# GitHub: Repository → Actions tab
# Vercel: Dashboard → Deployments
```

That's it! Auto-deployment is now active. ✨
