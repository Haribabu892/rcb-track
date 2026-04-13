
const axios = require('axios');

const apiClient = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
'Origin': 'https://shop.royalchallengers.com',
    'Referer': 'https://shop.royalchallengers.com/',
    'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
  }
});


const TELEGRAM_BOT_TOKEN = "8606504447:AAHmj3Puj6lzzSiymQzOjblqz4WTbQfZux4"; // Revoke this via @BotFather after the drop!
const TELEGRAM_CHAT_IDS = ["682166234","7270546477","622885791","6125693399"];
const API_URL = "https://rcbscaleapi.ticketgenie.in/ticket/eventlist/O";


async function sendTelegramAlert(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  for (const chatId of TELEGRAM_CHAT_IDS) {
    try {
      await axios.post(url, {
        chat_id: chatId,
        text: message,
      });
      console.log(`[Telegram] Alert sent to ${chatId}!`);
    } catch (err) {
      console.error(`[Telegram] Error for ${chatId}:`, err.message);
    }
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
    const response = await apiClient.get(API_URL);
    const events = response.data?.result || [];
    console.log('API Response:', response.data);
    const hasBuyTickets = events.some(e => e.event_Button_Text === 'BUY TICKETS' && e.event_Code !== 3);
    if (!notificationTriggered && hasBuyTickets) {
      console.log('Tickets available! Stopping interval and sending Telegram notifications.');
      notificationTriggered = true;
      if (intervalId) clearInterval(intervalId);
      const msg = `🚨 RCB TICKETS AVAILABLE! 🚨`;
      await sendMultipleNotifications(msg);
      return;
    }
    console.log('No tickets yet. Button text:', events.map(e => e.event_Button_Text).join(', '));
  } catch (error) {
    console.error('Error fetching API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response body:', error.response.data);
    }
  }
}

// Fetch every 5 seconds
intervalId = setInterval(fetchAndLog, 5000);

// Initial fetch
fetchAndLog();
