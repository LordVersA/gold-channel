import { prisma } from '../config/database';
import { config } from '../config/config';
import axios from 'axios';
import https from 'https';
import * as cheerio from 'cheerio';

/**
 * Gold Price Service
 * Handles fetching and caching of spot gold prices
 * Scrapes from tgju.org website (18-carat gold price)
 */

export class GoldPriceService {
  /**
   * Fetch spot price from tgju.org website
   * Returns the current price of 18-carat gold per gram
   */
  private static async fetchSpotPrice(): Promise<number> {
    try {
      const response = await axios.get('https://www.tgju.org/profile/geram18/category', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.tgju.org/',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: true
        }),
        proxy: false,
        decompress: true,
        timeout: 10000,
        maxRedirects: 5
      });

      // Parse HTML with cheerio
      const $ = cheerio.load(response.data);

      // Extract price using the provided CSS selector
      const priceElement = $('#main > div.stocks-profile > div.stocks-header > div.stocks-header-main > div > div.fs-cell.fs-xl-3.fs-lg-3.fs-md-6.fs-sm-12.fs-xs-12.top-header-item-block-2.mobile-top-item-hide > div > h3.line.clearfix.mobile-hide-block > span.value > span:nth-child(1)');

      const priceText = priceElement.text().trim();

      if (!priceText) {
        throw new Error('Price element not found on page');
      }

      // Remove commas and parse the price (e.g., "103,818,000" -> "103818000")
      const cleanedPrice = priceText.replace(/,/g, '');
      const price = parseFloat(cleanedPrice);

      if (isNaN(price)) {
        throw new Error(`Invalid price format: ${priceText}`);
      }

      console.log(`Fetched gold price: ${price}`);
      return price;
    } catch (error) {
      console.error('Error fetching gold price:', error);
      throw new Error('Failed to fetch gold price from tgju.org');
    }
  }

  /**
   * Get cached price or fetch if stale
   */
  static async getCachedPrice(): Promise<number> {
    // Try to get cached price
    const cache = await prisma.priceCache.findFirst({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        fetchedAt: 'desc',
      },
    });

    if (cache) {
      console.log('Using cached gold price');
      return cache.pricePerGram;
    }

    // Cache is stale or doesn't exist, fetch new price
    try {
      const price = await this.fetchSpotPrice();
      await this.updateCache(price);
      return price;
    } catch (error) {
      // If fetch fails, try to get last known price (even if expired)
      const lastKnownPrice = await prisma.priceCache.findFirst({
        orderBy: {
          fetchedAt: 'desc',
        },
      });

      if (lastKnownPrice) {
        console.log('Using last known price due to API failure');
        return lastKnownPrice.pricePerGram;
      }

      // No price available at all
      throw new Error('Unable to fetch gold price and no cached price available');
    }
  }

  /**
   * Update cache with new price
   */
  private static async updateCache(price: number): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + config.priceCacheTtl);

    await prisma.priceCache.create({
      data: {
        pricePerGram: price,
        expiresAt,
      },
    });

    // Clean up old cache entries (keep last 10)
    const allCaches = await prisma.priceCache.findMany({
      orderBy: { fetchedAt: 'desc' },
      skip: 10,
    });

    if (allCaches.length > 0) {
      await prisma.priceCache.deleteMany({
        where: {
          id: {
            in: allCaches.map((c) => c.id),
          },
        },
      });
    }
  }
}
