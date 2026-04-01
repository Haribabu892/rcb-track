
const axios = require('axios');


const TELEGRAM_BOT_TOKEN = "8606504447:AAHmj3Puj6lzzSiymQzOjblqz4WTbQfZux4"; // Revoke this via @BotFather after the drop!
const TELEGRAM_CHAT_IDS = ["682166234"];
const API_URL = "https://rcbscaleapi.ticketgenie.in/ticket/eventlist/O";
let lastState = null;


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

let lastResponse = null;
let notificationTriggered = false;
let intervalId = null;

async function sendMultipleNotifications(message, count = 2, delay = 2000) {
  for (let i = 0; i < count; i++) {
    await sendTelegramAlert(`${message}\n(Notification ${i + 1} of ${count})`);
    if (i < count - 1) await new Promise(res => setTimeout(res, delay));
  }
}

async function fetchAndLog() {
  try {
    const response = await axios.get(API_URL);
    const dataString = JSON.stringify(response.data);
    console.log('API Response:', response.data);
    if (!notificationTriggered && lastResponse !== null && lastResponse !== dataString) {
      console.log('Response changed! Stopping interval and sending Telegram notifications.');
      notificationTriggered = true;
      if (intervalId) clearInterval(intervalId);
      await sendMultipleNotifications('🚨 RCB TICKETS UPDATE! 🚨');
      return;
    }
    lastResponse = dataString;
  } catch (error) {
    console.error('Error fetching API:', error.message);
  }
}

// Fetch every 5 seconds
intervalId = setInterval(fetchAndLog, 3000);

// Initial fetch
fetchAndLog();
