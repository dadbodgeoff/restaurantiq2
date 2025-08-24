import { PrismaClient } from '@prisma/client';
import { User } from '../../shared/types/restaurant';

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(userId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: user.password || undefined,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt || undefined,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil || undefined,
      restaurantId: user.restaurantId,
      assignedById: user.assignedById || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findByEmailAndRestaurant(
    email: string,
    restaurantId: string
  ): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        restaurantId_email: {
          restaurantId,
          email,
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: user.password || undefined,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt || undefined,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil || undefined,
      restaurantId: user.restaurantId,
      assignedById: user.assignedById || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findByRestaurantId(restaurantId: string): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'asc' },
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt || undefined,
      restaurantId: user.restaurantId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
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
    const user = await this.prisma.user.create({
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
      password: user.password || undefined,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt || undefined,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil || undefined,
      restaurantId: user.restaurantId,
      assignedById: user.assignedById || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
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
    const updateData: any = { ...data };
    if (data.role) {
      updateData.role = data.role;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: user.password || undefined,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt || undefined,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil || undefined,
      restaurantId: user.restaurantId,
      assignedById: user.assignedById || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
