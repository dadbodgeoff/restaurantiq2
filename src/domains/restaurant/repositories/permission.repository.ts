import { PrismaClient } from '@prisma/client';
import { Permission } from '../../shared/types/restaurant';

export class PermissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Permission | null> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) return null;

    return {
      id: permission.id,
      name: permission.name,
      category: permission.category,
      action: permission.action,
      description: permission.description || undefined,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }

  async findByName(name: string): Promise<Permission | null> {
    const permission = await this.prisma.permission.findUnique({
      where: { name },
    });

    if (!permission) return null;

    return {
      id: permission.id,
      name: permission.name,
      category: permission.category,
      action: permission.action,
      description: permission.description || undefined,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }

  async findByCategory(category: string): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { category, isActive: true },
      orderBy: { name: 'asc' },
    });

    return permissions.map(permission => ({
      id: permission.id,
      name: permission.name,
      category: permission.category,
      action: permission.action,
      description: permission.description || undefined,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    }));
  }

  async findAllActive(): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
    });

    return permissions.map(permission => ({
      id: permission.id,
      name: permission.name,
      category: permission.category,
      action: permission.action,
      description: permission.description || undefined,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    }));
  }

  async create(data: {
    name: string;
    category: string;
    action: string;
    description?: string;
  }): Promise<Permission> {
    const permission = await this.prisma.permission.create({
      data: {
        name: data.name,
        category: data.category,
        action: data.action,
        description: data.description,
      },
    });

    return {
      id: permission.id,
      name: permission.name,
      category: permission.category,
      action: permission.action,
      description: permission.description || undefined,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      category: string;
      action: string;
      description: string;
      isActive: boolean;
    }>
  ): Promise<Permission> {
    const permission = await this.prisma.permission.update({
      where: { id },
      data,
    });

    return {
      id: permission.id,
      name: permission.name,
      category: permission.category,
      action: permission.action,
      description: permission.description || undefined,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.permission.delete({
      where: { id },
    });
  }

  async deactivate(id: string): Promise<Permission> {
    const permission = await this.prisma.permission.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      id: permission.id,
      name: permission.name,
      category: permission.category,
      action: permission.action,
      description: permission.description || undefined,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }
}
