# Deployment Instructions for Vehicle Document Manager

This guide will help you deploy the Vehicle Document Manager to Vercel with a persistent PostgreSQL database.

## Prerequisites

- Node.js 18+ installed
- A Vercel account (free tier works)
- A PostgreSQL database (see options below)

## Step 1: Set Up a Persistent Database

Choose one of these free PostgreSQL hosting options:

### Option A: Neon (Recommended - Free tier available)
1. Go to https://neon.tech
2. Sign up for a free account
3. Create a new project
4. Copy the connection string (starts with `postgresql://`)

### Option B: Supabase (Free tier available)
1. Go to https://supabase.com
2. Sign up and create a new project
3. Go to Project Settings > Database
4. Copy the connection string (Connection pooling recommended)

### Option C: Railway (Free trial)
1. Go to https://railway.app
2. Create a new project with PostgreSQL
3. Copy the DATABASE_URL from the Variables tab

## Step 2: Prepare Your Database

Once you have your database connection string, run the migrations:

```bash
# Create a .env file with your database URL
echo "DATABASE_URL=your_database_url_here" > .env

# Push the database schema
npm run db:push
```

This will create all necessary tables including:
- vehicles
- documents
- user_sessions (for authentication)

## Step 3: Deploy to Vercel

### Method 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Set environment variables:
```bash
vercel env add DATABASE_URL
# Paste your PostgreSQL connection string

vercel env add SESSION_SECRET
# Enter a random secure string (e.g., use a password generator)

vercel env add NODE_ENV
# Enter: production
```

5. Deploy to production:
```bash
vercel --prod
```

### Method 2: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository (GitHub, GitLab, or Bitbucket)
3. Configure project:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

4. Add Environment Variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: A random secure string
   - `NODE_ENV`: `production`

5. Click "Deploy"

## Step 4: Verify Deployment

1. Visit your deployed site URL (e.g., `your-project.vercel.app`)
2. You should see the login page
3. Login with default credentials:
   - Username: `kisun01`
   - Password: `Kisun@7257`

## Default User Credentials

**Username:** kisun01  
**Password:** Kisun@7257

> ⚠️ **Security Note:** For production use, you should modify the authentication system to support password changes or multiple users by updating `server/auth.ts`.

## Key Features

✅ **Simple Authentication:** Username/password login system  
✅ **Persistent Database:** Data is stored in PostgreSQL and never deleted  
✅ **Combined Vehicle + Documents:** Add vehicles with all documents at once  
✅ **Document Types:** Insurance, Pollution, Tax, Fitness, Permit, Aadhar, Owner Book, Other  
✅ **Expiry Tracking:** Track document expiration dates  
✅ **File Uploads:** Upload document files with each certificate  

## Database Schema

The application uses three main tables:

1. **vehicles** - Store vehicle information
   - registrationNumber (unique)
   - ownerName
   - ownerMobile
   - userId (links to authenticated user)

2. **documents** - Store document details
   - vehicleId (foreign key to vehicles)
   - type (document type enum)
   - expiryDate
   - fileUrl
   - notes

3. **user_sessions** - Store user sessions (created automatically by connect-pg-simple)

## Troubleshooting

### Database Connection Errors

If you see database connection errors:
1. Verify your DATABASE_URL is correct
2. Check that your database allows connections from Vercel's IP addresses
3. Most cloud databases (Neon, Supabase) allow connections from anywhere by default

### Session Issues

If login doesn't persist:
1. Make sure SESSION_SECRET is set in environment variables
2. Verify that the user_sessions table was created in your database
3. Check browser console for errors

### Build Errors

If deployment fails during build:
1. Run `npm run build` locally to see detailed errors
2. Make sure all dependencies are in package.json
3. Check that DATABASE_URL is available during build

## Local Development

To run the project locally:

1. Clone the repository
2. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your database URL
```

3. Install dependencies:
```bash
npm install
```

4. Push database schema:
```bash
npm run db:push
```

5. Run development server:
```bash
npm run dev
```

6. Open http://localhost:5000

## Updating the Application

To deploy updates:

```bash
# Using Vercel CLI
vercel --prod

# Or commit and push to your Git repository (if connected)
git add .
git commit -m "Your update message"
git push
```

Vercel will automatically redeploy when you push to your main branch.

## Cost Considerations

- **Vercel Free Tier:** Unlimited personal projects
- **Database Free Tiers:**
  - Neon: 3 GB storage, 1 shared CPU
  - Supabase: 500 MB storage, 2 GB transfer
  - Railway: $5 free credit monthly

All free tiers are sufficient for small to medium usage.

## Support

For issues or questions:
1. Check the error logs in Vercel dashboard
2. Verify database connectivity
3. Ensure environment variables are set correctly
