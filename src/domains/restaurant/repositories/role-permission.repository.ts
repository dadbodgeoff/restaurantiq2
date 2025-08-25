import { PrismaClient } from '@prisma/client';
import { RolePermission, UserRole } from '../../shared/types/restaurant';

export class RolePermissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<RolePermission | null> {
    const rolePermission = await this.prisma.rolePermission.findUnique({
      where: { id },
      include: {
        permission: true,
      },
    });

    if (!rolePermission) return null;

    return {
      id: rolePermission.id,
      role: rolePermission.role as UserRole,
      permissionId: rolePermission.permissionId,
      createdAt: rolePermission.createdAt,
      permission: rolePermission.permission ? {
        id: rolePermission.permission.id,
        name: rolePermission.permission.name,
        category: rolePermission.permission.category,
        action: rolePermission.permission.action,
        description: rolePermission.permission.description || undefined,
        isActive: rolePermission.permission.isActive,
        createdAt: rolePermission.permission.createdAt,
        updatedAt: rolePermission.permission.updatedAt,
      } : undefined,
    };
  }

  async findByRole(role: UserRole): Promise<RolePermission[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role },
      include: {
        permission: true,
      },
      orderBy: {
        permission: {
          category: 'asc',
        },
      },
    });

    return rolePermissions.map(rp => ({
      id: rp.id,
      role: rp.role as UserRole,
      permissionId: rp.permissionId,
      createdAt: rp.createdAt,
      permission: rp.permission ? {
        id: rp.permission.id,
        name: rp.permission.name,
        category: rp.permission.category,
        action: rp.permission.action,
        description: rp.permission.description || undefined,
        isActive: rp.permission.isActive,
        createdAt: rp.permission.createdAt,
        updatedAt: rp.permission.updatedAt,
      } : undefined,
    }));
  }

  async findByRoleAndPermissionId(role: UserRole, permissionId: string): Promise<RolePermission | null> {
    const rolePermission = await this.prisma.rolePermission.findUnique({
      where: {
        role_permissionId: {
          role,
          permissionId,
        },
      },
      include: {
        permission: true,
      },
    });

    if (!rolePermission) return null;

    return {
      id: rolePermission.id,
      role: rolePermission.role as UserRole,
      permissionId: rolePermission.permissionId,
      createdAt: rolePermission.createdAt,
      permission: rolePermission.permission ? {
        id: rolePermission.permission.id,
        name: rolePermission.permission.name,
        category: rolePermission.permission.category,
        action: rolePermission.permission.action,
        description: rolePermission.permission.description || undefined,
        isActive: rolePermission.permission.isActive,
        createdAt: rolePermission.permission.createdAt,
        updatedAt: rolePermission.permission.updatedAt,
      } : undefined,
    };
  }

  async findByPermissionId(permissionId: string): Promise<RolePermission[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { permissionId },
      include: {
        permission: true,
      },
      orderBy: { role: 'asc' },
    });

    return rolePermissions.map(rp => ({
      id: rp.id,
      role: rp.role as UserRole,
      permissionId: rp.permissionId,
      createdAt: rp.createdAt,
      permission: rp.permission ? {
        id: rp.permission.id,
        name: rp.permission.name,
        category: rp.permission.category,
        action: rp.permission.action,
        description: rp.permission.description || undefined,
        isActive: rp.permission.isActive,
        createdAt: rp.permission.createdAt,
        updatedAt: rp.permission.updatedAt,
      } : undefined,
    }));
  }

  async findAll(): Promise<RolePermission[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      include: {
        permission: true,
      },
      orderBy: [
        { role: 'asc' },
        { permission: { category: 'asc' } }
      ],
    });

    return rolePermissions.map(rp => ({
      id: rp.id,
      role: rp.role as UserRole,
      permissionId: rp.permissionId,
      createdAt: rp.createdAt,
      permission: rp.permission ? {
        id: rp.permission.id,
        name: rp.permission.name,
        category: rp.permission.category,
        action: rp.permission.action,
        description: rp.permission.description || undefined,
        isActive: rp.permission.isActive,
        createdAt: rp.permission.createdAt,
        updatedAt: rp.permission.updatedAt,
      } : undefined,
    }));
  }

  async create(data: {
    role: UserRole;
    permissionId: string;
  }): Promise<RolePermission> {
    const rolePermission = await this.prisma.rolePermission.create({
      data: {
        role: data.role,
        permissionId: data.permissionId,
      },
      include: {
        permission: true,
      },
    });

    return {
      id: rolePermission.id,
      role: rolePermission.role as UserRole,
      permissionId: rolePermission.permissionId,
      createdAt: rolePermission.createdAt,
      permission: rolePermission.permission ? {
        id: rolePermission.permission.id,
        name: rolePermission.permission.name,
        category: rolePermission.permission.category,
        action: rolePermission.permission.action,
        description: rolePermission.permission.description || undefined,
        isActive: rolePermission.permission.isActive,
        createdAt: rolePermission.permission.createdAt,
        updatedAt: rolePermission.permission.updatedAt,
      } : undefined,
    };
  }

  async createMany(data: Array<{
    role: UserRole;
    permissionId: string;
  }>): Promise<RolePermission[]> {
    const createdRolePermissions = await this.prisma.$transaction(
      data.map(item =>
        this.prisma.rolePermission.create({
          data: {
            role: item.role,
            permissionId: item.permissionId,
          },
          include: {
            permission: true,
          },
        })
      )
    );

    return createdRolePermissions.map(rp => ({
      id: rp.id,
      role: rp.role as UserRole,
      permissionId: rp.permissionId,
      createdAt: rp.createdAt,
      permission: rp.permission ? {
        id: rp.permission.id,
        name: rp.permission.name,
        category: rp.permission.category,
        action: rp.permission.action,
        description: rp.permission.description || undefined,
        isActive: rp.permission.isActive,
        createdAt: rp.permission.createdAt,
        updatedAt: rp.permission.updatedAt,
      } : undefined,
    }));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.rolePermission.delete({
      where: { id },
    });
  }

  async deleteByRoleAndPermissionId(role: UserRole, permissionId: string): Promise<void> {
    await this.prisma.rolePermission.delete({
      where: {
        role_permissionId: {
          role,
          permissionId,
        },
      },
    });
  }

  async deleteByRole(role: UserRole): Promise<void> {
    await this.prisma.rolePermission.deleteMany({
      where: { role },
    });
  }

  async deleteByPermissionId(permissionId: string): Promise<void> {
    await this.prisma.rolePermission.deleteMany({
      where: { permissionId },
    });
  }
}
