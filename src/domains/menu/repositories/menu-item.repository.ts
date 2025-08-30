import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../../shared/base-repository';

export class MenuItemRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma); // MANDATORY
  }

  async findById(id: string) {
    this.validateId(id, 'MenuItem'); // MANDATORY
    return this.executeQuery(async () => { // MANDATORY
      this.logOperation('findById', { id }); // MANDATORY
      return await this.prisma.menuItem.findUnique({
        where: { id },
        include: {
          category: true,
          options: {
            orderBy: { displayOrder: 'asc' }
          }
        }
      });
    }, 'findById'); // MANDATORY
  }

  async findByRestaurantId(restaurantId: string) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('findByRestaurantId', { restaurantId });
      return await this.prisma.menuItem.findMany({
        where: { restaurantId },
        include: { category: true },
        orderBy: { name: 'asc' }
      });
    }, 'findByRestaurantId');
  }

  async findByCategory(categoryId: string) {
    this.validateId(categoryId, 'MenuCategory');
    return this.executeQuery(async () => {
      this.logOperation('findByCategory', { categoryId });
      return await this.prisma.menuItem.findMany({
        where: {
          categoryId,
          isAvailable: true
        },
        include: { category: true },
        orderBy: { name: 'asc' }
      });
    }, 'findByCategory');
  }

  async searchItems(restaurantId: string, query: string) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('searchItems', { restaurantId, query });
      return await this.prisma.menuItem.findMany({
        where: {
          restaurantId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { name: { contains: query, mode: 'insensitive' } } }
          ]
        },
        include: { category: true }
      });
    }, 'searchItems');
  }

  async create(data: {
    restaurantId: string;
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isAvailable?: boolean;
    prepTimeMinutes?: number;
    prepNotes?: string;
    allergens?: string;
    nutritionalInfo?: string;
  }) {
    this.validateId(data.restaurantId, 'Restaurant');
    this.validateId(data.categoryId, 'MenuCategory');
    return this.executeQuery(async () => {
      this.logOperation('create', { name: data.name, restaurantId: data.restaurantId });
      return await this.prisma.menuItem.create({
        data: {
          ...data,
          isAvailable: data.isAvailable ?? true,
          prepTimeMinutes: data.prepTimeMinutes ?? 0
        }
      });
    }, 'create');
  }

  async update(id: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    isAvailable: boolean;
    prepTimeMinutes: number;
    prepNotes: string;
    allergens: string;
    nutritionalInfo: string;
  }>) {
    this.validateId(id, 'MenuItem');
    return this.executeQuery(async () => {
      this.logOperation('update', { id, fields: Object.keys(data) });
      return await this.prisma.menuItem.update({
        where: { id },
        data
      });
    }, 'update');
  }

  async delete(id: string) {
    this.validateId(id, 'MenuItem');
    return this.executeQuery(async () => {
      this.logOperation('delete', { id });
      return await this.prisma.menuItem.delete({
        where: { id }
      });
    }, 'delete');
  }

  async updateAvailability(id: string, isAvailable: boolean) {
    this.validateId(id, 'MenuItem');
    return this.executeQuery(async () => {
      this.logOperation('updateAvailability', { id, isAvailable });
      return await this.prisma.menuItem.update({
        where: { id },
        data: { isAvailable }
      });
    }, 'updateAvailability');
  }

  async findItemOptions(itemId: string) {
    this.validateId(itemId, 'MenuItem');
    return this.executeQuery(async () => {
      this.logOperation('findItemOptions', { itemId });
      return await this.prisma.menuItemOption.findMany({
        where: { menuItemId: itemId },
        orderBy: { displayOrder: 'asc' }
      });
    }, 'findItemOptions');
  }

  async createItemOption(data: {
    menuItemId: string;
    name: string;
    type: string;
    priceModifier?: number;
    isRequired?: boolean;
    maxSelections?: number;
    displayOrder?: number;
  }) {
    this.validateId(data.menuItemId, 'MenuItem');
    return this.executeQuery(async () => {
      this.logOperation('createItemOption', { menuItemId: data.menuItemId, name: data.name });
      return await this.prisma.menuItemOption.create({
        data: {
          ...data,
          priceModifier: data.priceModifier ?? 0,
          isRequired: data.isRequired ?? false,
          maxSelections: data.maxSelections ?? 1,
          displayOrder: data.displayOrder ?? 0
        }
      });
    }, 'createItemOption');
  }

  async updateItemOption(id: string, data: Partial<{
    name: string;
    type: string;
    priceModifier: number;
    isRequired: boolean;
    maxSelections: number;
    displayOrder: number;
  }>) {
    this.validateId(id, 'MenuItemOption');
    return this.executeQuery(async () => {
      this.logOperation('updateItemOption', { id, fields: Object.keys(data) });
      return await this.prisma.menuItemOption.update({
        where: { id },
        data
      });
    }, 'updateItemOption');
  }

  async deleteItemOption(id: string) {
    this.validateId(id, 'MenuItemOption');
    return this.executeQuery(async () => {
      this.logOperation('deleteItemOption', { id });
      return await this.prisma.menuItemOption.delete({
        where: { id }
      });
    }, 'deleteItemOption');
  }
}
