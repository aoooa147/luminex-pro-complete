import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Check if database is available
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('[prisma] Database not available, falling back to in-memory storage:', error);
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
