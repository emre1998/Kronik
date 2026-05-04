const express = require('express');
const axios = require('axios');
const router = express.Router();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `Sen "Kronik" adlı bir cron job yönetim sisteminin AI asistanısın. Türkçe konuşuyorsun. Amacın kullanıcının bir HTTP cron job oluşturmasına yardımcı olmak.

Görevin: Kullanıcıdan aşağıdaki bilgileri samimi ve kısa sorularla topla:
1. name: Job'un adı (anlamlı, kısa)
2. url: Çağrılacak HTTP URL
3. method: HTTP metodu (GET, POST, PUT, PATCH, DELETE)
4. cron_expression: Cron ifadesi
5. headers: HTTP başlıkları (opsiyonel - örn: Authorization token)
6. body: İstek gövdesi (opsiyonel - POST/PUT/PATCH için)

CRON İFADESİ YARDIMI:
Kullanıcı saatini/periyodunu Türkçe söylüyorsa sen çevir:
- Her dakika → * * * * *
- Her saat başı → 0 * * * *
- Her gün sabah 9 → 0 9 * * *
- Her gün gece yarısı → 0 0 * * *
- Her pazartesi sabah 9 → 0 9 * * 1
- Her ayın 1'i sabah 8 → 0 8 1 * *
- Her 5 dakikada bir → */5 * * * *
- Her 30 dakikada bir → */30 * * * *

DAVRANIŞLAR:
- Kısa ve net konuş, gereksiz uzatma
- Tüm zorunlu alanlar (name, url, method, cron_expression) toplandığında iş oluşturmaya hazır olduğunu söyle ve MUTLAKA aşağıdaki marker'ı ver
- Headers ve body hakkında kısaca sor, kullanıcı "hayır" veya boş bırakırsa geç
- URL geçersiz görünüyorsa uyar

TAMAMLANDIĞINDA tam olarak şu formatta yaz (başka şey ekleme marker'a):
KRONIK_JOB_READY:{"name":"...","url":"...","method":"...","cron_expression":"...","headers":{},"body":null}

Marker'dan önce kullanıcıya kısa bir özet yaz. Örnek:
"Harika! İşte oluşturacağım job:\n📌 Ad: ...\n🌐 URL: ...\n📡 Method: ...\n⏰ Schedule: her gün sabah 9\n\nOnaylıyor musun?"

Sonra KRONIK_JOB_READY marker'ı yaz.`;

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

    // Check if job data is ready
    const jobReadyMatch = content.match(/KRONIK_JOB_READY:(\{[\s\S]*?\})/);
    if (jobReadyMatch) {
      try {
        const jobData = JSON.parse(jobReadyMatch[1]);
        const textBefore = content.replace(/KRONIK_JOB_READY:\{[\s\S]*?\}/, '').trim();
        return res.json({ content: textBefore, jobReady: true, jobData });
      } catch (parseErr) {
        console.error('Job data parse error:', parseErr.message);
      }
    }

    res.json({ content, jobReady: false });
  } catch (err) {
    console.error('Groq API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI servisi şu an yanıt vermiyor. Lütfen tekrar dene.' });
  }
});

module.exports = router;
