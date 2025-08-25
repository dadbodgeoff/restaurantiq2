import { PrismaClient } from '@prisma/client';
import { UserPermission, User, Permission } from '../../shared/types/restaurant';

export class UserPermissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<UserPermission | null> {
    const userPermission = await this.prisma.userPermission.findUnique({
      where: { id },
      include: {
        permission: true,
        user: true,
        grantedBy: true,
      },
    });

    if (!userPermission) return null;

    return {
      id: userPermission.id,
      userId: userPermission.userId,
      permissionId: userPermission.permissionId,
      grantedById: userPermission.grantedById || undefined,
      grantedAt: userPermission.grantedAt,
      expiresAt: userPermission.expiresAt || undefined,
      isActive: userPermission.isActive,
      permission: userPermission.permission ? {
        id: userPermission.permission.id,
        name: userPermission.permission.name,
        category: userPermission.permission.category,
        action: userPermission.permission.action,
        description: userPermission.permission.description || undefined,
        isActive: userPermission.permission.isActive,
        createdAt: userPermission.permission.createdAt,
        updatedAt: userPermission.permission.updatedAt,
      } : undefined,
      user: userPermission.user ? {
        id: userPermission.user.id,
        email: userPermission.user.email,
        firstName: userPermission.user.firstName,
        lastName: userPermission.user.lastName,
        password: userPermission.user.password || undefined,
        role: userPermission.user.role,
        isActive: userPermission.user.isActive,
        lastLoginAt: userPermission.user.lastLoginAt || undefined,
        failedLoginAttempts: userPermission.user.failedLoginAttempts,
        lockedUntil: userPermission.user.lockedUntil || undefined,
        restaurantId: userPermission.user.restaurantId,
        assignedById: userPermission.user.assignedById || undefined,
        createdAt: userPermission.user.createdAt,
        updatedAt: userPermission.user.updatedAt,
      } : undefined,
      grantedBy: userPermission.grantedBy ? {
        id: userPermission.grantedBy.id,
        email: userPermission.grantedBy.email,
        firstName: userPermission.grantedBy.firstName,
        lastName: userPermission.grantedBy.lastName,
        password: userPermission.grantedBy.password || undefined,
        role: userPermission.grantedBy.role,
        isActive: userPermission.grantedBy.isActive,
        lastLoginAt: userPermission.grantedBy.lastLoginAt || undefined,
        failedLoginAttempts: userPermission.grantedBy.failedLoginAttempts,
        lockedUntil: userPermission.grantedBy.lockedUntil || undefined,
        restaurantId: userPermission.grantedBy.restaurantId,
        assignedById: userPermission.grantedBy.assignedById || undefined,
        createdAt: userPermission.grantedBy.createdAt,
        updatedAt: userPermission.grantedBy.updatedAt,
      } : undefined,
    };
  }

  async findByUserId(userId: string): Promise<UserPermission[]> {
    const userPermissions = await this.prisma.userPermission.findMany({
      where: { userId, isActive: true },
      include: {
        permission: true,
        grantedBy: true,
      },
      orderBy: [
        { permission: { category: 'asc' } },
        { permission: { name: 'asc' } }
      ],
    });

    return userPermissions.map(up => ({
      id: up.id,
      userId: up.userId,
      permissionId: up.permissionId,
      grantedById: up.grantedById || undefined,
      grantedAt: up.grantedAt,
      expiresAt: up.expiresAt || undefined,
      isActive: up.isActive,
      permission: up.permission ? {
        id: up.permission.id,
        name: up.permission.name,
        category: up.permission.category,
        action: up.permission.action,
        description: up.permission.description || undefined,
        isActive: up.permission.isActive,
        createdAt: up.permission.createdAt,
        updatedAt: up.permission.updatedAt,
      } : undefined,
      grantedBy: up.grantedBy ? {
        id: up.grantedBy.id,
        email: up.grantedBy.email,
        firstName: up.grantedBy.firstName,
        lastName: up.grantedBy.lastName,
        password: up.grantedBy.password || undefined,
        role: up.grantedBy.role,
        isActive: up.grantedBy.isActive,
        lastLoginAt: up.grantedBy.lastLoginAt || undefined,
        failedLoginAttempts: up.grantedBy.failedLoginAttempts,
        lockedUntil: up.grantedBy.lockedUntil || undefined,
        restaurantId: up.grantedBy.restaurantId,
        assignedById: up.grantedBy.assignedById || undefined,
        createdAt: up.grantedBy.createdAt,
        updatedAt: up.grantedBy.updatedAt,
      } : undefined,
    }));
  }

  async findByUserIdAndPermissionId(userId: string, permissionId: string): Promise<UserPermission | null> {
    const userPermission = await this.prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId,
        },
      },
      include: {
        permission: true,
        grantedBy: true,
      },
    });

    if (!userPermission) return null;

    return {
      id: userPermission.id,
      userId: userPermission.userId,
      permissionId: userPermission.permissionId,
      grantedById: userPermission.grantedById || undefined,
      grantedAt: userPermission.grantedAt,
      expiresAt: userPermission.expiresAt || undefined,
      isActive: userPermission.isActive,
      permission: userPermission.permission ? {
        id: userPermission.permission.id,
        name: userPermission.permission.name,
        category: userPermission.permission.category,
        action: userPermission.permission.action,
        description: userPermission.permission.description || undefined,
        isActive: userPermission.permission.isActive,
        createdAt: userPermission.permission.createdAt,
        updatedAt: userPermission.permission.updatedAt,
      } : undefined,
      grantedBy: userPermission.grantedBy ? {
        id: userPermission.grantedBy.id,
        email: userPermission.grantedBy.email,
        firstName: userPermission.grantedBy.firstName,
        lastName: userPermission.grantedBy.lastName,
        password: userPermission.grantedBy.password || undefined,
        role: userPermission.grantedBy.role,
        isActive: userPermission.grantedBy.isActive,
        lastLoginAt: userPermission.grantedBy.lastLoginAt || undefined,
        failedLoginAttempts: userPermission.grantedBy.failedLoginAttempts,
        lockedUntil: userPermission.grantedBy.lockedUntil || undefined,
        restaurantId: userPermission.grantedBy.restaurantId,
        assignedById: userPermission.grantedBy.assignedById || undefined,
        createdAt: userPermission.grantedBy.createdAt,
        updatedAt: userPermission.grantedBy.updatedAt,
      } : undefined,
    };
  }

  async findByPermissionId(permissionId: string): Promise<UserPermission[]> {
    const userPermissions = await this.prisma.userPermission.findMany({
      where: { permissionId, isActive: true },
      include: {
        user: true,
        grantedBy: true,
      },
      orderBy: { grantedAt: 'desc' },
    });

    return userPermissions.map(up => ({
      id: up.id,
      userId: up.userId,
      permissionId: up.permissionId,
      grantedById: up.grantedById || undefined,
      grantedAt: up.grantedAt,
      expiresAt: up.expiresAt || undefined,
      isActive: up.isActive,
      user: up.user ? {
        id: up.user.id,
        email: up.user.email,
        firstName: up.user.firstName,
        lastName: up.user.lastName,
        password: up.user.password || undefined,
        role: up.user.role,
        isActive: up.user.isActive,
        lastLoginAt: up.user.lastLoginAt || undefined,
        failedLoginAttempts: up.user.failedLoginAttempts,
        lockedUntil: up.user.lockedUntil || undefined,
        restaurantId: up.user.restaurantId,
        assignedById: up.user.assignedById || undefined,
        createdAt: up.user.createdAt,
        updatedAt: up.user.updatedAt,
      } : undefined,
      grantedBy: up.grantedBy ? {
        id: up.grantedBy.id,
        email: up.grantedBy.email,
        firstName: up.grantedBy.firstName,
        lastName: up.grantedBy.lastName,
        password: up.grantedBy.password || undefined,
        role: up.grantedBy.role,
        isActive: up.grantedBy.isActive,
        lastLoginAt: up.grantedBy.lastLoginAt || undefined,
        failedLoginAttempts: up.grantedBy.failedLoginAttempts,
        lockedUntil: up.grantedBy.lockedUntil || undefined,
        restaurantId: up.grantedBy.restaurantId,
        assignedById: up.grantedBy.assignedById || undefined,
        createdAt: up.grantedBy.createdAt,
        updatedAt: up.grantedBy.updatedAt,
      } : undefined,
    }));
  }

  async findActiveByUserId(userId: string): Promise<UserPermission[]> {
    const userPermissions = await this.prisma.userPermission.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        permission: true,
        grantedBy: true,
      },
      orderBy: [
        { permission: { category: 'asc' } },
        { permission: { name: 'asc' } }
      ],
    });

    return userPermissions.map(up => ({
      id: up.id,
      userId: up.userId,
      permissionId: up.permissionId,
      grantedById: up.grantedById || undefined,
      grantedAt: up.grantedAt,
      expiresAt: up.expiresAt || undefined,
      isActive: up.isActive,
      permission: up.permission ? {
        id: up.permission.id,
        name: up.permission.name,
        category: up.permission.category,
        action: up.permission.action,
        description: up.permission.description || undefined,
        isActive: up.permission.isActive,
        createdAt: up.permission.createdAt,
        updatedAt: up.permission.updatedAt,
      } : undefined,
      grantedBy: up.grantedBy ? {
        id: up.grantedBy.id,
        email: up.grantedBy.email,
        firstName: up.grantedBy.firstName,
        lastName: up.grantedBy.lastName,
        password: up.grantedBy.password || undefined,
        role: up.grantedBy.role,
        isActive: up.grantedBy.isActive,
        lastLoginAt: up.grantedBy.lastLoginAt || undefined,
        failedLoginAttempts: up.grantedBy.failedLoginAttempts,
        lockedUntil: up.grantedBy.lockedUntil || undefined,
        restaurantId: up.grantedBy.restaurantId,
        assignedById: up.grantedBy.assignedById || undefined,
        createdAt: up.grantedBy.createdAt,
        updatedAt: up.grantedBy.updatedAt,
      } : undefined,
    }));
  }

  async findExpiredPermissions(): Promise<UserPermission[]> {
    const expiredPermissions = await this.prisma.userPermission.findMany({
      where: {
        isActive: true,
        expiresAt: { lte: new Date() }
      },
      include: {
        user: true,
        permission: true,
      },
    });

    return expiredPermissions.map(up => ({
      id: up.id,
      userId: up.userId,
      permissionId: up.permissionId,
      grantedById: up.grantedById || undefined,
      grantedAt: up.grantedAt,
      expiresAt: up.expiresAt || undefined,
      isActive: up.isActive,
      permission: up.permission ? {
        id: up.permission.id,
        name: up.permission.name,
        category: up.permission.category,
        action: up.permission.action,
        description: up.permission.description || undefined,
        isActive: up.permission.isActive,
        createdAt: up.permission.createdAt,
        updatedAt: up.permission.updatedAt,
      } : undefined,
      user: up.user ? {
        id: up.user.id,
        email: up.user.email,
        firstName: up.user.firstName,
        lastName: up.user.lastName,
        password: up.user.password || undefined,
        role: up.user.role,
        isActive: up.user.isActive,
        lastLoginAt: up.user.lastLoginAt || undefined,
        failedLoginAttempts: up.user.failedLoginAttempts,
        lockedUntil: up.user.lockedUntil || undefined,
        restaurantId: up.user.restaurantId,
        assignedById: up.user.assignedById || undefined,
        createdAt: up.user.createdAt,
        updatedAt: up.user.updatedAt,
      } : undefined,
    }));
  }

  async create(data: {
    userId: string;
    permissionId: string;
    grantedById?: string;
    expiresAt?: Date;
  }): Promise<UserPermission> {
    const userPermission = await this.prisma.userPermission.create({
      data: {
        userId: data.userId,
        permissionId: data.permissionId,
        grantedById: data.grantedById,
        expiresAt: data.expiresAt,
      },
      include: {
        permission: true,
        grantedBy: true,
      },
    });

    return {
      id: userPermission.id,
      userId: userPermission.userId,
      permissionId: userPermission.permissionId,
      grantedById: userPermission.grantedById || undefined,
      grantedAt: userPermission.grantedAt,
      expiresAt: userPermission.expiresAt || undefined,
      isActive: userPermission.isActive,
      permission: userPermission.permission ? {
        id: userPermission.permission.id,
        name: userPermission.permission.name,
        category: userPermission.permission.category,
        action: userPermission.permission.action,
        description: userPermission.permission.description || undefined,
        isActive: userPermission.permission.isActive,
        createdAt: userPermission.permission.createdAt,
        updatedAt: userPermission.permission.updatedAt,
      } : undefined,
      grantedBy: userPermission.grantedBy ? {
        id: userPermission.grantedBy.id,
        email: userPermission.grantedBy.email,
        firstName: userPermission.grantedBy.firstName,
        lastName: userPermission.grantedBy.lastName,
        password: userPermission.grantedBy.password || undefined,
        role: userPermission.grantedBy.role,
        isActive: userPermission.grantedBy.isActive,
        lastLoginAt: userPermission.grantedBy.lastLoginAt || undefined,
        failedLoginAttempts: userPermission.grantedBy.failedLoginAttempts,
        lockedUntil: userPermission.grantedBy.lockedUntil || undefined,
        restaurantId: userPermission.grantedBy.restaurantId,
        assignedById: userPermission.grantedBy.assignedById || undefined,
        createdAt: userPermission.grantedBy.createdAt,
        updatedAt: userPermission.grantedBy.updatedAt,
      } : undefined,
    };
  }

  async update(
    id: string,
    data: Partial<{
      expiresAt: Date | null;
      isActive: boolean;
    }>
  ): Promise<UserPermission> {
    const userPermission = await this.prisma.userPermission.update({
      where: { id },
      data,
      include: {
        permission: true,
        grantedBy: true,
      },
    });

    return {
      id: userPermission.id,
      userId: userPermission.userId,
      permissionId: userPermission.permissionId,
      grantedById: userPermission.grantedById || undefined,
      grantedAt: userPermission.grantedAt,
      expiresAt: userPermission.expiresAt || undefined,
      isActive: userPermission.isActive,
      permission: userPermission.permission ? {
        id: userPermission.permission.id,
        name: userPermission.permission.name,
        category: userPermission.permission.category,
        action: userPermission.permission.action,
        description: userPermission.permission.description || undefined,
        isActive: userPermission.permission.isActive,
        createdAt: userPermission.permission.createdAt,
        updatedAt: userPermission.permission.updatedAt,
      } : undefined,
      grantedBy: userPermission.grantedBy ? {
        id: userPermission.grantedBy.id,
        email: userPermission.grantedBy.email,
        firstName: userPermission.grantedBy.firstName,
        lastName: userPermission.grantedBy.lastName,
        password: userPermission.grantedBy.password || undefined,
        role: userPermission.grantedBy.role,
        isActive: userPermission.grantedBy.isActive,
        lastLoginAt: userPermission.grantedBy.lastLoginAt || undefined,
        failedLoginAttempts: userPermission.grantedBy.failedLoginAttempts,
        lockedUntil: userPermission.grantedBy.lockedUntil || undefined,
        restaurantId: userPermission.grantedBy.restaurantId,
        assignedById: userPermission.grantedBy.assignedById || undefined,
        createdAt: userPermission.grantedBy.createdAt,
        updatedAt: userPermission.grantedBy.updatedAt,
      } : undefined,
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.userPermission.delete({
      where: { id },
    });
  }

  async deleteByUserIdAndPermissionId(userId: string, permissionId: string): Promise<void> {
    await this.prisma.userPermission.delete({
      where: {
        userId_permissionId: {
          userId,
          permissionId,
        },
      },
    });
  }

  async deactivateExpiredPermissions(): Promise<number> {
    const result = await this.prisma.userPermission.updateMany({
      where: {
        isActive: true,
        expiresAt: { lte: new Date() }
      },
      data: { isActive: false },
    });

    return result.count;
  }

  async deactivateByUserId(userId: string): Promise<number> {
    const result = await this.prisma.userPermission.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    return result.count;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.prisma.userPermission.deleteMany({
      where: { userId },
    });

    return result.count;
  }
}
