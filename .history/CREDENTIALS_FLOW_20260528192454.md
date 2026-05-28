# Database Credentials Flow Diagram

## 🔐 How Your Database Credentials Work

### Full Flow for GitHub → Vercel → Your App

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Store Secrets in GitHub                         │
│ GitHub → Settings → Secrets and variables → Actions     │
│                                                          │
│ VITE_SUPABASE_URL = "https://xxx.supabase.co"          │
│ VITE_SUPABASE_ANON_KEY = "eyJhbGc..."                  │
│ GEMINI_API_KEY = "AIzaSyD..."                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 2: GitHub Actions Workflow Runs                    │
│ .github/workflows/deploy.yml triggers on: git push main │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Create .env.local (not committed!)              │
│                                                          │
│ run: |                                                   │
│   cat > .env.local << EOF                              │
│   VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }}   │
│   VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }}
│   GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}         │
│   EOF                                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Build Project                                   │
│ npm install && npm run build                            │
│                                                          │
│ Vite reads .env.local and loads VITE_* variables       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 5: Deploy to Vercel                                │
│ Pass env vars to Vercel deployment                      │
│                                                          │
│ vercel:                                                 │
│   env:                                                  │
│     VITE_SUPABASE_URL: ...                             │
│     VITE_SUPABASE_ANON_KEY: ...                        │
│     GEMINI_API_KEY: ...                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 6: App Accesses Credentials                        │
│                                                          │
│ // In services/supabase.ts:                            │
│ const supabaseUrl = import.meta.env.VITE_SUPABASE_URL   │
│ const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
│                                                          │
│ // In your components:                                 │
│ const supabase = getSupabase()                         │
│ const { data } = await supabase.from('reports').select()
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 7: Connected to Your Database!                     │
│ App talks to Supabase using provided credentials       │
│ Served on your custom domain with HTTPS                │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Files Involved

### GitHub Configuration
```
.github/
└── workflows/
    └── deploy.yml  ← Reads secrets, builds, deploys
```

### Your App Code
```
services/
└── supabase.ts  ← Uses import.meta.env.VITE_SUPABASE_URL
                    and import.meta.env.VITE_SUPABASE_ANON_KEY

vite.config.ts  ← Loads env variables

package.json    ← Scripts for build
```

### Environment Files (DO NOT COMMIT)
```
.env.local  ← Created during workflow (NEVER committed)
.gitignore  ← Should include .env.local
```

---

## 🔐 Security Layers

```
GitHub Secrets Vault
      ↓
   Encrypted
      ↓
Only visible to GitHub Actions
      ↓
Passed to build process
      ↓
Compiled into Vite bundle
      ↓
Shipped to Vercel
      ↓
Never logged or exposed
      ↓
Only accessible at runtime to your app
```

### What's NOT Happening ❌
- ❌ Secrets are NOT in your code repository
- ❌ Secrets are NOT visible in Git history
- ❌ Secrets are NOT in logs or console output
- ❌ Secrets are NOT hardcoded anywhere

### What IS Happening ✅
- ✅ Secrets encrypted in GitHub
- ✅ Only your app can access them at runtime
- ✅ Each deployment gets fresh values
- ✅ Perfect for CI/CD pipelines

---

## 🛠️ Environment Variables in Your Code

### Current Usage (Supabase)
```typescript
// services/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not configured');
  return null;
}
```

### If You Need More Variables
Just add them to:

1. **GitHub Secrets** → Add new secret
2. **Workflow file** → Add to `.env.local` creation
   ```yaml
   cat > .env.local << EOF
   VITE_YOUR_NEW_VAR=${{ secrets.YOUR_NEW_SECRET }}
   EOF
   ```
3. **Workflow file** → Add to env section
   ```yaml
   env:
     VITE_YOUR_NEW_VAR: ${{ secrets.YOUR_NEW_SECRET }}
   ```
4. **Use in code** → `import.meta.env.VITE_YOUR_NEW_VAR`

---

## 🧪 Testing Locally

### Before Pushing (Local Development)

1. **Create `.env.local` file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in actual values** (for testing only):
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-key-here
   GEMINI_API_KEY=your-key-here
   ```

3. **Run locally:**
   ```bash
   npm install
   npm run dev
   ```

4. **Test that Supabase works:**
   - Query some data
   - Check that database connection works
   - Verify no console errors

5. **Delete `.env.local` before committing:**
   ```bash
   rm .env.local
   ```

### After Pushing (CI/CD Verification)

1. **Go to GitHub Actions**
   - Repository → Actions tab
   - Check latest workflow run

2. **Look for status:**
   - ✅ "Checkout code" - Success
   - ✅ "Setup Node.js" - Success
   - ✅ "Create .env.local file" - Success (secrets hidden)
   - ✅ "Build project" - Success
   - ✅ "Deploy to Vercel" - Success

3. **Check Vercel Dashboard**
   - Deployment details
   - Environment variables listed
   - Logs show successful build

4. **Visit Your Domain**
   - Should be live with database connected
   - Check browser console for any errors
   - Test database functionality

---

## ⚡ Quick Reference

| Task | Command |
|------|---------|
| Copy env template | `cp .env.example .env.local` |
| Test build locally | `npm run build` |
| Check env vars exist | `echo $VITE_SUPABASE_URL` |
| View GitHub Actions | GitHub → Actions tab |
| View Vercel deploy | vercel.com → Dashboard |
| Check logs | GitHub Actions or Vercel logs |

---

## 🚨 Common Issues & Solutions

### "Supabase connection failed"
```
Likely Cause: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set
Solution: Verify both secrets are in GitHub Settings → Secrets
```

### "Build succeeds but app is blank"
```
Likely Cause: Variables not accessible to browser
Solution: Ensure VITE_* prefix on all env variable names
```

### "Deployment fails during build"
```
Likely Cause: Missing required env variables
Solution: Check GitHub Actions logs for which variable is missing
Add it to GitHub Secrets if not present
```

### "Secrets show as [MASKED] in logs"
```
This is EXPECTED: GitHub masks secrets for security
Your app still receives the values correctly
```

---

## ✨ You're All Set!

Your credentials now flow securely from GitHub → Vercel → Your App with:
- 🔐 Zero hardcoding
- 🛡️ Enterprise-grade security
- 🚀 Automatic deployment
- ♻️ Easy credential rotation
- 📊 Full database connectivity

**Ready to deploy!** 🎉
