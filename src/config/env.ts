import { z } from 'zod';

// Enterprise-grade environment validation with Zod
const envSchema = z.object({
  // Application Configuration
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_VERSION: z.string().default('v1'),

  // Database Configuration
  DATABASE_URL: z.string().url(),

  // Security Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Restaurant Configuration
  DEFAULT_TIMEZONE: z.string().default('America/New_York'),
  SNAPSHOT_TIME: z.string().default('23:30'),  // 11:30 PM EST
  GRACE_PERIOD_HOURS: z.string().transform(Number).default('1'),

  // External Services
  REDIS_URL: z.string().optional(),

  // Logging Configuration
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['json', 'dev']).default('dev'),

  // CORS Configuration
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Feature Flags
  ENABLE_SWAGGER: z.string().transform(v => v === 'true').default('false'),
  ENABLE_METRICS: z.string().transform(v => v === 'true').default('false'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let envConfig: EnvConfig;

// Singleton pattern for environment configuration
export const getEnvConfig = (): EnvConfig => {
  if (!envConfig) {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
      // eslint-disable-next-line no-console
      console.error('❌ Invalid environment configuration:');
      result.error.errors.forEach(error => {
        // eslint-disable-next-line no-console
        console.error(`  ${error.path.join('.')}: ${error.message}`);
      });
      process.exit(1);
    }

    envConfig = result.data;
  }

  return envConfig;
};
