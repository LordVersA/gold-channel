import { prisma } from '../config/database';
import { ChannelConfigService } from './ChannelConfigService';

/**
 * Gold Set Service
 * Handles gold set management and analytics
 */

export interface GoldSetData {
  channelMessageId: number;
  weight: number;
  caption: string;
  channelId: string;
}

export interface AnalyticsData {
  goldSetId: number;
  caption: string;
  viewCount: number;
  uniqueUserCount: number;
  channelMessageId: number;
  channelId: string;
}

export class GoldSetService {
  /**
   * Save a new gold set
   */
  static async saveGoldSet(data: GoldSetData) {
    return await prisma.goldSet.create({
      data: {
        channelMessageId: data.channelMessageId,
        weight: data.weight,
        caption: data.caption,
        channelId: data.channelId,
      },
    });
  }

  /**
   * Get a gold set by ID
   */
  static async getGoldSet(id: number) {
    return await prisma.goldSet.findUnique({
      where: { id },
    });
  }

  /**
   * Get a gold set by channel message ID
   */
  static async getGoldSetByMessageId(channelId: string, messageId: number) {
    return await prisma.goldSet.findFirst({
      where: {
        channelId,
        channelMessageId: messageId,
      },
    });
  }

  /**
   * Log a price check
   */
  static async logPriceCheck(userId: bigint, goldSetId: number): Promise<void> {
    await prisma.priceCheck.create({
      data: {
        userId,
        goldSetId,
      },
    });
  }

  /**
   * Get top viewed gold sets for a date range
   */
  static async getTopViewedSets(
    channelId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<AnalyticsData[]> {
    // Query to get gold sets with their view counts
    const results = await prisma.goldSet.findMany({
      where: {
        channelId,
        priceChecks: {
          some: {
            checkedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      include: {
        _count: {
          select: {
            priceChecks: {
              where: {
                checkedAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        },
        priceChecks: {
          where: {
            checkedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        priceChecks: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return results.map((result) => {
      // Calculate unique user count
      const uniqueUsers = new Set(result.priceChecks.map(pc => pc.userId.toString()));

      return {
        goldSetId: result.id,
        caption: result.caption,
        viewCount: result._count.priceChecks,
        uniqueUserCount: uniqueUsers.size,
        channelMessageId: result.channelMessageId,
        channelId: result.channelId,
      };
    });
  }

  /**
   * Update a single pricing field for a gold set
   */
  static async updatePricingField(
    goldSetId: number,
    fieldName: string,
    value: number
  ): Promise<void> {
    // Validate field name to prevent injection
    const validFields = [
      'customerTax',
      'customerLaborFee',
      'customerSellingProfit',
      'collabTax',
      'collabLaborFee',
      'collabSellingProfit',
    ];

    if (!validFields.includes(fieldName)) {
      throw new Error(`Invalid pricing field: ${fieldName}`);
    }

    await prisma.goldSet.update({
      where: { id: goldSetId },
      data: { [fieldName]: value },
    });
  }

  /**
   * Get pricing values for a gold set (post-level if set, else channel defaults)
   * Returns object with resolved values and indicators of source
   */
  static async getPricingValues(goldSet: any, channelId: string) {
    const channelConfig = await ChannelConfigService.getOrCreateConfig(channelId);

    return {
      customerTax: {
        value: goldSet.customerTax ?? channelConfig.customerTax,
        isPostLevel: goldSet.customerTax !== null,
      },
      customerLaborFee: {
        value: goldSet.customerLaborFee ?? channelConfig.customerLaborFee,
        isPostLevel: goldSet.customerLaborFee !== null,
      },
      customerSellingProfit: {
        value: goldSet.customerSellingProfit ?? channelConfig.customerSellingProfit,
        isPostLevel: goldSet.customerSellingProfit !== null,
      },
      collabTax: {
        value: goldSet.collabTax ?? channelConfig.collabTax,
        isPostLevel: goldSet.collabTax !== null,
      },
      collabLaborFee: {
        value: goldSet.collabLaborFee ?? channelConfig.collabLaborFee,
        isPostLevel: goldSet.collabLaborFee !== null,
      },
      collabSellingProfit: {
        value: goldSet.collabSellingProfit ?? channelConfig.collabSellingProfit,
        isPostLevel: goldSet.collabSellingProfit !== null,
      },
    };
  }

  /**
   * Reset all post-level pricing to NULL (revert to channel defaults)
   */
  static async resetPostPricing(goldSetId: number): Promise<void> {
    await prisma.goldSet.update({
      where: { id: goldSetId },
      data: {
        customerTax: null,
        customerLaborFee: null,
        customerSellingProfit: null,
        collabTax: null,
        collabLaborFee: null,
        collabSellingProfit: null,
      },
    });
  }
}
