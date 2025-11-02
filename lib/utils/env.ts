import { z } from 'zod';

const EnvSchema = z.object({
  NEXT_PUBLIC_WORLD_APP_ID: z.string().min(1, 'NEXT_PUBLIC_WORLD_APP_ID is required'),
  NEXT_PUBLIC_WORLD_ACTION: z.string().min(1, 'NEXT_PUBLIC_WORLD_ACTION is required'),
  NEXT_PUBLIC_TREASURY_ADDRESS: z.string().min(1, 'NEXT_PUBLIC_TREASURY_ADDRESS is required'),
  WORLD_API_KEY: z.string().min(1, 'WORLD_API_KEY is required'),
});

// Split server & client safe vars
export const env = (() => {
  const parsed = EnvSchema.safeParse({
    NEXT_PUBLIC_WORLD_APP_ID: process.env.NEXT_PUBLIC_WORLD_APP_ID,
    NEXT_PUBLIC_WORLD_ACTION: process.env.NEXT_PUBLIC_WORLD_ACTION,
    NEXT_PUBLIC_TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
    WORLD_API_KEY: process.env.WORLD_API_KEY,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    // Don't throw at build-time for client; only warn on server start
    if (typeof window === 'undefined') {
      console.error('❌ Invalid env:', issues);
    }
  }
  return {
    WORLD_API_KEY: process.env.WORLD_API_KEY || '',
    NEXT_PUBLIC_WORLD_APP_ID: process.env.NEXT_PUBLIC_WORLD_APP_ID || '',
    NEXT_PUBLIC_WORLD_ACTION: process.env.NEXT_PUBLIC_WORLD_ACTION || '',
    NEXT_PUBLIC_TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '',
  };
})();
