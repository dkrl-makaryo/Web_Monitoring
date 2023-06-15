const http = require('http');
const { url } = require('inspector');
const TelegramBot = require('node-telegram-bot-api');
const player = require('play-sound')(opts = {});
require('dotenv').config();

const websites = [
  {
    name: process.env.NAME_WEB1,
    url: process.env.LINK_WEB1
  },
  {
    name: process.env.NAME_WEB2,
    url: process.env.LINK_WEB2
  }
];
const checkInterval = process.env.PING_INTERVAL;
const rtoThreshold = 1; // Jumlah maksimum RTO 
const notificationSoundPath = process.env.SOUND_PATH;
const telegramToken = process.env.TELE_TOKEN;
const telegramChatId = process.env.TELE_CHAT_ID;

let counter = 0;
let consecutiveRTOCount = {};

// Inisialisasi variabel consecutiveRTOCount untuk setiap URL
websites.forEach((website) => {
  consecutiveRTOCount[website.name] = 0;
});

// Inisialisasi Telegram Bot
const bot = new TelegramBot(telegramToken, { polling: false });

// Fungsi untuk memeriksa status URL
function checkWebsiteStatus(website) {
  http.get(website.url, (res) => {
    if (res.statusCode === 200) {
      consecutiveRTOCount[website.name] = 0;
      console.log(new Date().toLocaleString(),`==>> Okee.. Joss.. = ${website.name}`);
    } else {
      consecutiveRTOCount[website.name]++;
      console.log(new Date().toLocaleString(),`${website.name} => Cek...!!!! Cek...!!!!`);
      if (consecutiveRTOCount[website.name] >= rtoThreshold) {
        playNotificationSound();
        sendTelegramNotification(website);
      }
    }
  }).on('error', (err) => {
    consecutiveRTOCount[website.name]++;
    console.log(new Date().toLocaleString(), `${website.name} => Cek...!!!! Cek...!!!!`);
    if (consecutiveRTOCount[website.name] >= rtoThreshold) {
      playNotificationSound();
      sendTelegramNotification(website);
    }
  });
}

// untuk play notifikasi suara
function playNotificationSound() {
  player.play(notificationSoundPath, (err) => {
    if (err) {
      console.log('Error playing sound:', err);
    }
  });
}

// untuk kirim notifikasi ke Telegram
function sendTelegramNotification(website) {
  const message = `⚠️⚠️⚠️ ==${website.name}== ${website.url} ==>> [${counter++}] ${process.env.PESAN_TELE}`;
  bot.sendMessage(telegramChatId, message)
    .then(() => console.log('Pesan ke Telegram Terkirim...'))
    .catch((error) => console.log('Gagal Mengirim Pesan ke Telegram:', error));
}

// mulai pemantauan untuk setiap website
websites.forEach((website) => {
  setInterval(() => checkWebsiteStatus(website), checkInterval);
});
