# RCB Ticket Cron

This Node.js app checks the RCB ticket page every minute and sends a Telegram alert if any of the specified keywords are found.

## How it works
- Scrapes https://shop.royalchallengers.com/ticket every minute
- Looks for keywords: buy tickets, chennai, super, kings, chennai super kings, royal, challengers, bengaluru, royal challengers bengaluru
- Sends a Telegram message to the configured chat IDs if any keyword is found

## Setup
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the cron job:
   ```sh
   npm start
   ```

## Deploying to Render
- Create a new Web Service on Render
- Use `npm start` as the start command
- Set the environment to Node.js
- Make sure to keep the service always on (Render will keep the process alive)

## Security
- **Revoke the Telegram bot token after use!**
- Do not share your bot token publicly.
