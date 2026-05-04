const express = require('express');
const axios = require('axios');
const router = express.Router();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `Sen "Kronik" adlı bir cron job yönetim sisteminin AI asistanısın. Türkçe konuşuyorsun. Amacın kullanıcının bir HTTP cron job oluşturmasına yardımcı olmak.

Görevin: Kullanıcıdan sırayla şu bilgileri kısa sorularla topla:
1. name: Job'un adı (anlamlı, kısa)
2. url: Çağrılacak HTTP URL
3. method: HTTP metodu (GET, POST, PUT, PATCH, DELETE) — URL'e göre tahmin edebilirsin
4. cron_expression: Ne sıklıkla çalışsın?
5. notify_on: Telegram bildirimi — "Her zaman mı, sadece hata olunca mı, yoksa hiç istemiyor musun?" diye sor. Cevaba göre: her zaman → "always", sadece hata → "error", hiç → "never"
6. headers: HTTP başlıkları gerekiyor mu? (opsiyonel, kullanıcı hayır derse geç)
7. body: POST/PUT/PATCH için gövde gerekiyor mu? (opsiyonel)

CRON İFADESİ YARDIMI (kullanıcının Türkçe ifadesini cron'a çevir):
- Her dakika → * * * * *
- Her saat başı → 0 * * * *
- Her gün sabah 9 → 0 9 * * *
- Her gün gece yarısı → 0 0 * * *
- Her pazartesi sabah 9 → 0 9 * * 1
- Her ayın 1'i sabah 8 → 0 8 1 * *
- Her 5 dakikada bir → */5 * * * *
- Her 30 dakikada bir → */30 * * * *
- Her 2 saatte bir → 0 */2 * * *

DAVRANIŞLAR:
- Kısa ve net konuş, gereksiz uzatma
- Bir seferde tek soru sor
- Tüm alanlar tamamlandığında özet yaz ve KRONIK_JOB_READY marker'ını ver

TAMAMLANDIĞINDA şu formatta yaz (JSON tek satırda, tüm alanlar dolu):
KRONIK_JOB_READY:{"name":"...","url":"...","method":"...","cron_expression":"...","notify_on":"always","headers":{},"body":null}

Marker'dan önce kısa özet yaz:
"Harika! İşte oluşturacağım job:
📌 Ad: ...
🌐 URL: ...
📡 Method: ...
⏰ Schedule: ...
🔔 Bildirim: ...

Onaylamak için aşağıdaki butona tıkla 👇"

SONRA hemen KRONIK_JOB_READY:{...} yaz. Başka hiçbir şey ekleme marker'dan sonra.`;

router.post('/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages dizisi gerekli' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY tanımlı değil' });
  }

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.4,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0].message.content;

    // Robust JSON extraction using bracket counting
    const markerStr = 'KRONIK_JOB_READY:';
    const markerIdx = content.indexOf(markerStr);

    if (markerIdx !== -1) {
      const jsonStart = markerIdx + markerStr.length;
      let depth = 0, jsonEnd = -1;
      for (let i = jsonStart; i < content.length; i++) {
        if (content[i] === '{') depth++;
        else if (content[i] === '}') {
          depth--;
          if (depth === 0) { jsonEnd = i; break; }
        }
      }

      if (jsonEnd !== -1) {
        try {
          const jobData = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
          const textBefore = content.slice(0, markerIdx).trim();
          return res.json({ content: textBefore, jobReady: true, jobData });
        } catch (parseErr) {
          console.error('Job data parse error:', parseErr.message, content.slice(jsonStart, jsonEnd + 1));
        }
      }
    }

    res.json({ content, jobReady: false });
  } catch (err) {
    console.error('Groq API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI servisi şu an yanıt vermiyor. Lütfen tekrar dene.' });
  }
});

module.exports = router;
