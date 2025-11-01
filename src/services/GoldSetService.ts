import { prisma } from '../config/database';

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
      },
      orderBy: {
        priceChecks: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return results.map((result) => ({
      goldSetId: result.id,
      caption: result.caption,
      viewCount: result._count.priceChecks,
      channelMessageId: result.channelMessageId,
      channelId: result.channelId,
    }));
  }
}
