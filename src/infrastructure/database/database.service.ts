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
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error instanceof Error ? error.message : String(error));
      throw new Error('Database connection is required - cannot start server without database');
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
    } catch (error) {
      console.error('❌ Database health check failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    connection: string;
    database: string;
    tables: Record<string, number>;
  }> {
    try {
      // Test basic connection
      await this.prisma.$queryRaw`SELECT 1`;

      // Get database info
      const dbInfo = await this.prisma.$queryRaw`SELECT current_database() as database, version() as version`;

      // Get table counts for key tables
      const tableCounts = await Promise.all([
        this.prisma.restaurant.count(),
        this.prisma.user.count(),
        // Add more table counts as needed
      ]);

      return {
        isHealthy: true,
        connection: 'connected',
        database: (dbInfo as any)[0]?.database || 'unknown',
        tables: {
          restaurants: tableCounts[0],
          users: tableCounts[1],
        }
      };
    } catch (error) {
      console.error('❌ Database health status failed:', error instanceof Error ? error.message : String(error));
      return {
        isHealthy: false,
        connection: 'disconnected',
        database: 'unknown',
        tables: {}
      };
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
