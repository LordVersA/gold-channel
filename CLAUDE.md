# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Telegram bot for managing gold set albums with live pricing functionality. Built with Telegraf (TypeScript), SQLite/Prisma, and node-cron. All user-facing messages are in Persian (Farsi).

**High-Level Spec**: See `telegram-goldbot-spec-highlevel.md` for complete requirements and flows.

## Development Commands

```bash
# Development
pnpm run dev              # Run with hot-reload (ts-node + nodemon)
pnpm run build            # Compile TypeScript to dist/
pnpm run start            # Run compiled bot from dist/

# Database
pnpm run prisma:generate  # Generate Prisma client after schema changes
pnpm run prisma:migrate   # Create and apply migrations
pnpm run prisma:studio    # Open Prisma Studio GUI

# Production (PM2)
pm2 start ecosystem.config.js   # Start bot
pm2 logs gold-channel-bot       # View logs
pm2 monit                       # Monitor resources
pm2 restart gold-channel-bot    # Restart after code changes
```

## Architecture

### Core Flow: Album Creation → Preview → Publish

1. **Admin sends photo(s)** → Stored in session (`handlers/album.ts`)
2. **Bot prompts for weight & caption** → Multi-step flow using session state
3. **Preview shown in private chat** → With "Price Now", "Finalize", "Cancel" buttons
4. **Finalize publishes to channel** → Single photo with caption + 👍, "Price Now" button attached

### Session Management (In-Memory)

- **Location**: `middleware/session.ts`
- **Storage**: In-memory Map (userId → SessionData)
- **State Tracking**:
  - `awaitingWeight`, `awaitingCaption` - Multi-step input flags
  - `albumPhoto`, `albumWeight`, `albumCaption` - Draft data
  - `draftId` - Unique ID for preview validation
  - `previewMessageId`, `controlMessageId` - For cleanup
- **Warning**: Sessions lost on restart; consider Redis for production scaling

### Price Calculation System

**Service**: `services/PriceCalculator.ts`

**Dynamic Configuration-Based Pricing**:
- Pricing is **per-channel** and stored in `ChannelConfig` table
- Formula: `(gold_price × weight) × (1 + tax + laborFee + sellingProfit)` (additive percentages)
- **Default Customer**: Tax 0%, Labor Fee 19%, Selling Profit 7% = 26% markup
- **Default Collaborator**: Tax 0%, Labor Fee 9%, Selling Profit 0% = 9% markup
- All calculation methods are async and require `channelId` parameter

**Configuration Service** (`services/ChannelConfigService.ts`):
- `getOrCreateConfig(channelId)` - Auto-creates config with defaults if missing
- `updateCustomerTax/LaborFee/SellingProfit()` - Update customer pricing
- `updateCollabTax/LaborFee/SellingProfit()` - Update collaborator pricing
- `getPricingConfig(channelId)` - Returns formatted breakdown for display
- **Important**: Uses `Math.round()` to avoid floating-point precision errors

**Price Fetching** (`services/GoldPriceService.ts`):
- Scrapes 18-carat gold price from `tgju.org/profile/geram18/category`
- Uses cheerio for HTML parsing with specific CSS selector
- TTL caching in database (default 60s, configurable via `PRICE_CACHE_TTL`)
- Graceful fallback to last known price on API failure

**Price Display Format**:
- Shows breakdown: date/time, weight, gold price, tax %, labor fee %, selling profit %
- **Customers**: Single final price
- **Collaborators**: Dual display - their special price + customer price for reference
- Uses emojis: 😍 (tax), ⚒️ (labor fee), 💰 (selling profit)

### Authentication & Authorization

**Middleware**: `middleware/auth.ts`

- `authMiddleware` - Attaches `ctx.isAdmin` and `ctx.isCollaborator` flags
- `requireAdmin` - Guards admin-only commands (e.g., `/hamkar`, `/addadmin`)
- Admin/collaborator status checked via Prisma queries against `Admin` and `Collaborator` tables

### Deep Link Registration

**Pattern**: `https://t.me/<bot>?start=<type>-<token>`

- **Collaborator**: `collab-<uuid>` → Registers user as collaborator
- **Admin**: `admin-<uuid>` → Registers user as admin (one-time use)
- **Handler**: `handlers/start.ts` parses payload and validates via `TokenService`
- **Token Expiry**: Configurable via `INVITE_TOKEN_EXPIRY` (default 7 days)

### Daily Analytics Cron Job

**Service**: `services/AnalyticsService.ts`

- **Schedule**: Daily at 00:00 Europe/Zurich (`node-cron`)
- **Query**: Top 10 most-viewed gold sets from `PriceCheck` table (last 24h)
- **Delivery**: Private message to all admins with Jalaali date/time
- **Initialized in**: `bot.ts` on startup

### Database Schema (Prisma)

**Key Models**:
- `Admin` - Admin users linked to channels
- `Collaborator` - Users with special pricing
- `InviteToken` - One-time registration tokens
- `GoldSet` - Published posts (channelMessageId, weight, caption, channelId)
- `PriceCheck` - Analytics log (userId, goldSetId, timestamp)
- `PriceCache` - Spot price cache with TTL
- `ChannelConfig` - Per-channel pricing configuration:
  - `customerTax`, `customerLaborFee`, `customerSellingProfit` (customer pricing)
  - `collabTax`, `collabLaborFee`, `collabSellingProfit` (collaborator pricing)
  - `discountPercentage`, `cacheTtl` (legacy fields)

**File**: `prisma/schema.prisma`

### Handler Organization

All handlers in `src/handlers/`:

- `start.ts` - `/start` command + deep link parsing
- `setchannel.ts` - `/setchannel` command + forwarded message handling
- `hamkar.ts` - `/hamkar` (collaborator invite generation)
- `addadmin.ts` - `/addadmin` (admin invite generation)
- `album.ts` - Photo upload + weight/caption input flow
- `callbacks.ts` - Inline button clicks (Price Now, Finalize, Cancel)
- `pmhamkar.ts` - `/pmhamkar` (broadcast to collaborators)
- `amar.ts` - `/amar` (manual analytics trigger)
- `settax.ts` - `/settax <customer|collab> <percentage>` (set tax percentage)
- `setfee.ts` - `/setfee <customer|collab> <percentage>` (set labor fee percentage)
- `setprofit.ts` - `/setprofit <customer|collab> <percentage>` (set selling profit percentage)
- `viewpricing.ts` - `/viewpricing` (display current pricing config)
- `help.ts` - `/help` command

### Message Localization

**File**: `src/utils/messages.ts`

All bot messages are in Persian (Farsi). Use this file for:
- Button labels
- Command responses
- Error messages
- Price popup templates

### Configuration

**File**: `src/config/config.ts`

Environment variables loaded via dotenv:
- `BOT_TOKEN` (required)
- `DATABASE_URL` (default: `file:./dev.db`)
- `PRICE_CACHE_TTL` (default: 60s)
- `TIMEZONE` (default: `Europe/Zurich`)
- `INVITE_TOKEN_EXPIRY` (default: 7 days)

## Implementation Patterns

### Command Handler Pattern

All admin commands follow this structure:
1. **Type annotation**: Return `Promise<void>` to satisfy TypeScript
2. **Admin validation**: Use `AdminService.getAdmin(BigInt(ctx.from!.id))` to get admin's channel
3. **Early returns**: Always `await ctx.reply()` before `return` statements
4. **Error handling**: Wrap in try-catch with generic error message

Example:
```typescript
export async function handleCommand(ctx: Context): Promise<void> {
  try {
    const admin = await AdminService.getAdmin(BigInt(ctx.from!.id));
    if (!admin) {
      await ctx.reply(Messages.errorNotAdmin);
      return;
    }
    // Command logic...
  } catch (error) {
    console.error('Error in handleCommand:', error);
    await ctx.reply(Messages.errorGeneric);
  }
}
```

### Floating-Point Precision

When converting between percentages and decimals:
- **Storage**: Always store as decimals (0.07 for 7%)
- **Display**: Use `Math.round(value * 100)` to avoid `7.000000000000001`
- **Never**: Use `value * 100 * 100 / 100` - causes precision errors

### Price Calculation with Config

Always fetch channel config before calculating prices:
```typescript
const pricingConfig = await ChannelConfigService.getPricingConfig(channelId);
const price = await PriceCalculator.calculateNormalPrice(weight, spotPrice, channelId);
```

This ensures dynamic pricing based on admin-configured settings.

## Important Constraints

### Telegram API Limitations

1. **Single photo albums**: Current implementation handles ONE photo per gold set (simplified from spec)
2. **Inline keyboard attachment**: Cannot attach directly to `sendPhoto`; must edit message after sending
3. **Callback data limit**: 64 bytes max; use prefixes like `price:`, `finalize:`, `cancel:`

### Security Notes

- Admin actions guarded by `requireAdmin` middleware
- Token validation ensures one-time use for admin invites
- Database queries use BigInt for Telegram user IDs (SQLite compatibility)

### Known TODOs

From `telegram-goldbot-spec-highlevel.md`:
- Multi-photo album support (currently single photo only)

## Testing the Bot

1. Start bot: `pnpm run dev`
2. Get bot username from console output
3. Test flows:
   - Admin setup: `/setchannel` → forward channel message
   - Album creation: Send photo → enter weight → enter caption → preview → finalize
   - Price check: Click "Price Now" in channel
   - Collaborator invite: `/hamkar` → share link → other user clicks Start
   - Admin invite: `/addadmin` → share link → new admin clicks Start

## Common Tasks

### Adding a New Command

1. Create handler in `src/handlers/<name>.ts`
2. Import in `src/bot.ts`
3. Register: `bot.command('name', requireAdmin, handleName)`
4. Add messages to `src/utils/messages.ts`

### Modifying Pricing Configuration

**Via Admin Commands** (recommended):
- `/settax <customer|collab> <percentage>` - Set tax percentage
- `/setfee <customer|collab> <percentage>` - Set labor fee percentage
- `/setprofit <customer|collab> <percentage>` - Set selling profit percentage
- `/viewpricing` - View current configuration

**Via Code** (if changing defaults):
Edit `prisma/schema.prisma` ChannelConfig model defaults, then:
1. `pnpm run prisma:generate`
2. `pnpm exec prisma migrate dev --name <migration_name>`

**Calculation Logic**:
- Located in `src/services/PriceCalculator.ts`
- `calculateNormalPrice(weight, spotPrice, channelId)` - Customer pricing
- `calculateCollaboratorPrice(weight, spotPrice, channelId)` - Collaborator pricing
- `calculateBothPrices(weight, spotPrice, channelId)` - Returns both for comparison

### Changing Price Data Source

Edit `src/services/GoldPriceService.ts`:
- `fetchSpotPrice()` - Replace scraping logic or switch to API

### Database Schema Changes

1. Edit `prisma/schema.prisma`
2. Run `pnpm run prisma:generate`
3. Create migration: `pnpm exec prisma migrate dev --name <descriptive_name>`
4. Update affected services/handlers

**Note**: Use `pnpm exec` to avoid interactive prompts during migration creation.

## Deployment Notes

- **PM2 Config**: `ecosystem.config.js` (max 500MB memory, auto-restart)
- **Logs**: Written to `./logs/out.log` and `./logs/err.log`
- **Graceful Shutdown**: SIGINT/SIGTERM handlers in `bot.ts`
- **Session Persistence**: Sessions are in-memory; cleared on restart

## Debugging Tips

- Check session state: Add `console.log(ctx.session)` in handlers
- Verify admin status: Check `ctx.isAdmin` flag in middleware
- Price cache inspection: Use `pnpm run prisma:studio` → PriceCache table
- Analytics data: Query `PriceCheck` table for user interaction logs
