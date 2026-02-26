# AsyncFL Board

A modern **Federated Learning** visualization platform with interactive dashboards for analyzing and managing distributed learning experiments. Built with Next.js 16, Prisma ORM, and better-auth authentication.

## 🎯 Key Features

- **Interactive Dashboards**: Real-time visualization of federated learning models and results
- **Project Management**: Organize and manage multiple FL experiments
- **Dataset Versioning**: Secure upload and management of datasets
- **Dynamic Widgets**: Plotly-based interactive visualizations for data analysis
- **User Authentication**: Robust authentication with better-auth and role-based access
- **Type-Safe Database**: Prisma ORM with full TypeScript support and automated migrations
- **Custom Visualizations**: Mathematical equations and drag-and-drop widget management

## 📦 Architecture

```
asyncfl-board/
├── nextjs-app/        # Frontend application (Next.js 16)
│   ├── src/
│   │   ├── app/       # Next.js App Router
│   │   ├── actions/   # Server Actions
│   │   ├── components/# React components
│   │   └── lib/       # Utilities and clients
│   └── prisma/        # Database schema and migrations
├── storage/           # Local file storage for projects
├── docker-compose.yml # Docker Compose setup for PostgreSQL
└── README.md          # This file
```

## 🎨 Tech Stack

### Frontend

- **Framework**: Next.js 16 with App Router
- **Authentication**: better-auth (modern auth solution)
- **Database ORM**: Prisma with auto-generated TypeScript types
- **Styling**: Tailwind CSS + shadcn/ui components
- **Visualization**: Plotly.js for interactive charts
- **Math Rendering**: KaTeX for mathematical equations
- **Drag & Drop**: dnd-kit for widget reordering
- **Forms**: React Hook Form + Zod for validation

### Database

- **Engine**: PostgreSQL 15
- **Schema Management**: Prisma Migrations
- **Type Generation**: Auto-generated from schema

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (authUser)/        # Protected routes (require authentication)
│   │   ├── projects/      # Project management pages
│   │   ├── dashboard/     # User dashboard
│   │   └── profile/       # User profile
│   ├── auth/              # Public auth pages (login, signup, reset password)
│   ├── api/               # API route handlers
│   ├── public/            # Public pages
│   └── layout.tsx         # Root layout
├── actions/               # Server Actions (grouped by domain)
│   ├── auth/              # Authentication actions
│   ├── projects/          # Project operations
│   ├── widgets/           # Widget management
│   ├── files/             # File uploads and downloads
│   └── user/              # User profile actions
├── components/            # React components
│   ├── general/           # Shared UI components
│   ├── projects/          # Project-specific components
│   ├── widgets/           # Plotly visualization widgets
│   └── ui/                # shadcn/ui component wrappers
├── lib/                   # Utilities and helpers
│   ├── auth.ts            # Server-side auth setup
│   ├── auth-client.ts     # Client-side auth hook
│   ├── db.ts              # Prisma client
│   └── readFiles.ts       # File reading utilities
└── generated/             # Auto-generated files (Prisma Client)

prisma/
├── schema.prisma          # Database schema
├── seed.ts                # Database seed script
└── migrations/            # Migration history
```

## 🗄️ Database Models

- **User** - Platform users with roles and sessions
- **Project** - FL project containers (supports public sharing)
- **Widget** - Custom visualization widgets
- **File** - Generated and downloadable files
- **Session** & **Account** - better-auth session management

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (with npm or pnpm)
- **Docker** and **Docker Compose**
- **PostgreSQL** (server running or via Docker)

### Installation

1. **Clone the repository:**

```bash
git clone <repo-url>
cd asyncfl-board
```

2. **Configure environment variables:**

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL=postgresql://asyncfl:password@localhost:5432/asyncfl_db

# Better Auth
BETTER_AUTH_SECRET=your_secret_key_here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# Storage
STORAGE_PATH_BASE=./storage

# Email (Optional, for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@asyncfl.com

# Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=initial_password_change_me
```

3. **Start Docker services:**

```bash
docker-compose up -d
```

4. **Initialize the database:**

```bash
cd nextjs-app
npm install
npx prisma migrate deploy
npm run db:seed
```

5. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 💻 Development

### Database Changes

After modifying `prisma/schema.prisma`:

```bash
# Create and apply a new migration
npx prisma migrate dev --name <migration_name>

# Regenerate Prisma Client (usually automatic)
npx prisma generate
```

**View and manage data with Prisma Studio:**

```bash
npx prisma studio
# Opens at http://localhost:5555
```

## 🧪 Testing & Build

```bash
# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm start

# Clean build artifacts
npm run clean
```

## 🔐 Security

- **Authentication**: better-auth with HTTP-only session cookies
- **Authorization**: Role-based access control (admin, user)
- **Database**: Prisma prevents SQL injection automatically
- **File Uploads**: Type and size validation
- **Environment Variables**: Sensitive data in `.env.local` (not in git)
- **CORS**: Configured for specific domains in production

## 🛠️ Troubleshooting

### "Database connection failed"

```bash
# Check if PostgreSQL is running
docker-compose ps

# View database logs
docker-compose logs db

# Verify DATABASE_URL is correct in .env.local
```

### Port 3000 already in use

```bash
# On macOS/Linux
lsof -i :3000
kill -9 <PID>

# Change port in development
npm run dev -- -p 3001
```

### Prisma issues

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install

# Regenerate Prisma Client
npx prisma generate

# Reset database (⚠️ deletes all data!)
npx prisma migrate reset --force
```

### Session/Authentication errors

```bash
# Regenerate better-auth secret
npm run db:seed  # Recreates admin user

# Clear browser cookies and try again
```

## 📚 Documentation

- **Next.js**: https://nextjs.org/docs
- **better-auth**: https://better-auth.com
- **Prisma**: https://www.prisma.io/docs
- **Plotly.js**: https://plotly.com/javascript/
- **Tailwind CSS**: https://tailwindcss.com
- **shadcn/ui**: https://ui.shadcn.com

## ✨ Authors

- LAAS Team

**Last Updated:** February 2026
**Version:** 0.1.0
