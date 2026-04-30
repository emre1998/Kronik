require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const { loadAllJobs } = require('./scheduler');
const jobsRouter = require('./routes/jobs');
const logsRouter = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://kronik-weld.vercel.app',
    /\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());

app.use('/api/jobs', jobsRouter);
app.use('/api/logs', logsRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const start = async () => {
  await initDb();
  await loadAllJobs();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
