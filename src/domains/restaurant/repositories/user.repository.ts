import { PrismaClient } from '@prisma/client';
import { User } from '../../shared/types/restaurant';
import { BaseRepository } from '../../shared/base-repository';

export class UserRepository extends BaseRepository {
  private prismaClient: PrismaClient;

  constructor(prisma: PrismaClient) {
    super(prisma);
    // Store direct reference - avoid Awilix interception
    this.prismaClient = prisma;
  }

  /**
   * Standalone execution function to avoid Awilix interception
   */
  private static async executeQueryStandalone<T>(
    prisma: PrismaClient,
    operation: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    try {
      return await operation(prisma);
    } catch (error) {
      console.error(`❌ UserRepository standalone operation failed:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async findById(userId: string): Promise<User | null> {
    this.validateId(userId, 'User');

    return this.executeQuery(async () => {
      this.logOperation('findById', { userId });

      const user = await this.prismaClient.user.findUnique({
        where: { id: userId },
      });

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: this.safeOptional(user.password),
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: this.safeOptional(user.lastLoginAt),
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: this.safeOptional(user.lockedUntil),
        restaurantId: user.restaurantId,
        assignedById: this.safeOptional(user.assignedById),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }, 'findById');
  }

  async findByEmailAndRestaurant(
    email: string,
    restaurantId: string
  ): Promise<User | null> {
    this.validateRequiredString(email, 'Email');
    this.validateId(restaurantId, 'Restaurant');

    return this.executeQuery(async () => {
      this.logOperation('findByEmailAndRestaurant', { email, restaurantId });

      // Sanitize input parameters
      const sanitizedEmail = email.trim().toLowerCase();

      // Try exact match first
      let user = await this.prismaClient.user.findFirst({
        where: {
          restaurantId,
          email: sanitizedEmail,
        },
      });

      // If no exact match, try case-insensitive search
      if (!user) {
        user = await this.prismaClient.user.findFirst({
          where: {
            restaurantId,
            email: {
              equals: sanitizedEmail,
              mode: 'insensitive'
            },
          },
        });
      }

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: this.safeOptional(user.password),
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: this.safeOptional(user.lastLoginAt),
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: this.safeOptional(user.lockedUntil),
        restaurantId: user.restaurantId,
        assignedById: this.safeOptional(user.assignedById),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }, 'findByEmailAndRestaurant');
  }

  async findByEmail(email: string): Promise<User[]> {
    this.validateRequiredString(email, 'Email');

    // Use standalone function to completely avoid Awilix interception
    return UserRepository.executeQueryStandalone(
      (this as any).prisma,
      async (prisma) => {
        // Log without using this.logOperation to avoid interception
        console.log(`🔍 ${this.constructor.name}.findByEmail`, { email });

        const users = await prisma.user.findMany({
          where: {
            email: email.toLowerCase().trim(),
            isActive: true,
          },
          include: {
            restaurant: true,
          },
        });

        return users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          password: this.safeOptional(user.password),
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: this.safeOptional(user.lastLoginAt),
          failedLoginAttempts: user.failedLoginAttempts,
          lockedUntil: this.safeOptional(user.lockedUntil),
          restaurantId: user.restaurantId,
          assignedById: this.safeOptional(user.assignedById),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          restaurant: user.restaurant ? {
            id: user.restaurant.id,
            name: user.restaurant.name,
            timezone: user.restaurant.timezone,
            locale: user.restaurant.locale,
            currency: user.restaurant.currency,
            isActive: user.restaurant.isActive,
            settings: user.restaurant.settings as any,
            createdAt: user.restaurant.createdAt,
            updatedAt: user.restaurant.updatedAt,
          } : undefined,
        }));
      }
    );
  }

  async findByRestaurantId(restaurantId: string): Promise<User[]> {
    this.validateId(restaurantId, 'Restaurant');

    return this.executeQuery(async () => {
      this.logOperation('findByRestaurantId', { restaurantId });

      const users = await this.prismaClient.user.findMany({
        where: { restaurantId },
        orderBy: { createdAt: 'asc' },
      });

      return users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: this.safeOptional(user.password),
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: this.safeOptional(user.lastLoginAt),
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: this.safeOptional(user.lockedUntil),
        restaurantId: user.restaurantId,
        assignedById: this.safeOptional(user.assignedById),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    }, 'findByRestaurantId');
  }

  async create(data: {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    role: string;
    restaurantId: string;
    failedLoginAttempts?: number;
    isActive?: boolean;
  }): Promise<User> {
    this.validateRequiredString(data.email, 'Email');
    this.validateRequiredString(data.firstName, 'First name');
    this.validateRequiredString(data.lastName, 'Last name');
    this.validateId(data.restaurantId, 'Restaurant');

    return this.executeQuery(async () => {
      this.logOperation('create', { email: data.email, restaurantId: data.restaurantId });

      const user = await this.prismaClient.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          password: data.password,
          role: data.role as any,
          restaurantId: data.restaurantId,
          failedLoginAttempts: data.failedLoginAttempts ?? 0,
          isActive: data.isActive ?? true,
        },
      });

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: this.safeOptional(user.password),
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: this.safeOptional(user.lastLoginAt),
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: this.safeOptional(user.lockedUntil),
        restaurantId: user.restaurantId,
        assignedById: this.safeOptional(user.assignedById),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }, 'create');
  }

  async update(
    userId: string,
    data: Partial<{
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      role: string;
      isActive: boolean;
      lastLoginAt: Date;
      failedLoginAttempts: number;
      lockedUntil: Date | null;
      assignedById: string | null;
    }>
  ): Promise<User> {
    this.validateId(userId, 'User');

    return this.executeQuery(async () => {
      this.logOperation('update', { userId, fields: Object.keys(data) });

      const updateData: any = { ...data };
      if (data.role) {
        updateData.role = data.role;
      }

      const user = await this.prismaClient.user.update({
        where: { id: userId },
        data: updateData,
      });

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: this.safeOptional(user.password),
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: this.safeOptional(user.lastLoginAt),
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: this.safeOptional(user.lockedUntil),
        restaurantId: user.restaurantId,
        assignedById: this.safeOptional(user.assignedById),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }, 'update');
  }

  async delete(userId: string): Promise<void> {
    this.validateId(userId, 'User');

    return this.executeQuery(async () => {
      this.logOperation('delete', { userId });

      await this.prismaClient.user.delete({
        where: { id: userId },
      });
    }, 'delete');
  }
}
