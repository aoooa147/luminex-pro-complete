import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaInitialized: boolean;
};

// Check if DATABASE_URL is available
const hasDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0;

// Create Prisma client only if DATABASE_URL is available
// Use a dummy URL for schema validation, but we'll handle errors gracefully
let prismaInstance: PrismaClient | null = null;

if (hasDatabaseUrl) {
  try {
    prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }
  } catch (error) {
    console.warn('[prisma] Failed to initialize Prisma client:', error);
    prismaInstance = null;
  }
} else {
  console.warn('[prisma] DATABASE_URL not set, Prisma client will not be initialized. Using in-memory storage.');
}

// Create a safe proxy that handles database unavailability gracefully
// This proxy will catch all method calls and handle them appropriately
const createNoOpModel = () => ({
  findMany: async () => [],
  findUnique: async () => null,
  findFirst: async () => null,
  create: async () => { 
    throw new Error('Database not available: DATABASE_URL is not set'); 
  },
  update: async () => { 
    throw new Error('Database not available: DATABASE_URL is not set'); 
  },
  upsert: async () => { 
    throw new Error('Database not available: DATABASE_URL is not set'); 
  },
  delete: async () => { 
    throw new Error('Database not available: DATABASE_URL is not set'); 
  },
  createMany: async () => ({ count: 0 }),
  updateMany: async () => ({ count: 0 }),
  deleteMany: async () => ({ count: 0 }),
  count: async () => 0,
  aggregate: async () => ({ 
    _count: 0, 
    _avg: null, 
    _sum: null, 
    _min: null, 
    _max: null 
  }),
  groupBy: async () => [],
});

// Export a proxy that handles database unavailability gracefully
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    // If no database instance, return safe no-ops
    if (!prismaInstance) {
      // For $queryRaw, $transaction, $connect, $disconnect, etc.
      if (typeof prop === 'string' && prop.startsWith('$')) {
        if (prop === '$queryRaw') {
          return async () => {
            throw new Error('Database not available: DATABASE_URL is not set');
          };
        }
        if (prop === '$transaction') {
          return async (callback: any) => {
            throw new Error('Database not available: DATABASE_URL is not set');
          };
        }
        if (prop === '$connect' || prop === '$disconnect' || prop === '$on' || prop === '$use') {
          return async () => {
            // Silent no-op for connection methods
            return;
          };
        }
        // Default for other $ methods
        return async () => {
          throw new Error('Database not available: DATABASE_URL is not set');
        };
      }
      
      // For model methods (userPower, powerDraft, gameAction, etc.)
      // Return a proxy that always returns the no-op model
      return createNoOpModel();
    }
    
    // Database is available, return the real Prisma client property
    return (prismaInstance as any)[prop];
  },
});

// Check if database is available
export async function isDatabaseAvailable(): Promise<boolean> {
  // First check: DATABASE_URL must be set and non-empty
  const currentDbUrl = process.env.DATABASE_URL;
  if (!currentDbUrl || currentDbUrl.trim().length === 0) {
    return false;
  }
  
  // Second check: Prisma instance must exist
  if (!prismaInstance) {
    return false;
  }
  
  // Third check: Try to query the database (but catch all errors)
  try {
    await prismaInstance.$queryRaw`SELECT 1`;
    return true;
  } catch (error: any) {
    // Check if error is due to missing or invalid DATABASE_URL
    const errorMessage = error?.message || '';
    const errorCode = error?.code || '';
    
    if (
      errorMessage.includes('DATABASE_URL') ||
      errorMessage.includes('nonempty URL') ||
      errorMessage.includes('empty string') ||
      errorMessage.includes('Error validating datasource') ||
      errorCode === 'P1013' // Prisma error code for invalid database URL
    ) {
      // Don't log warning here - it's expected when DATABASE_URL is not set
      return false;
    }
    
    // For other errors (connection refused, timeout, etc.), log warning
    console.warn('[prisma] Database not available, falling back to in-memory storage:', errorMessage);
    return false;
  }
}

// Initialize PowerLicense data if database is available and table is empty
export async function initializePowerLicenses() {
  try {
    const count = await prisma.powerLicense.count();
    if (count === 0) {
      await prisma.powerLicense.createMany({
        data: [
          { code: 'spark', name: 'Spark', priceWLD: 1, totalAPY: 75 },
          { code: 'nova', name: 'Nova', priceWLD: 5, totalAPY: 125 },
          { code: 'quasar', name: 'Quasar', priceWLD: 10, totalAPY: 175 },
          { code: 'supernova', name: 'Supernova', priceWLD: 50, totalAPY: 325 },
          { code: 'singularity', name: 'Singularity', priceWLD: 200, totalAPY: 500 },
        ],
      });
      console.log('✅ PowerLicense data initialized');
    }
  } catch (error) {
    console.warn('[prisma] Could not initialize PowerLicense data:', error);
  }
}
