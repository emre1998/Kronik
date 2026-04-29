const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cron_jobs (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      method VARCHAR(10) DEFAULT 'GET',
      headers JSONB DEFAULT '{}',
      body TEXT,
      cron_expression VARCHAR(100) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS execution_logs (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES cron_jobs(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL,
      status_code INTEGER,
      response TEXT,
      duration_ms INTEGER,
      executed_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Database tables ready');
};

module.exports = { pool, initDb };
