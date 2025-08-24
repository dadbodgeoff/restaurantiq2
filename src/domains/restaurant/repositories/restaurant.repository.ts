import { PrismaClient } from '@prisma/client';
import { Restaurant } from '../../shared/types/restaurant';

export class RestaurantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(restaurantId: string): Promise<Restaurant | null> {
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
  }

  async findByUserId(userId: string): Promise<Restaurant | null> {
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
  }

  async create(data: {
    name: string;
    timezone?: string;
    locale?: string;
    currency?: string;
    settings?: any;
  }): Promise<Restaurant> {
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
  }

  async delete(restaurantId: string): Promise<void> {
    await this.prisma.restaurant.delete({
      where: { id: restaurantId },
    });
  }
}
