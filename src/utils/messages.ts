/**
 * Persian (Farsi) Message Templates
 * All user-facing bot messages in Persian
 */

import { toPersianNumber } from './formatters';

export const Messages = {
  // Welcome messages
  welcome: 'خوش آمدید! من ربات مدیریت ست های طلا هستم.',
  welcomeAdmin: 'خوش آمدید ادمین عزیز! شما می‌توانید ست های طلا را مدیریت کنید.',
  welcomeCollaborator: 'خوش آمدید همکار عزیز! شما به عنوان همکار ثبت شدید.',

  // Registration messages
  adminRegistered: 'شما با موفقیت به عنوان ادمین ثبت شدید.',
  collaboratorRegistered: 'شما با موفقیت به عنوان همکار ثبت شدید.',
  alreadyAdmin: 'شما از قبل به عنوان ادمین ثبت شده‌اید.',
  alreadyCollaborator: 'شما از قبل به عنوان همکار ثبت شده‌اید.',

  // Token messages
  tokenExpired: 'لینک دعوت منقضی شده است.',
  tokenInvalid: 'لینک دعوت نامعتبر است.',
  tokenUsed: 'این لینک دعوت قبلاً استفاده شده است.',

  // Channel setup
  setChannelInstructions: '✅ برای تنظیم کانال:\n\n1️⃣ مرا به کانال مورد نظر اضافه کنید\n2️⃣ مرا به عنوان ادمین کانال تنظیم کنید\n3️⃣ یک پیام از آن کانال را برای من فوروارد کنید\n\n📝 پس از انجام این مراحل، شما به عنوان ادمین کانال ثبت خواهید شد.',
  channelSet: 'کانال با موفقیت تنظیم شد!',
  channelSetError: 'خطا در تنظیم کانال. لطفاً مطمئن شوید که ربات ادمین کانال است.',

  // Album creation (single image flow)
  imageReceived: 'عکس دریافت شد! حالا لطفاً کپشن را بفرستید:',
  captionReceived: 'کپشن دریافت شد! حالا لطفاً وزن (به گرم) را وارد کنید:',
  weightInvalid: 'وزن وارد شده نامعتبر است. لطفاً یک عدد مثبت وارد کنید.',
  albumPreview: 'پیش‌نمایش ست طلا:',
  actionCancelled: 'عملیات لغو شد.',

  // Preview actions
  previewPriceNow: 'قیمت الان',
  previewFinalize: 'نهایی کردن',
  previewCancel: 'لغو',
  cancelButton: 'لغو',

  // Channel actions
  channelPriceNow: 'قیمت الان',

  // Draft actions
  draftFinalized: 'ست طلا با موفقیت در کانال منتشر شد!',
  draftCancelled: 'پیش‌نمایش لغو شد.',
  alreadyFinalized: 'این ست قبلاً منتشر شده است.',

  // Price popup format
  pricePopup: (date: string, weight: string, _spotPrice: string, currentGoldPrice: string, total: string, isCollaborator: boolean, collaboratorPrice?: string) => {
    const profitMargin = isCollaborator ? '۱۶' : '۱۹';
    let message = `🕐 زمان درخواست: ${date}\n\n⚖️ وزن: ${weight}\n💰 قیمت لحظه ای: ${currentGoldPrice}\n🛍️ اجرت: ${profitMargin} ٪ \n📈 سود فروشنده: ۷٪\n\n✨ قیمت لحظه‌ای محصول: ${total}`;
    if (collaboratorPrice && isCollaborator) {
      message += `\n\n👥 قیمت همکار: ${collaboratorPrice}`;
    }
    return message;
  },

  // Error messages
  errorGeneric: 'خطایی رخ داد. لطفاً دوباره تلاش کنید.',
  errorNotAdmin: 'شما دسترسی ادمین ندارید.',
  errorPriceFetch: 'خطا در دریافت قیمت طلا. لطفاً بعداً تلاش کنید.',
  errorPriceTemporarilyUnavailable: 'قیمت موقتاً در دسترس نیست.',

  // Broadcast messages
  pmHamkarInstructions: 'لطفاً پیامی که می‌خواهید به همه همکاران ارسال شود را بفرستید.\n\n📸 می‌توانید عکس، ویدیو، متن یا هر نوع پیام دیگری ارسال کنید.',
  broadcastPreview: '👀 پیش‌نمایش پیام:\n\nآیا می‌خواهید این پیام را به همه همکاران ارسال کنید؟',
  broadcastSubmit: 'ارسال به همه',
  broadcastCancel: 'لغو',
  broadcastSent: 'پیام با موفقیت ارسال شد!',
  broadcastResult: (successCount: number, failCount: number) => {
    let message = `✅ پیام به ${toPersianNumber(successCount)} همکار ارسال شد.`;
    if (failCount > 0) {
      message += `\n❌ ارسال به ${toPersianNumber(failCount)} همکار ناموفق بود.`;
    }
    return message;
  },

  // Collaborator management messages
  collaboratorsListTitle: '👥 لیست همکاران',
  noCollaborators: 'هیچ همکاری ثبت نشده است.',
  collaboratorDeleted: (name: string) => `✅ همکار ${name} حذف شد.`,
  collaboratorNotFound: 'همکار مورد نظر یافت نشد.',

  // Help message
  help: `
راهنمای استفاده از ربات:

دستورات ادمین:
/start - شروع کار با ربات
/setchannel - تنظیم کانال
/hamkar - ایجاد لینک دعوت همکار
/listhamkar - مشاهده لیست همکاران
/addadmin - ایجاد لینک دعوت ادمین
/pmhamkar - ارسال پیام به همه همکاران
/amar - مشاهده آمار بازدید (روز، هفته، ماه)
/help - نمایش این راهنما

تنظیمات قیمت‌گذاری کانال:
/settax <customer|collab> <درصد> - تنظیم مالیات
/setfee <customer|collab> <درصد> - تنظیم اجرت
/setprofit <customer|collab> <درصد> - تنظیم سود فروشنده
/viewpricing - مشاهده تنظیمات فعلی قیمت‌گذاری

ویرایش قیمت هر پست:
برای ویرایش قیمت‌گذاری یک پست خاص، پست را از کانال به ربات فوروارد کنید.

برای ایجاد ست طلا:
1. عکس‌های ست را ارسال کنید
2. کپشن را اضافه کنید
3. وزن را وارد کنید
4. پیش‌نمایش را بررسی کنید
5. نهایی کردن یا لغو

نکته: قیمت مشتریان و همکاران بر اساس تنظیمات شما محاسبه می‌شود.
  `.trim(),

  // Analytics report
  dailyReportTitle: '📊 گزارش روزانه تحلیلات',
  dailyReportDate: (date: string) => `📅 ${date}`,
  topViewedSets: '🏆 پربازدیدترین ست‌های طلا:',
  noViews: 'هیچ بازدیدی در این بازه زمانی ثبت نشده است.',
  viewCount: (caption: string, views: number, link: string) =>
    `${caption} - ${toPersianNumber(views)} بازدید\n🔗 ${link}`,
  viewCountWithUsers: (caption: string, views: number, uniqueUsers: number, link: string) =>
    `${caption} - ${toPersianNumber(views)} بازدید (${toPersianNumber(uniqueUsers)} نفر)\n🔗 ${link}`,

  // Statistics report (/amar command)
  statsReportTitle: '📊 آمار بازدید ست‌های طلا',
  statsDayTitle: '📅 روز گذشته (۲۴ ساعت):',
  statsWeekTitle: '📅 هفته گذشته (۷ روز):',
  statsMonthTitle: '📅 ماه گذشته (۳۰ روز):',

  // Pricing configuration messages
  setTaxUsage: 'استفاده: /settax <customer|collab> <درصد>\n\nمثال: /settax customer 5',
  setFeeUsage: 'استفاده: /setfee <customer|collab> <درصد>\n\nمثال: /setfee customer 19',
  setProfitUsage: 'استفاده: /setprofit <customer|collab> <درصد>\n\nمثال: /setprofit customer 7',
  invalidPricingType: 'نوع نامعتبر است. لطفاً از customer یا collab استفاده کنید.',
  invalidPercentage: 'درصد نامعتبر است. لطفاً یک عدد بین 0 تا 100 وارد کنید.',
  taxUpdated: (type: string, percentage: number) =>
    `✅ مالیات ${type === 'customer' ? 'مشتری' : 'همکار'} به ${toPersianNumber(percentage)}٪ تغییر یافت.`,
  feeUpdated: (type: string, percentage: number) =>
    `✅ اجرت ${type === 'customer' ? 'مشتری' : 'همکار'} به ${toPersianNumber(percentage)}٪ تغییر یافت.`,
  profitUpdated: (type: string, percentage: number) =>
    `✅ سود فروشنده ${type === 'customer' ? 'مشتری' : 'همکار'} به ${toPersianNumber(percentage)}٪ تغییر یافت.`,

  // Pricing display
  viewPricingTitle: '💰 تنظیمات قیمت‌گذاری',
  customerPricing: (tax: number, fee: number, profit: number, total: number) =>
    `👤 قیمت‌گذاری مشتری:\n├ مالیات: ${toPersianNumber(tax)}٪\n├ اجرت: ${toPersianNumber(fee)}٪\n├ سود فروشنده: ${toPersianNumber(profit)}٪\n└ مجموع: ${toPersianNumber(total)}٪`,
  collabPricing: (tax: number, fee: number, profit: number, total: number) =>
    `👥 قیمت‌گذاری همکار:\n├ مالیات: ${toPersianNumber(tax)}٪\n├ اجرت: ${toPersianNumber(fee)}٪\n├ سود فروشنده: ${toPersianNumber(profit)}٪\n└ مجموع: ${toPersianNumber(total)}٪`,

  // Dual price display for collaborators
  pricePopupCollab: (date: string, weight: string, goldPrice: string, tax: number, fee: number, profit: number, collabTotal: string, customerTotal: string) =>
    `🕐 زمان درخواست: ${date}\n⚖️ وزن: ${weight}\n💰 قیمت گرم طلا: ${goldPrice}\n😍 مالیات: ${toPersianNumber(tax)} درصد\n⚒️ اجرت: ${toPersianNumber(fee)} درصد\n💰 سود فروشنده: ${toPersianNumber(profit)} درصد\n\n👥 قیمت شما: ${collabTotal}\n👤 قیمت مشتری: ${customerTotal}`,

  // Simple price display for customers
  pricePopupCustomer: (date: string, weight: string, goldPrice: string, tax: number, fee: number, profit: number, total: string) =>
    `🕐 زمان درخواست: ${date}\n⚖️ وزن: ${weight}\n💰 قیمت گرم طلا: ${goldPrice}\n😍 مالیات: ${toPersianNumber(tax)} درصد\n⚒️ اجرت: ${toPersianNumber(fee)} درصد\n💰 سود فروشنده: ${toPersianNumber(profit)} درصد\n\n✨ قیمت نهایی: ${total}`,

  // Post pricing edit messages
  editPricingMenu: '📝 ویرایش قیمت‌گذاری ست طلا\n\nلطفاً فیلد مورد نظر را انتخاب کنید:\n\n⭐ = قیمت اختصاصی پست\n📋 = قیمت پیش‌فرض کانال',

  editPricingPrompt: (fieldName: string) =>
    `لطفاً درصد جدید برای ${fieldName} را وارد کنید:\n\n💡 عدد بین ۰ تا ۱۰۰`,

  pricingFieldUpdated: (fieldName: string, percentage: number) =>
    `✅ ${fieldName} به ${toPersianNumber(percentage)}٪ تغییر یافت.`,

  postNotFound: 'این پست در پایگاه داده یافت نشد.',

  postPricingReset: 'تمام تنظیمات قیمت‌گذاری این پست پاک شد و به پیش‌فرض کانال بازگشت.',

  resetPricingButton: '🔄 بازگشت به پیش‌فرض کانال',

  // Field name translations
  fieldNames: {
    customerTax: 'مالیات مشتری',
    customerLaborFee: 'اجرت مشتری',
    customerSellingProfit: 'سود فروشنده مشتری',
    collabTax: 'مالیات همکار',
    collabLaborFee: 'اجرت همکار',
    collabSellingProfit: 'سود فروشنده همکار',
  } as const,
};

/**
 * Get Persian field name translation
 */
export function getPersianFieldName(fieldName: string): string {
  return Messages.fieldNames[fieldName as keyof typeof Messages.fieldNames] || fieldName;
}
