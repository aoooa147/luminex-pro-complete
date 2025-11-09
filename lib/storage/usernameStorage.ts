/**
 * Username Storage Utility
 * Stores and retrieves username associated with wallet address
 * Uses file-based storage in development, database in production
 */

import { prisma, isDatabaseAvailable } from '@/lib/prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@/lib/utils/logger';

// Check if we're in a serverless environment
const isServerless = () => {
  return !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.VERCEL_ENV ||
    process.env.NEXT_PUBLIC_VERCEL_ENV
  );
};

const STORAGE_DIR = path.join(process.cwd(), 'tmp_data');
const USERNAME_FILE = path.join(STORAGE_DIR, 'usernames.json');

interface UsernameRecord {
  address: string;
  username: string;
  updatedAt: string;
  source: 'minikit' | 'api' | 'user' | 'manual';
}

// Initialize storage directory
function ensureStorageDir(): void {
  if (isServerless()) return; // Skip in serverless environments
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  } catch (e: any) {
    logger.warn('Cannot create storage directory', { error: e.message }, 'usernameStorage');
  }
}

// Load usernames from file
function loadUsernamesFromFile(): Record<string, UsernameRecord> {
  if (isServerless()) return {}; // Skip in serverless environments
  ensureStorageDir();
  
  if (!fs.existsSync(USERNAME_FILE)) {
    return {};
  }
  
  try {
    const content = fs.readFileSync(USERNAME_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error: any) {
    logger.error('Error loading usernames from file', { error: error.message }, 'usernameStorage');
    return {};
  }
}

// Save usernames to file
function saveUsernamesToFile(usernames: Record<string, UsernameRecord>): void {
  if (isServerless()) return; // Skip in serverless environments
  ensureStorageDir();
  
  try {
    fs.writeFileSync(USERNAME_FILE, JSON.stringify(usernames, null, 2), 'utf-8');
  } catch (error: any) {
    logger.error('Error saving usernames to file', { error: error.message }, 'usernameStorage');
  }
}

/**
 * Get username from storage
 */
export async function getUsername(address: string): Promise<string | null> {
  const normalizedAddress = address.toLowerCase();
  
  try {
    // Try database first (if available)
    if (await isDatabaseAvailable()) {
      try {
        // Check if UserProfile model exists in Prisma schema
        const userProfile = await prisma.userProfile.findUnique({
          where: { address: normalizedAddress },
          select: { username: true },
        });
        
        if (userProfile?.username) {
          return userProfile.username;
        }
      } catch (dbError: any) {
        // Database not available or UserProfile model doesn't exist - use file storage
        logger.debug('Database not available, using file storage', { error: dbError.message }, 'usernameStorage');
      }
    }
    
    // Fallback to file storage
    const usernames = loadUsernamesFromFile();
    const record = usernames[normalizedAddress];
    
    if (record && record.username) {
      return record.username;
    }
    
    return null;
  } catch (error: any) {
    logger.error('Error getting username', { address: normalizedAddress, error: error.message }, 'usernameStorage');
    return null;
  }
}

/**
 * Save username to storage
 */
export async function saveUsername(
  address: string,
  username: string,
  source: 'minikit' | 'api' | 'user' | 'manual' = 'manual'
): Promise<boolean> {
  const normalizedAddress = address.toLowerCase();
  const trimmedUsername = username.trim();
  
  if (!trimmedUsername) {
    return false;
  }
  
  try {
    const record: UsernameRecord = {
      address: normalizedAddress,
      username: trimmedUsername,
      updatedAt: new Date().toISOString(),
      source,
    };
    
    // Try database first (if available)
    if (await isDatabaseAvailable()) {
      try {
        // Try to save to database if UserProfile model exists
        await prisma.userProfile.upsert({
          where: { address: normalizedAddress },
          update: {
            username: trimmedUsername,
            source: source,
            updatedAt: new Date(),
            lastFetched: new Date(),
          },
          create: {
            address: normalizedAddress,
            username: trimmedUsername,
            source: source,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastFetched: new Date(),
          },
        });
        
        logger.info('Username saved to database', { address: normalizedAddress, username: trimmedUsername, source }, 'usernameStorage');
        return true;
      } catch (dbError: any) {
        // Database not available or UserProfile model doesn't exist - use file storage
        logger.debug('Database not available, using file storage', { error: dbError.message }, 'usernameStorage');
      }
    }
    
    // Fallback to file storage
    const usernames = loadUsernamesFromFile();
    usernames[normalizedAddress] = record;
    saveUsernamesToFile(usernames);
    
    logger.info('Username saved to file storage', { address: normalizedAddress, username: trimmedUsername }, 'usernameStorage');
    return true;
  } catch (error: any) {
    logger.error('Error saving username', { address: normalizedAddress, username: trimmedUsername, error: error.message }, 'usernameStorage');
    return false;
  }
}

/**
 * Get all usernames (for admin/debugging)
 */
export async function getAllUsernames(): Promise<UsernameRecord[]> {
  try {
    // Try database first
    if (await isDatabaseAvailable()) {
      try {
        const userProfiles = await prisma.userProfile.findMany({
          select: {
            address: true,
            username: true,
            source: true,
            updatedAt: true,
          },
        });
        
        if (userProfiles) {
          return userProfiles.map((profile) => ({
            address: profile.address,
            username: profile.username || '',
            updatedAt: profile.updatedAt?.toISOString() || new Date().toISOString(),
            source: (profile.source as any) || 'database',
          }));
        }
      } catch (dbError: any) {
        // Database not available - use file storage
        logger.debug('Database not available for getAllUsernames', { error: dbError.message }, 'usernameStorage');
      }
    }
    
    // Fallback to file storage
    const usernames = loadUsernamesFromFile();
    return Object.values(usernames);
  } catch (error: any) {
    logger.error('Error getting all usernames', { error: error.message }, 'usernameStorage');
    return [];
  }
}

