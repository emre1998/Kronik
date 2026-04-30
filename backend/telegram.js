const axios = require('axios');

const sendTelegram = async (message) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });
  } catch (err) {
    console.error('Telegram notification error:', err.message);
  }
};

const buildMessage = (job, status, statusCode, duration, response) => {
  const icon = status === 'success' ? '✅' : '❌';
  const time = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

  return `${icon} <b>Kronik — ${status === 'success' ? 'Başarılı' : 'Hata'}</b>

📌 <b>Job:</b> ${job.name}
🌐 <b>URL:</b> <code>${job.url}</code>
📡 <b>Method:</b> ${job.method}
📊 <b>Durum Kodu:</b> ${statusCode || 'N/A'}
⏱ <b>Süre:</b> ${duration}ms
🕐 <b>Zaman:</b> ${time}
${response ? `\n💬 <b>Yanıt:</b>\n<code>${response.substring(0, 200)}</code>` : ''}`;
};

module.exports = { sendTelegram, buildMessage };
