
const axios = require('axios');

const apiClient = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    Referer: 'https://ticketgenie.in/',
    Origin: 'https://ticketgenie.in'
  }
});


const TELEGRAM_BOT_TOKEN = "8606504447:AAHmj3Puj6lzzSiymQzOjblqz4WTbQfZux4"; // Revoke this via @BotFather after the drop!
const TELEGRAM_CHAT_IDS = ["682166234","7270546477","622885791","6125693399"];
const API_URLS = [
  "https://rcbscaleapi.ticketgenie.in/ticket/eventlist/O",
  "https://rcbscaleapi.ticketgenie.in/ticket/eventlist/U",
  "https://rcbscaleapi.ticketgenie.in/ticket/eventlist/P",

];


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
    const responses = await Promise.all(API_URLS.map(url => apiClient.get(url)));
    const allEvents = responses.flatMap((res, i) => {
      console.log(`API Response [${API_URLS[i]}]:`, res.data);
      return res.data?.result || [];
    });
    const hasBuyTickets = allEvents.some(e => e.event_Button_Text === 'BUY TICKETS');
    if (!notificationTriggered && hasBuyTickets) {
      console.log('Tickets available! Stopping interval and sending Telegram notifications.');
      notificationTriggered = true;
      if (intervalId) clearInterval(intervalId);
      const msg = `🚨 RCB TICKETS AVAILABLE! 🚨`;
      await sendMultipleNotifications(msg);
      return;
    }
    console.log('No tickets yet. Button texts:', allEvents.map(e => e.event_Button_Text).join(', '));
  } catch (error) {
    console.error('Error fetching API:', error.message);
  }
}

// Fetch every 5 seconds
intervalId = setInterval(fetchAndLog, 5000);

// Initial fetch
fetchAndLog();
