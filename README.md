# Telegram Gold Set Bot

A Telegram bot built with Telegraf and TypeScript for managing gold set albums with live pricing functionality. All bot messages are in Persian (Farsi).

## Features

- 📸 **Album Management**: Create and publish gold set albums (1-10 photos)
- 💰 **Live Pricing**: Real-time gold price calculations with caching
- 👥 **Collaborator System**: Special pricing for registered collaborators
- 🔐 **Admin Management**: Secure admin and collaborator registration via deep links
- 📊 **Daily Analytics**: Automated reports of most-viewed gold sets
- 🌍 **Timezone Support**: All timestamps in Europe/Zurich timezone

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Bot Framework**: Telegraf
- **Database**: SQLite with Prisma ORM
- **Scheduling**: node-cron for daily analytics
- **Process Manager**: PM2 for production deployment

## Project Structure

```
src/
├── bot.ts              # Main bot entry point
├── config/             # Configuration and database setup
├── handlers/           # Command and callback handlers
├── services/           # Business logic (Admin, Collaborator, GoldSet, etc.)
├── models/             # Database models (via Prisma)
├── middleware/         # Authentication and session middleware
├── utils/              # Utility functions and formatters
└── types/              # TypeScript type definitions
```

## Setup

### Prerequisites

- Node.js 16+ and pnpm
- Telegram Bot Token (from @BotFather)
- VPS or server for deployment (optional)

### Installation

1. Clone the repository:
```bash
cd gold-channel
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your BOT_TOKEN
```

4. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Build the project:
```bash
pnpm run build
```

## Development

Run the bot in development mode with auto-reload:
```bash
pnpm run dev
```

## Production Deployment

### Using PM2 on VPS

1. Build the project:
```bash
pnpm run build
```

2. Start with PM2:
```bash
pm2 start ecosystem.config.js
```

3. Save PM2 process list:
```bash
pm2 save
pm2 startup
```

4. Monitor the bot:
```bash
pm2 logs gold-channel-bot
pm2 monit
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram bot token from @BotFather | Required |
| `DATABASE_URL` | SQLite database file path | `file:./dev.db` |
| `GOLD_API_URL` | Gold price API endpoint (future) | - |
| `GOLD_API_KEY` | API key for gold price service | - |
| `PRICE_CACHE_TTL` | Price cache duration in seconds | `120` |
| `DEFAULT_DISCOUNT_PERCENTAGE` | Default collaborator discount | `10` |
| `TIMEZONE` | Timezone for timestamps | `Europe/Zurich` |
| `INVITE_TOKEN_EXPIRY` | Token expiry in days | `7` |
| `NODE_ENV` | Environment mode | `development` |

## Bot Commands

### Admin Commands

- `/start` - Start the bot and handle registration
- `/setchannel` - Configure the target channel
- `/hamkar` - Generate collaborator invite link
- `/addadmin` - Generate admin invite link (one-time use)
- `/help` - Show usage guide

### Usage Flow

1. **Setup Channel**: Use `/setchannel`, add bot as admin, forward a message
2. **Create Album**: Send 1-10 photos with weight and caption
3. **Preview**: Review album with "Price Now", "Finalize", or "Cancel" buttons
4. **Publish**: Click "Finalize" to post to channel with "Price Now" button
5. **Price Checks**: Users click "Price Now" to see current pricing

## Price Calculation

**Current Implementation** (Placeholder):
- Normal Price: `weight * 20`
- Collaborator Price: `weight * 25`

**TODO**: Replace with actual business formulas in `src/services/PriceCalculator.ts`

## Daily Analytics

- Runs at 00:00 Europe/Zurich timezone
- Reports top 10 most-viewed gold sets from previous 24 hours
- Sent to all admins via private message

## Database Schema

- **admins**: Admin users with channel access
- **collaborators**: Users with special pricing
- **invite_tokens**: Registration tokens (collab/admin)
- **gold_sets**: Published gold set posts
- **price_checks**: Analytics log of price button clicks
- **price_cache**: Cached spot gold prices with TTL
- **channel_config**: Per-channel configuration

## Development Notes

- All user-facing messages are in Persian (Farsi) in `src/utils/messages.ts`
- Gold price API integration pending - currently using mock data
- Session storage is in-memory; consider Redis for production scaling
- Prisma migrations in `prisma/migrations/`

## Future Enhancements

- Real gold price API integration
- Multi-currency support
- Advanced analytics dashboard
- Webhook mode (instead of polling)
- Persistent session storage (Redis)

## License

ISC

## Support

For issues or questions, please contact the development team.
