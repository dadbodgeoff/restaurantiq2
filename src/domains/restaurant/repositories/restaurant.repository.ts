import { PrismaClient } from '@prisma/client';
import { Restaurant } from '../../shared/types/restaurant';
import { BaseRepository } from '../../shared/base-repository';

export class RestaurantRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(restaurantId: string): Promise<Restaurant | null> {
    this.validateId(restaurantId, 'Restaurant');

    return this.executeQuery(async () => {
      this.logOperation('findById', { restaurantId });

      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });

      if (!restaurant) return null;

      return {
        id: restaurant.id,
        name: restaurant.name,
        timezone: restaurant.timezone,
        locale: restaurant.locale,
        currency: restaurant.currency,
        isActive: restaurant.isActive,
        settings: restaurant.settings as any,
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt,
      };
    }, 'findById');
  }

  async findByUserId(userId: string): Promise<Restaurant | null> {
    this.validateId(userId, 'User');

    return this.executeQuery(async () => {
      this.logOperation('findByUserId', { userId });

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { restaurant: true },
      });

      if (!user) return null;

      const restaurant = user.restaurant;
      return {
        id: restaurant.id,
        name: restaurant.name,
        timezone: restaurant.timezone,
        locale: restaurant.locale,
        currency: restaurant.currency,
        isActive: restaurant.isActive,
        settings: restaurant.settings as any,
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt,
      };
    }, 'findByUserId');
  }

  async findAll(): Promise<Restaurant[]> {
    return this.executeQuery(async () => {
      this.logOperation('findAll');

      const restaurants = await this.prisma.restaurant.findMany();

      return restaurants.map(restaurant => ({
        id: restaurant.id,
        name: restaurant.name,
        timezone: restaurant.timezone,
        locale: restaurant.locale,
        currency: restaurant.currency,
        isActive: restaurant.isActive,
        settings: restaurant.settings as any,
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt
      }));
    }, 'findAll');
  }

  async create(data: {
    name: string;
    timezone?: string;
    locale?: string;
    currency?: string;
    settings?: any;
  }): Promise<Restaurant> {
    this.validateRequiredString(data.name, 'Restaurant name');

    return this.executeQuery(async () => {
      this.logOperation('create', { name: data.name });

      const restaurant = await this.prisma.restaurant.create({
        data: {
          name: data.name,
          timezone: data.timezone || 'America/New_York',
          locale: data.locale || 'en-US',
          currency: data.currency || 'USD',
          settings: data.settings || {},
        },
      });

      return {
        id: restaurant.id,
        name: restaurant.name,
        timezone: restaurant.timezone,
        locale: restaurant.locale,
        currency: restaurant.currency,
        isActive: restaurant.isActive,
        settings: restaurant.settings as any,
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt,
      };
    }, 'create');
  }

  async update(
    restaurantId: string,
    data: Partial<{
      name: string;
      timezone: string;
      locale: string;
      currency: string;
      settings: any;
      isActive: boolean;
    }>
  ): Promise<Restaurant> {
    this.validateId(restaurantId, 'Restaurant');

    return this.executeQuery(async () => {
      this.logOperation('update', { restaurantId, fields: Object.keys(data) });

      const restaurant = await this.prisma.restaurant.update({
        where: { id: restaurantId },
        data,
      });

      return {
        id: restaurant.id,
        name: restaurant.name,
        timezone: restaurant.timezone,
        locale: restaurant.locale,
        currency: restaurant.currency,
        isActive: restaurant.isActive,
        settings: restaurant.settings as any,
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt,
      };
    }, 'update');
  }

  async delete(restaurantId: string): Promise<void> {
    this.validateId(restaurantId, 'Restaurant');

    return this.executeQuery(async () => {
      this.logOperation('delete', { restaurantId });

      await this.prisma.restaurant.delete({
        where: { id: restaurantId },
      });
    }, 'delete');
  }
}
