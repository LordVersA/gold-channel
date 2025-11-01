# Quick Start Guide

## Getting Your Bot Running in 5 Minutes

### Step 1: Get a Bot Token

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token (it looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Configure the Bot

1. Open the `.env` file in the project root
2. Replace `your_bot_token_here` with your actual bot token:
   ```
   BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### Step 3: Run the Bot

For development (with auto-reload):
```bash
pnpm run dev
```

For production:
```bash
pnpm run build
pnpm start
```

Or with PM2:
```bash
pm2 start ecosystem.config.js
```

### Step 4: Set Up Your Channel

1. Start a private chat with your bot on Telegram
2. Send `/start` command
3. Use `/setchannel` command
4. Add the bot as an admin to your target channel
5. Forward any message from the channel to the bot

You're now registered as an admin!

### Step 5: Create Your First Gold Set

1. Send 1-10 photos to the bot (as an album or individually)
2. When prompted, send the weight in grams (e.g., `50`)
3. Review the preview with the "Price Now" button
4. Click "Finalize" to publish to your channel

### Step 6: Generate Collaborator Links

1. Use `/hamkar` command to generate a collaborator invite link
2. Share the link with your collaborators
3. They click the link and press "Start" to register

### Next Steps

- **Update Price Formulas**: Edit `src/services/PriceCalculator.ts` with your actual pricing logic
- **Integrate Gold Price API**: Update `src/services/GoldPriceService.ts` when you're ready
- **Monitor Analytics**: Check your private messages daily for analytics reports

## Troubleshooting

### Bot doesn't respond
- Check that the `BOT_TOKEN` in `.env` is correct
- Make sure the bot is running (check logs)

### Can't set channel
- Ensure the bot is added as admin in the channel
- Verify the bot has permission to post messages

### Price calculations are wrong
- Update the formulas in `src/services/PriceCalculator.ts`
- Current formulas are placeholders (gram × 20 and gram × 25)

## Useful Commands

```bash
# Development
pnpm run dev          # Run with auto-reload

# Production
pnpm run build        # Compile TypeScript
pnpm start            # Run compiled code

# Database
npx prisma studio     # Open database viewer
npx prisma migrate    # Run migrations

# PM2 (Production)
pm2 start ecosystem.config.js  # Start bot
pm2 logs gold-channel-bot      # View logs
pm2 restart gold-channel-bot   # Restart bot
pm2 stop gold-channel-bot      # Stop bot
```

## Support

Check `README.md` for detailed documentation.
