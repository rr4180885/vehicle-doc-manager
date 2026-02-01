# Vercel Setup Guide - Final Steps

Your code has been deployed! Now follow these steps to configure your Vercel deployment:

## Step 1: Add Environment Variables to Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Click on your "vehicle-doc-manager" project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

### Required Environment Variables:

**DATABASE_URL**
```
postgresql://neondb_owner:npg_g6plW3nEQcdz@ep-raspy-field-ah6l1hrd-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```
*(Note: Remove `&channel_binding=require` from the connection string for Vercel)*

**SESSION_SECRET**
```
vehicle-doc-manager-secret-key-change-in-production-kisun01-2026
```

**NODE_ENV**
```
production
```

5. After adding each variable, make sure to check **Production**, **Preview**, and **Development** environments
6. Click "Save"

## Step 2: Initialize Database Schema

Run this command locally to create the database tables:

```bash
npm run db:push
```

This will create the necessary tables in your Neon database.

## Step 3: Redeploy

After adding environment variables:

1. Go to **Deployments** tab in Vercel
2. Click on the latest deployment
3. Click the **⋯** menu (three dots)
4. Select **Redeploy**
5. Check "Use existing Build Cache"
6. Click **Redeploy**

## Step 4: Test Your Application

Once redeployed (takes 2-3 minutes):

1. Visit: https://vehicle-doc-manager.vercel.app/
2. You should see the landing page
3. Try logging in with:
   - **Username**: `kisun01`
   - **Password**: `Kisun@7257`

## Troubleshooting

### If you still see errors:

1. **Check Vercel Function Logs**:
   - Go to your project → **Deployments** → Click latest deployment
   - Click **Functions** tab
   - Click on `/api` function
   - Check the logs for errors

2. **Verify Environment Variables**:
   - Go to **Settings** → **Environment Variables**
   - Make sure all 3 variables are set
   - Make sure they're enabled for "Production"

3. **Check Database Connection**:
   - The DATABASE_URL should NOT have `&channel_binding=require`
   - Should look like: `postgresql://...?sslmode=require`

### Common Issues:

**"Database not configured" error**:
- Environment variables not set in Vercel
- Redeploy after adding env vars

**"Cannot connect to database" error**:
- Check if DATABASE_URL is correct
- Remove `&channel_binding=require` from connection string
- Verify Neon database is active

**Session/Login issues**:
- Make sure SESSION_SECRET is set
- Clear browser cookies and try again

## Optional: Enable Vercel Blob Storage

For file uploads to work in production:

1. In Vercel dashboard → **Storage**
2. Click "Create Database" → **Blob**
3. Create the blob store
4. `BLOB_READ_WRITE_TOKEN` will be auto-added to env vars
5. Redeploy

## Success Indicators:

✅ Landing page loads without blank screen
✅ Can login with credentials
✅ Dashboard displays (even if empty)
✅ No 500 errors in browser console

## Your Deployment URLs:

- **Production**: https://vehicle-doc-manager.vercel.app/
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repo**: https://github.com/rr4180885/vehicle-doc-manager

---

## Quick Command Reference:

```bash
# Initialize database schema
npm run db:push

# Test locally
npm run dev

# Check git status
git status

# Push changes
git add .
git commit -m "Your message"
git push
```

Need help? Check the Vercel function logs for specific error messages!
