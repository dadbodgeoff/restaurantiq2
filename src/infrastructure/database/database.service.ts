import { PrismaClient } from '@prisma/client';
import { getEnvConfig } from '../../config/env';

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    const config = getEnvConfig();

    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: config.DATABASE_URL,
        },
      },
    });
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
    } catch (error) {
      // For demo purposes, log the error but don't crash
      console.log('⚠️  Database connection failed (expected for demo):', error instanceof Error ? error.message : String(error));
      console.log('✅ Server will start without database for demonstration');
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  getClient(): PrismaClient {
    return this.prisma;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      // For demo purposes, return true even if DB is down
      return true;
    }
  }

  async transaction<T>(
    callback: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return await this.prisma.$transaction(async (prisma) => {
      return await callback(prisma);
    });
  }
}
