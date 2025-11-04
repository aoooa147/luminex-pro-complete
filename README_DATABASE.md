# 🗄️ Database Setup Guide - Power License System

This guide explains how to set up PostgreSQL database with Prisma for the Power License system.

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud like Supabase, Neon, etc.)
- Database connection URL

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@prisma/client` - Prisma ORM client
- `prisma` - Prisma CLI (dev dependency)

### 2. Set Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/luminex?schema=public"
```

For cloud databases (Supabase, Neon, etc.), use their connection string format.

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

This creates the Prisma Client based on the schema.

### 4. Run Database Migrations

```bash
npm run prisma:migrate
```

This will:
- Create the database tables (`power_licenses`, `user_powers`, `power_drafts`)
- Seed initial PowerLicense data (Spark, Nova, Quasar, Supernova, Singularity)

### 5. Verify Database Setup

Open Prisma Studio to view your database:

```bash
npm run prisma:studio
```

This opens a browser interface at `http://localhost:5555` where you can view and edit database records.

## 📊 Database Schema

### PowerLicense
Stores the available power license tiers (static configuration).

```typescript
{
  code: string        // Primary key: 'spark', 'nova', 'quasar', etc.
  name: string        // Display name: 'Spark', 'Nova', etc.
  priceWLD: number    // Price in WLD: 1, 5, 10, 50, 200
  totalAPY: number    // Total APY percentage: 75, 125, 175, 325, 500
}
```

### UserPower
Stores each user's active power license (one per user).

```typescript
{
  userId: string      // Primary key: wallet address (0x...)
  code: string        // Power level code: 'spark', 'nova', etc.
  txId: string        // Transaction ID from purchase
  reference: string   // Unique reference (MiniKit reference)
  acquiredAt: DateTime // Purchase timestamp
}
```

### PowerDraft
Temporary records for pending purchases (prevents double-spending).

```typescript
{
  reference: string   // Primary key: UUID
  userId: string      // User's wallet address
  targetCode: string  // Target power level
  amountWLD: string   // Amount to pay
  createdAt: DateTime // Creation timestamp
  status: string      // 'pending' | 'used' | 'cancelled'
}
```

## 🔄 Fallback Behavior

The system automatically falls back to **in-memory storage** if:
- Database connection fails
- `DATABASE_URL` is not set
- Prisma Client generation fails

In-memory storage:
- ✅ Works for development and testing
- ❌ Data is lost on server restart
- ❌ Not suitable for production

## 🔐 Security Notes

1. **Never commit `.env.local`** - Keep database credentials secret
2. **Use connection pooling** - For production, use a connection pooler (PgBouncer, etc.)
3. **Enable SSL** - Always use SSL connections for production databases
4. **Backup regularly** - Implement regular database backups

## 🛠️ Production Deployment

### Vercel + Supabase Example

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Copy the connection string

2. **Add to Vercel Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add `DATABASE_URL` with your Supabase connection string

3. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Generate Prisma Client in Build**
   - Vercel automatically runs `prisma generate` during build
   - Or add to `package.json` build script:
   ```json
   "build": "prisma generate && next build"
   ```

## 📝 Migration Commands

```bash
# Create a new migration
npx prisma migrate dev --name add_new_field

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

## 🐛 Troubleshooting

### "Prisma Client not generated"
```bash
npm run prisma:generate
```

### "Can't reach database server"
- Check `DATABASE_URL` is correct
- Verify database server is running
- Check firewall/network settings

### "Table does not exist"
```bash
npm run prisma:migrate
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js + Prisma Guide](https://www.prisma.io/nextjs)
- [Supabase + Prisma](https://supabase.com/docs/guides/integrations/prisma)
