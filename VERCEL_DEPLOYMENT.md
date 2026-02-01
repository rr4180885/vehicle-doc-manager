# Vercel Deployment Guide

This guide will help you deploy the Vehicle Document Manager to Vercel with all features working, including file uploads.

## Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- PostgreSQL database (Neon recommended - free tier)

## Step 1: Push Your Code to GitHub

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

## Step 2: Import Project to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration from `vercel.json`

## Step 3: Configure Environment Variables

In the Vercel project settings, add these environment variables:

### Required Variables:

1. **DATABASE_URL**
   - Your PostgreSQL connection string
   - Example from Neon: `postgresql://user:pass@host.neon.tech/dbname?sslmode=require`

2. **SESSION_SECRET**
   - Generate a random string (at least 32 characters)
   - Example: `openssl rand -base64 32` (run in terminal)

3. **NODE_ENV**
   - Set to: `production`

### Optional Variables:

These are automatically set by Vercel when you enable features:
- `VERCEL` - Auto-set by Vercel
- `BLOB_READ_WRITE_TOKEN` - Auto-set when you enable Blob Storage

## Step 4: Enable Vercel Blob Storage

This is **required** for file uploads to work on Vercel!

1. In your Vercel project dashboard, go to "Storage"
2. Click "Create Database" → "Blob"
3. Click "Create"
4. Accept the terms and create the Blob store
5. The `BLOB_READ_WRITE_TOKEN` will be automatically added to your environment variables

**Important**: Vercel Blob free tier includes:
- 1 GB storage
- 5 GB bandwidth per month
- Public read access for documents

## Step 5: Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete (usually 2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Step 6: Initialize Database

After first deployment:

1. Go to your deployed app URL
2. Register a new account (first user)
3. Start adding vehicles and documents!

## How File Uploads Work

### Development (Local):
- Files are stored in `./uploads` directory
- Served via `/uploads` route
- Perfect for testing without cloud dependencies

### Production (Vercel):
- Files automatically upload to Vercel Blob Storage
- Each file gets a unique URL like: `https://blob.vercel-storage.com/...`
- Files are publicly accessible (for viewing documents)
- Persistent across deployments

## Common Issues & Solutions

### Blank Screen on Vercel (FIXED)

**Problem**: Website shows blank screen after deployment

**Root Cause**: Incorrect routing in `vercel.json` was sending all requests (including homepage) to the API instead of serving the React frontend.

**Solution Applied**:
1. Updated `vercel.json` to properly route requests
2. Created `/api/index.ts` serverless function for Vercel
3. Configured proper rewrites for API endpoints

The application now correctly:
- Serves React app for all non-API routes
- Routes `/api/*` requests to the serverless function
- Supports Vercel's serverless architecture

### API 404 Errors (FIXED)

**Problem**: `GET /api/auth/user 404 (Not Found)` and other API errors

**Root Cause**: Vercel uses serverless functions, not a persistent Node.js server. The original setup tried to run Express as a traditional server.

**Solution Applied**:
1. Created `api/index.ts` - Vercel serverless function entry point
2. Configured function to initialize Express app and handle all API routes
3. Added `@vercel/node` package for TypeScript support
4. Updated `vercel.json` with functions configuration

**Files Added/Modified**:
- `api/index.ts` - New serverless function handler
- `vercel.json` - Updated routing and functions config
- `package.json` - Added `@vercel/node` dependency

### Upload Fails on Vercel

**Problem**: "Failed to upload file" error

**Solution**: Make sure you've enabled Vercel Blob Storage (Step 4)

### Database Connection Error

**Problem**: Cannot connect to database

**Solution**: 
- Check DATABASE_URL is correct
- For Neon, ensure connection string includes `?sslmode=require`
- Verify database is accessible from Vercel's IP range

### Session/Auth Issues

**Problem**: Can't stay logged in

**Solution**: 
- Verify SESSION_SECRET is set
- Must be at least 32 characters
- Should be random and secure

## Updating Your Deployment

Any push to your main branch will automatically trigger a new deployment:

```bash
git add .
git commit -m "Your update message"
git push
```

Vercel will rebuild and deploy automatically (usually takes 2-3 minutes).

## Cost Considerations

**Free Tier Includes:**
- Vercel Hosting: Free for personal projects
- Vercel Blob: 1GB storage, 5GB bandwidth/month
- Neon Database: 10GB storage, 100 hours compute/month

**This is plenty for:**
- Personal use
- Small teams (up to 10-20 users)
- Testing and demos
- ~500-1000 documents

## Security Notes

1. **Environment Variables**: Never commit `.env` file to Git
2. **Database**: Use strong passwords
3. **Session Secret**: Must be random and secret
4. **File Access**: Uploaded files are public by default (change `access: "public"` in `server/upload.ts` if needed)

## Next Steps

After deployment:
1. Test file upload functionality
2. Add some vehicles and documents
3. Set up custom domain (optional, in Vercel settings)
4. Monitor usage in Vercel dashboard

## Support

If you encounter issues:
- Check Vercel deployment logs
- Verify all environment variables are set
- Ensure Blob Storage is enabled
- Check browser console for client-side errors

Happy deploying! 🚀
