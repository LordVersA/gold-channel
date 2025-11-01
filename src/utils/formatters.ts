import { toZonedTime } from 'date-fns-tz';
import { config } from '../config/config';
import moment from 'moment-jalaali';

/**
 * Format utilities for dates, currency, and other data
 */

/**
 * Format a date to Shamsi (Jalali/Persian) calendar
 * Returns format: YYYY/MM/DD HH:mm:ss
 */
export function formatDateTime(date: Date): string {
  const zonedDate = toZonedTime(date, config.timezone);
  const m = moment(zonedDate);
  return m.format('jYYYY/jMM/jDD HH:mm:ss');
}

/**
 * Format currency in Toman (converted from Rial)
 * Displays with thousands separator and no decimals
 */
export function formatCurrency(amountInRial: number): string {
  const amountInToman = amountInRial / 10;
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInToman) + ' تومان';
}

/**
 * Format weight in grams (Persian)
 */
export function formatWeight(grams: number): string {
  return `${grams} گرم`;
}
