# Vehicle Document Manager

A full-stack web application for managing vehicle documents and tracking expiration dates. Built with React, TypeScript, Express, and PostgreSQL.

## 🚀 Features

- **Simple Authentication**: Username/password login system (default: `kisun01` / `Kisun@7257`)
- **Persistent Storage**: PostgreSQL database - your data never gets deleted
- **Vehicle Management**: Add, edit, delete, and search vehicles
- **Combined Upload**: Add vehicles with all documents at the same time
- **Document Types**: Insurance, Pollution, Tax, Fitness, Permit, Aadhar, Owner Book, and Other
- **Expiry Tracking**: Monitor document expiration dates
- **File Uploads**: Upload and store document files
- **Multi-Vehicle Support**: Manage multiple vehicles from one dashboard
- **Responsive Design**: Works on desktop and mobile devices

## 📋 Recent Updates

### ✅ Authentication System
- Replaced Replit OAuth with simple username/password authentication
- Default credentials: `kisun01` / `Kisun@7257`
- Session-based authentication with PostgreSQL storage
- Secure cookie-based sessions

### ✅ Combined Vehicle + Documents Creation
- Add a vehicle with all documents in a single operation
- Upload multiple document types at once
- Simplified workflow for faster data entry
- New API endpoint: `/api/vehicles/with-documents`

### ✅ Vercel Deployment Ready
- Configured for Vercel serverless deployment
- Compatible with any PostgreSQL hosting (Neon, Supabase, Railway)
- Environment variable configuration
- Persistent database - no data loss

### ✅ Database Improvements
- Added proper session storage in PostgreSQL
- Improved security with document ownership verification
- Optimized queries for better performance

## 🛠️ Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui components
- TanStack Query (React Query)
- Wouter (routing)

**Backend:**
- Node.js
- Express.js
- TypeScript
- Drizzle ORM
- PostgreSQL
- express-session
- connect-pg-simple

**Deployment:**
- Vercel (serverless)
- Neon/Supabase/Railway (PostgreSQL)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Vehicle-Doc-Manager
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your PostgreSQL connection string:
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SESSION_SECRET=your-random-secret-key
NODE_ENV=development
```

4. **Initialize database**
```bash
npm run db:push
```

5. **Start development server**
```bash
npm run dev
```

6. **Open in browser**
```
http://localhost:5000
```

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel.

**Quick Deploy:**

1. Set up a PostgreSQL database (Neon, Supabase, or Railway)
2. Push to GitHub/GitLab/Bitbucket
3. Import to Vercel
4. Add environment variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `NODE_ENV=production`
5. Deploy!

## 🔐 Default Credentials

**Username:** `kisun01`  
**Password:** `Kisun@7257`

> ⚠️ **Note:** For production use, modify `server/auth.ts` to add support for password changes or multiple users.

## 📁 Project Structure

```
Vehicle-Doc-Manager/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities
├── server/              # Express backend
│   ├── auth.ts         # Authentication logic
│   ├── routes.ts       # API routes
│   ├── storage.ts      # Database operations
│   └── db.ts           # Database connection
├── shared/              # Shared types & schemas
│   ├── schema.ts       # Database schema
│   └── routes.ts       # API route definitions
└── script/              # Build scripts
```

## 📊 Database Schema

### vehicles
- `id` (serial, primary key)
- `registrationNumber` (text, unique)
- `ownerName` (text)
- `ownerMobile` (text)
- `userId` (varchar) - Links to authenticated user
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### documents
- `id` (serial, primary key)
- `vehicleId` (integer, foreign key)
- `type` (enum: insurance, pollution, tax, fitness, permit, aadhar, owner_book, other)
- `expiryDate` (date)
- `fileUrl` (text)
- `notes` (text, optional)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### user_sessions
- Created automatically by `connect-pg-simple`
- Stores session data in PostgreSQL

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user

### Vehicles
- `GET /api/vehicles` - List all vehicles (with search)
- `GET /api/vehicles/:id` - Get vehicle with documents
- `POST /api/vehicles` - Create vehicle
- `POST /api/vehicles/with-documents` - Create vehicle with documents
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Documents
- `POST /api/documents` - Create document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🐛 Known Issues

- TypeScript errors are expected during development due to missing type definitions
- Run `npm install` to ensure all dependencies are properly installed
- Some UI components may need `@types/*` packages

## 🔮 Future Enhancements

- [ ] Email/SMS notifications for expiring documents
- [ ] Multi-user support with roles (admin, viewer)
- [ ] Document renewal reminders
- [ ] Export reports (PDF, Excel)
- [ ] Document history tracking
- [ ] Advanced search and filtering
- [ ] Mobile app (React Native)
- [ ] Bulk vehicle import
- [ ] Dashboard analytics

## 📞 Support

For issues or questions:
1. Check existing issues on GitHub
2. Review DEPLOYMENT.md for deployment issues
3. Check database connection and environment variables
4. Enable debug logging in development

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Database ORM by [Drizzle](https://orm.drizzle.team/)
- Deployed on [Vercel](https://vercel.com/)

---

Made with ❤️ for efficient vehicle document management
