# Object Storage Setup Guide

## Problem

The file upload feature is failing because the application uses Replit's Object Storage infrastructure, which requires specific environment variables that are automatically set when running on Replit.

## Solution

You have two options:

### Option 1: Run on Replit (Recommended for this codebase)

1. **Import your project to Replit:**
   - Go to https://replit.com
   - Click "Create Repl" → "Import from GitHub"
   - Or upload your project files

2. **Enable Object Storage:**
   - In your Repl, go to the "Tools" panel
   - Click on "Object Storage"
   - Create a new bucket (e.g., `vehicle-docs`)
   - Replit will automatically set the required environment variables:
     - `PRIVATE_OBJECT_DIR=/your-bucket-name`
     - `PUBLIC_OBJECT_SEARCH_PATHS=/your-bucket-name`

3. **Set other environment variables:**
   - In Replit Secrets (Tools → Secrets), add:
     - `DATABASE_URL` - Your PostgreSQL connection string
     - `SESSION_SECRET` - A random secret key
     - `NODE_ENV=production`

4. **Run your application:**
   ```bash
   npm install
   npm run build
   npm start
   ```

### Option 2: Use Local File Storage (For Local Development)

If you want to run this locally without Replit, you'll need to modify the code to use local file storage instead of Replit's Object Storage.

**Required Changes:**

1. **Install multer for local file uploads:**
   ```bash
   npm install multer @types/multer
   ```

2. **Create a local storage adapter** (I can help you implement this)

3. **Update the upload routes** to use multer instead of presigned URLs

4. **Store files in a local directory** (e.g., `./uploads`)

## Current Issue

The upload is failing because:
- The code tries to connect to `http://127.0.0.1:1106` (Replit's sidecar)
- This endpoint only exists when running on Replit
- Environment variables `PRIVATE_OBJECT_DIR` and `PUBLIC_OBJECT_SEARCH_PATHS` are not set

## Recommendation

**For production and testing**: Use Option 1 (Run on Replit) - it's the quickest solution since the code is already configured for it.

**For local development**: I can help you implement Option 2 to use local file storage instead.

## Next Steps

Please let me know which option you prefer:
1. Deploy and run on Replit (easiest)
2. Modify code to use local file storage (requires code changes)
