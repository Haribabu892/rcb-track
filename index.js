
const axios = require('axios');
const cron = require('node-cron');

const TELEGRAM_BOT_TOKEN = "8606504447:AAHmj3Puj6lzzSiymQzOjblqz4WTbQfZux4"; // Revoke this via @BotFather after the drop!
const TELEGRAM_CHAT_IDS = ["682166234", "6125693399"];
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


async function checkTickets() {
  try {
    const res = await axios.get(API_URL, { timeout: 20000 });
    const data = res.data;
    let shouldAlert = false;
    let reason = [];

    // Check for message
    if (data.message && data.message.trim() !== "") {
      shouldAlert = true;
      reason.push("message present");
    }

    // Check for result array/object
    if (Array.isArray(data.result)) {
      if (data.result.length > 0) {
        shouldAlert = true;
        reason.push("result array has elements");
      }
    } else if (typeof data.result === 'object' && data.result !== null) {
      shouldAlert = true;
      reason.push("result is object");
    }

    // Check for change in result type or value
    const currentState = JSON.stringify(data);
    const defaultState = JSON.stringify({ status: 'Success', message: '', result: [] });
    if (lastState !== null && lastState !== currentState) {
      shouldAlert = true;
      reason.push("payload changed");
    }
    // Trigger if payload changes from the default empty state
    if (lastState === null && currentState !== defaultState) {
      shouldAlert = true;
      reason.push("payload not default");
    }
    if (shouldAlert && lastState !== currentState) {
      await sendTelegramAlert(`🚨 RCB TICKETS UPDATE! 🚨\nReason: ${reason.join(", ")}\n\nAPI: ${API_URL}\n\nCurrent: ${JSON.stringify(data)}`);
    }
    lastState = currentState;
    console.log(`[${new Date().toLocaleString()}] Checked. Reason: ${reason.join(", ") || "no change"}`);
  } catch (err) {
    console.error('Error fetching/parsing API:', err.message);
  }
}

// Run every minute
cron.schedule('* * * * *', checkTickets);
console.log('RCB Ticket Cron started. Polling every minute.');
