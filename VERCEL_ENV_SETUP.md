# Quick Vercel Environment Variables Setup

## Method 1: Copy-Paste (Recommended)

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project: `vehicle-doc-manager`
3. Go to **Settings** → **Environment Variables**
4. Add these three variables:

### Variable 1: DATABASE_URL
```
postgresql://neondb_owner:npg_g6plW3nEQcdz@ep-raspy-field-ah6l1hrd-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
- Environment: **Production**, **Preview**, **Development** (check all)

### Variable 2: SESSION_SECRET
```
eRIgD34dSY5+5wIH5WsvOzXVGvtbqUcYDqbAvLdc/F8=
```
- Environment: **Production**, **Preview**, **Development** (check all)

### Variable 3: NODE_ENV
```
production
```
- Environment: **Production**, **Preview**, **Development** (check all)

5. Click **Save** after adding each variable

## Method 2: Using Vercel CLI (Alternative)

If you have Vercel CLI installed:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull existing environment variables (if any)
vercel env pull

# Add environment variables from .env.production
vercel env add DATABASE_URL
# Paste the value when prompted

vercel env add SESSION_SECRET
# Paste the value when prompted

vercel env add NODE_ENV
# Type: production
```

## ⚠️ IMPORTANT: Enable Blob Storage

After adding environment variables:

1. In Vercel dashboard → **Storage** tab
2. Click **Create Database** → **Blob**
3. Click **Create**
4. This automatically adds `BLOB_READ_WRITE_TOKEN` to your env vars
5. **File uploads will NOT work without this step!**

## Verify Setup

After deployment, check:
- ✅ All 3 env vars are set
- ✅ Blob Storage is enabled
- ✅ Build is successful
- ✅ Can login to the app
- ✅ Can upload documents

## Troubleshooting

**Build fails?**
- Check DATABASE_URL is correct
- Verify Neon database is accessible

**Can't login?**
- Verify SESSION_SECRET is set
- Check database connection

**Upload fails?**
- Make sure Blob Storage is enabled
- Check BLOB_READ_WRITE_TOKEN exists

## Security Note

⚠️ **DO NOT** commit `.env.production` to Git!
- Already in `.gitignore`
- Keep this file local only
- Values are already in Vercel

---

**Ready to deploy!** Once env vars are set, click **Deploy** in Vercel.
