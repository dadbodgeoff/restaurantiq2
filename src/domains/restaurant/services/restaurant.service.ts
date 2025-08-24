import { RestaurantRepository } from '../repositories/restaurant.repository';
import { UserRepository } from '../repositories/user.repository';
import { Restaurant, RestaurantSettings } from '../../shared/types/restaurant';
import { BusinessRuleError } from '../../../lib/errors/specific-errors';

export class RestaurantService {
  constructor(
    private readonly restaurantRepository: RestaurantRepository,
    private readonly userRepository: UserRepository
  ) {}

  async getRestaurantById(restaurantId: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new BusinessRuleError(
        `Restaurant with ID ${restaurantId} not found`,
        'unknown',
        { restaurantId }
      );
    }
    return restaurant;
  }

  async getRestaurantByUserId(userId: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findByUserId(userId);
    if (!restaurant) {
      throw new BusinessRuleError(
        `Restaurant not found for user ${userId}`,
        'unknown',
        { userId }
      );
    }
    return restaurant;
  }

  async createRestaurant(data: {
    name: string;
    timezone?: string;
    locale?: string;
    currency?: string;
    settings?: RestaurantSettings;
  }): Promise<Restaurant> {
    // Business rules validation
    if (!data.name || data.name.trim().length === 0) {
      throw new BusinessRuleError(
        'Restaurant name is required',
        'unknown',
        { name: data.name }
      );
    }

    return await this.restaurantRepository.create(data);
  }

  async updateRestaurant(
    restaurantId: string,
    data: Partial<{
      name: string;
      timezone: string;
      locale: string;
      currency: string;
      settings: RestaurantSettings;
      isActive: boolean;
    }>
  ): Promise<Restaurant> {
    // Validate business rules
    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      throw new BusinessRuleError(
        'Restaurant name cannot be empty',
        'unknown',
        { restaurantId, name: data.name }
      );
    }

    return await this.restaurantRepository.update(restaurantId, data);
  }

  async validateRestaurantAccess(userId: string, restaurantId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) return false;

    return user.restaurantId === restaurantId;
  }

  async getRestaurantUsers(restaurantId: string): Promise<any[]> {
    return await this.userRepository.findByRestaurantId(restaurantId);
  }
}
