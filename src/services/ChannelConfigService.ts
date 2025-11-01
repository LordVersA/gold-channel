import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ChannelConfigService {
  /**
   * Get channel config or create with defaults if not exists
   */
  static async getOrCreateConfig(channelId: string) {
    let config = await prisma.channelConfig.findUnique({
      where: { channelId },
    });

    if (!config) {
      config = await prisma.channelConfig.create({
        data: { channelId },
      });
    }

    return config;
  }

  /**
   * Update customer tax percentage
   */
  static async updateCustomerTax(channelId: string, percentage: number) {
    const config = await this.getOrCreateConfig(channelId);
    return prisma.channelConfig.update({
      where: { id: config.id },
      data: { customerTax: percentage / 100 }, // Convert percentage to decimal
    });
  }

  /**
   * Update customer labor fee percentage
   */
  static async updateCustomerLaborFee(channelId: string, percentage: number) {
    const config = await this.getOrCreateConfig(channelId);
    return prisma.channelConfig.update({
      where: { id: config.id },
      data: { customerLaborFee: percentage / 100 },
    });
  }

  /**
   * Update customer selling profit percentage
   */
  static async updateCustomerSellingProfit(channelId: string, percentage: number) {
    const config = await this.getOrCreateConfig(channelId);
    return prisma.channelConfig.update({
      where: { id: config.id },
      data: { customerSellingProfit: percentage / 100 },
    });
  }

  /**
   * Update collaborator tax percentage
   */
  static async updateCollabTax(channelId: string, percentage: number) {
    const config = await this.getOrCreateConfig(channelId);
    return prisma.channelConfig.update({
      where: { id: config.id },
      data: { collabTax: percentage / 100 },
    });
  }

  /**
   * Update collaborator labor fee percentage
   */
  static async updateCollabLaborFee(channelId: string, percentage: number) {
    const config = await this.getOrCreateConfig(channelId);
    return prisma.channelConfig.update({
      where: { id: config.id },
      data: { collabLaborFee: percentage / 100 },
    });
  }

  /**
   * Update collaborator selling profit percentage
   */
  static async updateCollabSellingProfit(channelId: string, percentage: number) {
    const config = await this.getOrCreateConfig(channelId);
    return prisma.channelConfig.update({
      where: { id: config.id },
      data: { collabSellingProfit: percentage / 100 },
    });
  }

  /**
   * Get all pricing parameters for a channel
   */
  static async getPricingConfig(channelId: string) {
    const config = await this.getOrCreateConfig(channelId);
    return {
      customer: {
        tax: Math.round(config.customerTax * 100),
        laborFee: Math.round(config.customerLaborFee * 100),
        sellingProfit: Math.round(config.customerSellingProfit * 100),
        total: Math.round((config.customerTax + config.customerLaborFee + config.customerSellingProfit) * 100),
      },
      collab: {
        tax: Math.round(config.collabTax * 100),
        laborFee: Math.round(config.collabLaborFee * 100),
        sellingProfit: Math.round(config.collabSellingProfit * 100),
        total: Math.round((config.collabTax + config.collabLaborFee + config.collabSellingProfit) * 100),
      },
    };
  }
}
