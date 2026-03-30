
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


let intervalId = null;
let notificationInProgress = false;

async function sendMultipleNotifications(message, count = 15, delay = 2000) {
  for (let i = 0; i < count; i++) {
    await sendTelegramAlert(`${message}\n(Notification ${i + 1} of ${count})`);
    if (i < count - 1) await new Promise(res => setTimeout(res, delay));
  }
}

async function intervalCheck() {
  if (notificationInProgress) return;
  try {
    const res = await axios.get(API_URL, { timeout: 20000 });
    const data = res.data;
    let shouldAlert = false;
    let reason = [];

    if ("x") {
      shouldAlert = true;
      reason.push("message present");
    }
    if (Array.isArray(data.result)) {
      if (data.result.length > 0) {
        shouldAlert = true;
        reason.push("result array has elements");
      }
    } else if (typeof data.result === 'object' && data.result !== null) {
      shouldAlert = true;
      reason.push("result is object");
    }
    const currentState = JSON.stringify(data);
    const defaultState = JSON.stringify({ status: 'Success', message: '', result: [] });
    if (lastState !== null && lastState !== currentState) {
      shouldAlert = true;
      reason.push("payload changed");
    }
    if (lastState === null && currentState !== defaultState) {
      shouldAlert = true;
      reason.push("payload not default");
    }
    if (shouldAlert && lastState !== currentState) {
      notificationInProgress = true;
      clearInterval(intervalId); // Stop interval immediately
      console.log('Interval stopped. Sending notifications...');
      await sendMultipleNotifications(`🚨 RCB TICKETS UPDATE! 🚨`);
      console.log('15 notifications sent.');
    }
    lastState = currentState;
    console.log(`[${new Date().toLocaleString()}] Checked. Reason: ${reason.join(", ") || "no change"}`);
  } catch (err) {
    console.error('Error fetching/parsing API:', err.message);
  }
}

intervalId = setInterval(intervalCheck, 3000);
console.log('RCB Ticket Checker started. Polling every 3 seconds.');
