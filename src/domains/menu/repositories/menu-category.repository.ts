import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../../shared/base-repository';

export class MenuCategoryRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma); // MANDATORY
  }

  async findById(id: string) {
    this.validateId(id, 'MenuCategory'); // MANDATORY
    return this.executeQuery(async () => { // MANDATORY
      this.logOperation('findById', { id }); // MANDATORY
      return await this.prisma.menuCategory.findUnique({
        where: { id },
        include: { items: true }
      });
    }, 'findById'); // MANDATORY
  }

  async findByRestaurantId(restaurantId: string) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('findByRestaurantId', { restaurantId });
      return await this.prisma.menuCategory.findMany({
        where: { restaurantId },
        include: { items: true },
        orderBy: { displayOrder: 'asc' }
      });
    }, 'findByRestaurantId');
  }

  async create(data: {
    restaurantId: string;
    name: string;
    description?: string;
    displayOrder?: number;
    isActive?: boolean;
  }) {
    this.validateId(data.restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('create', { name: data.name, restaurantId: data.restaurantId });
      return await this.prisma.menuCategory.create({
        data: {
          ...data,
          displayOrder: data.displayOrder ?? 0,
          isActive: data.isActive ?? true
        }
      });
    }, 'create');
  }

  async update(id: string, data: Partial<{
    name: string;
    description: string;
    displayOrder: number;
    isActive: boolean;
  }>) {
    this.validateId(id, 'MenuCategory');
    return this.executeQuery(async () => {
      this.logOperation('update', { id, fields: Object.keys(data) });
      return await this.prisma.menuCategory.update({
        where: { id },
        data
      });
    }, 'update');
  }

  async delete(id: string) {
    this.validateId(id, 'MenuCategory');
    return this.executeQuery(async () => {
      this.logOperation('delete', { id });
      return await this.prisma.menuCategory.delete({
        where: { id }
      });
    }, 'delete');
  }

  async searchCategories(restaurantId: string, query: string) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('searchCategories', { restaurantId, query });
      return await this.prisma.menuCategory.findMany({
        where: {
          restaurantId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: { items: true },
        orderBy: { displayOrder: 'asc' }
      });
    }, 'searchCategories');
  }

  async findWithItems(restaurantId: string) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('findWithItems', { restaurantId });

      return await this.prisma.menuCategory.findMany({
        where: {
          restaurantId,
          isActive: true
        },
        include: {
          items: {
            where: {
              isAvailable: true
            },
            select: {
              id: true,
              name: true,
              description: true,
              prepTimeMinutes: true,
              isAvailable: true
            },
            orderBy: { name: 'asc' }
          }
        },
        orderBy: { displayOrder: 'asc' }
      });
    }, 'findWithItems');
  }

  async findManyWithItems(restaurantId: string, categoryIds: string[]) {
    this.validateId(restaurantId, 'Restaurant');

    // Validate all category IDs
    categoryIds.forEach(id => this.validateId(id, 'MenuCategory'));

    return this.executeQuery(async () => {
      this.logOperation('findManyWithItems', { restaurantId, categoryCount: categoryIds.length });

      return await this.prisma.menuCategory.findMany({
        where: {
          restaurantId,
          id: { in: categoryIds },
          isActive: true
        },
        include: {
          items: {
            where: {
              isAvailable: true
            },
            select: {
              id: true,
              name: true,
              description: true,
              prepTimeMinutes: true,
              isAvailable: true
            },
            orderBy: { name: 'asc' }
          }
        },
        orderBy: { displayOrder: 'asc' }
      });
    }, 'findManyWithItems');
  }
}
