import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../../shared/base-repository';

export class VendorRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma); // MANDATORY
  }

  async findById(id: string) {
    this.validateId(id, 'Vendor'); // MANDATORY
    return this.executeQuery(async () => { // MANDATORY
      this.logOperation('findById', { id }); // MANDATORY
      return await this.prisma.vendor.findUnique({
        where: { id },
        include: {
          restaurant: true,
          invoices: {
            orderBy: { createdAt: 'desc' },
            take: 10 // Latest 10 invoices
          },
          _count: {
            select: {
              invoices: true,
              items: true
            }
          }
        }
      });
    }, 'findById'); // MANDATORY
  }

  async findByRestaurantId(restaurantId: string) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('findByRestaurantId', { restaurantId });
      return await this.prisma.vendor.findMany({
        where: { restaurantId },
        include: {
          _count: {
            select: {
              invoices: true,
              items: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    }, 'findByRestaurantId');
  }

  async findActiveByRestaurantId(restaurantId: string) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('findActiveByRestaurantId', { restaurantId });
      return await this.prisma.vendor.findMany({
        where: { 
          restaurantId,
          isActive: true 
        },
        include: {
          _count: {
            select: {
              invoices: true,
              items: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    }, 'findActiveByRestaurantId');
  }

  async searchByName(restaurantId: string, searchTerm: string) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateRequiredString(searchTerm, 'Search term');
    return this.executeQuery(async () => {
      this.logOperation('searchByName', { restaurantId, searchTerm });
      return await this.prisma.vendor.findMany({
        where: {
          restaurantId,
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        include: {
          _count: {
            select: {
              invoices: true,
              items: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    }, 'searchByName');
  }

  async create(data: {
    restaurantId: string;
    name: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    isActive?: boolean;
  }) {
    this.validateId(data.restaurantId, 'Restaurant');
    this.validateRequiredString(data.name, 'Vendor name');
    return this.executeQuery(async () => {
      this.logOperation('create', { name: data.name, restaurantId: data.restaurantId });
      return await this.prisma.vendor.create({
        data: {
          ...data,
          isActive: data.isActive ?? true
        },
        include: {
          restaurant: true,
          _count: {
            select: {
              invoices: true,
              items: true
            }
          }
        }
      });
    }, 'create');
  }

  async update(id: string, data: Partial<{
    name: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    isActive: boolean;
  }>) {
    this.validateId(id, 'Vendor');
    return this.executeQuery(async () => {
      this.logOperation('update', { id, fields: Object.keys(data) });
      return await this.prisma.vendor.update({
        where: { id },
        data,
        include: {
          restaurant: true,
          _count: {
            select: {
              invoices: true,
              items: true
            }
          }
        }
      });
    }, 'update');
  }

  async delete(id: string) {
    this.validateId(id, 'Vendor');
    return this.executeQuery(async () => {
      this.logOperation('delete', { id });
      return await this.prisma.vendor.delete({
        where: { id }
      });
    }, 'delete');
  }

  async updateActiveStatus(id: string, isActive: boolean) {
    this.validateId(id, 'Vendor');
    return this.executeQuery(async () => {
      this.logOperation('updateActiveStatus', { id, isActive });
      return await this.prisma.vendor.update({
        where: { id },
        data: { isActive },
        include: {
          restaurant: true,
          _count: {
            select: {
              invoices: true,
              items: true
            }
          }
        }
      });
    }, 'updateActiveStatus');
  }

  async findByNameAndRestaurant(restaurantId: string, name: string) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateRequiredString(name, 'Vendor name');
    return this.executeQuery(async () => {
      this.logOperation('findByNameAndRestaurant', { restaurantId, name });
      return await this.prisma.vendor.findFirst({
        where: {
          restaurantId,
          name: {
            equals: name,
            mode: 'insensitive'
          }
        }
      });
    }, 'findByNameAndRestaurant');
  }

  async getVendorStats(vendorId: string) {
    this.validateId(vendorId, 'Vendor');
    return this.executeQuery(async () => {
      this.logOperation('getVendorStats', { vendorId });
      return await this.prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          _count: {
            select: {
              invoices: true,
              items: true,
              itemStats: true
            }
          },
          invoices: {
            select: {
              total: true,
              invoiceDate: true
            },
            orderBy: { invoiceDate: 'desc' },
            take: 30 // Last 30 invoices for stats
          }
        }
      });
    }, 'getVendorStats');
  }

  async findOrCreateByName(restaurantId: string, name: string) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateRequiredString(name, 'Vendor name');
    return this.executeQuery(async () => {
      this.logOperation('findOrCreateByName', { restaurantId, name });
      
      // First try to find existing vendor
      const existingVendor = await this.findByNameAndRestaurant(restaurantId, name);
      if (existingVendor) {
        return existingVendor;
      }
      
      // Create new vendor if not found
      return await this.create({
        restaurantId,
        name: name.trim()
      });
    }, 'findOrCreateByName');
  }
}
