# GitHub Actions Auto-Deploy Setup Guide

## Overview
This guide will help you set up automatic deployment to Vercel with a custom domain whenever you push to the `main` branch.

## Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository (https://github.com)
- Domain name (either from Vercel or external provider)

## Setup Steps

### Step 1: Get Vercel Tokens & IDs

1. **Visit Vercel Settings**
   - Go to https://vercel.com/account/tokens
   - Click "Create" to generate a new token
   - Copy the token (you'll need this later)

2. **Get Organization & Project IDs**
   - Go to your project on Vercel
   - Click on "Settings" → "General"
   - Find and copy:
     - **VERCEL_ORG_ID**: Your organization ID
     - **VERCEL_PROJECT_ID**: Your project ID

### Step 2: Configure GitHub Secrets

1. **Go to your GitHub Repository**
   - Navigate to Settings → Secrets and variables → Actions

2. **Add these three secrets:**
   - `VERCEL_TOKEN` → (paste the token from Step 1)
   - `VERCEL_ORG_ID` → (your organization ID)
   - `VERCEL_PROJECT_ID` → (your project ID)

### Step 3: Configure Custom Domain in Vercel

**Option A: Using Vercel's Managed Domain**
1. Go to your project on Vercel
2. Click "Settings" → "Domains"
3. Click "Add" and register a domain directly through Vercel
4. Vercel will handle DNS automatically

**Option B: Using External Domain Provider**
1. Go to your project on Vercel
2. Click "Settings" → "Domains"
3. Click "Add" and enter your domain name
4. Follow the DNS configuration instructions
5. Update your domain's DNS records:
   - Go to your domain provider (GoDaddy, Namecheap, etc.)
   - Add CNAME/A records pointing to Vercel
   - Vercel will provide exact instructions

### Step 4: Verify Workflow Configuration

The workflow file `.github/workflows/deploy.yml` is already configured to:
- ✅ Trigger on every push to `main` branch
- ✅ Install dependencies
- ✅ Run TypeScript linting
- ✅ Build the project
- ✅ Deploy to Vercel with your custom domain

## How It Works

1. **You push code to main branch**
   ```bash
   git push origin main
   ```

2. **GitHub Actions automatically:**
   - Checks out your code
   - Installs dependencies
   - Runs linting (continues even if warnings exist)
   - Builds the project
   - Deploys to Vercel using your credentials

3. **Vercel automatically:**
   - Builds your application
   - Serves it on your custom domain
   - Manages SSL certificates (automatic HTTPS)

## Deployment Statuses

You can view deployment progress:
- **GitHub Actions**: Repository → Actions tab
- **Vercel**: Your project dashboard

## Important Notes

⚠️ **Do NOT commit secrets!** They are configured via GitHub's secret manager.

✅ **Pull Requests**: The workflow also runs on pull requests (without deploying) to verify builds work.

✅ **Custom Domain**: Once configured in Vercel, it works automatically with every deployment.

## Troubleshooting

**Deployment fails?**
- Check GitHub Actions logs: Repository → Actions tab
- Verify all three secrets are set correctly
- Ensure `vercel.json` build settings match your project

**Custom domain not working?**
- DNS changes can take 24-48 hours to propagate
- Verify DNS records at your domain provider
- Check Vercel domain settings: Project → Settings → Domains

**Build fails?**
- Run `npm run build` locally to test
- Check for missing environment variables
- Verify Node.js version compatibility

## Current Project Configuration

- **Framework**: Vite + React
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18 (in workflow)
- **Package Manager**: npm

## Next Steps

1. Push this repository to GitHub (if not already)
2. Add the three secrets to GitHub
3. Configure your custom domain in Vercel
4. Make a test commit to `main` branch
5. Watch it auto-deploy! 🚀
