
const axios = require('axios');

const apiClient = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Content-Type': 'application/json',
    'Origin': 'https://shop.royalchallengers.com',
    'Referer': 'https://shop.royalchallengers.com/',
    'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'priority': 'u=1, i',
    // Authorization header intentionally omitted
  }
});


const TELEGRAM_BOT_TOKEN = "8606504447:AAHmj3Puj6lzzSiymQzOjblqz4WTbQfZux4"; // Revoke this via @BotFather after the drop!
const TELEGRAM_CHAT_IDS = ["682166234","7270546477","622885791","6125693399"];
const API_URL = "https://rcbscaleapi.ticketgenie.in/ticket/eventlist/O";


async function sendTelegramAlert(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await Promise.all(
    TELEGRAM_CHAT_IDS.map(async (chatId) => {
      try {
        await axios.post(url, {
          chat_id: chatId,
          text: message,
        });
        console.log(`[Telegram] Alert sent to ${chatId}!`);
      } catch (err) {
        console.error(`[Telegram] Error for ${chatId}:`, err.message);
      }
    })
  );
}

// Send alert to two specific chat IDs (for error/exception cases)
const ERROR_CHAT_IDS = ["682166234", "7270546477"];
async function sendTelegramAlertError(message, count = 10, delay = 2000) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  for (let i = 0; i < count; i++) {
    await Promise.all(
      ERROR_CHAT_IDS.map(async (chatId) => {
        try {
          await axios.post(url, {
            chat_id: chatId,
            text: `${message}\n(Error Notification ${i + 1} of ${count})`,
          });
          console.log(`[Telegram] Error alert sent to ${chatId}!`);
        } catch (err) {
          console.error(`[Telegram] Error for ${chatId}:`, err.message);
        }
      })
    );
    if (i < count - 1) await new Promise(res => setTimeout(res, delay));
  }
}

let notificationTriggered = false;
let intervalId = null;

async function sendMultipleNotifications(message, count = 10, delay = 2000) {
  for (let i = 0; i < count; i++) {
    await sendTelegramAlert(`${message}\n(Notification ${i + 1} of ${count})`);
    if (i < count - 1) await new Promise(res => setTimeout(res, delay));
  }
}

async function fetchAndLog() {
  try {
    let response;
    try {
      response = await apiClient.get(API_URL);
    } catch (error) {
      // Network or HTTP error (non-200)
      console.error('Error fetching API:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response body:', error.response.data);
        // Send notification to the two specified chat IDs, 10 times
        await sendTelegramAlertError(`RCB Ticket API error!\nStatus: ${error.response.status}\nMessage: ${error.message}`);
      } else {
        // Network or unknown error
        await sendTelegramAlertError(`RCB Ticket API error!\nMessage: ${error.message}`);
      }
      return;
    }

    // Check for non-success status in API response
    if (response.status !== 200 || response.data?.status !== 'Success') {
      await sendTelegramAlertError(`RCB Ticket API returned non-success!\nHTTP Status: ${response.status}\nAPI Status: ${response.data?.status}\nMessage: ${response.data?.message || ''}`);
      return;
    }

    const events = response.data?.result || [];
    console.log('API Response:', response.data);
    const hasBuyTickets = events.some(e => e.event_Button_Text === 'BUY TICKETS');
    if (!notificationTriggered && hasBuyTickets) {
      console.log('Tickets available! Stopping interval and sending Telegram notifications.');
      notificationTriggered = true;
      if (intervalId) clearInterval(intervalId);
      const msg = `🚨 RCB TICKETS AVAILABLE! 🚨`;
      await sendMultipleNotifications(msg);
      return;
    }
    console.log('No tickets yet. Button text:', events.map(e => e.event_Button_Text).join(', '));
  } catch (err) {
    console.error('Unexpected error in fetchAndLog:', err.message);
  }
}

// Fetch every 5 seconds
intervalId = setInterval(fetchAndLog, 5000);

// Initial fetch
fetchAndLog();
