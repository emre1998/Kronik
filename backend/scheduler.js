const cron = require('node-cron');
const axios = require('axios');
const { pool } = require('./db');
const { sendTelegram, buildMessage } = require('./telegram');

const activeTasks = new Map();

const executeJob = async (job) => {
  const start = Date.now();
  let status = 'success';
  let statusCode = null;
  let response = null;

  try {
    const config = {
      method: job.method,
      url: job.url,
      headers: job.headers || {},
      timeout: 30000,
    };
    if (job.body && ['POST', 'PUT', 'PATCH'].includes(job.method)) {
      config.data = job.body;
    }
    const res = await axios(config);
    statusCode = res.status;
    response = JSON.stringify(res.data).substring(0, 1000);
  } catch (err) {
    status = 'error';
    statusCode = err.response?.status || null;
    response = err.message.substring(0, 1000);
  }

  const duration = Date.now() - start;

  // Log to DB
  await pool.query(
    `INSERT INTO execution_logs (job_id, status, status_code, response, duration_ms) VALUES ($1, $2, $3, $4, $5)`,
    [job.id, status, statusCode, response, duration]
  );

  // Telegram bildirimi
  const notify = job.notify_on || 'always';
  const shouldNotify = notify === 'always' || (notify === 'error' && status === 'error');
  if (shouldNotify) {
    await sendTelegram(buildMessage(job, status, statusCode, duration, response));
  }

  console.log(`[${new Date().toISOString()}] Job #${job.id} "${job.name}" → ${status} (${statusCode}) ${duration}ms`);
};

const scheduleJob = (job) => {
  if (!cron.validate(job.cron_expression)) {
    console.error(`Invalid cron expression for job #${job.id}: ${job.cron_expression}`);
    return;
  }
  const task = cron.schedule(job.cron_expression, () => executeJob(job));
  activeTasks.set(job.id, task);
  console.log(`Scheduled job #${job.id} "${job.name}" → "${job.cron_expression}"`);
};

const unscheduleJob = (jobId) => {
  const task = activeTasks.get(jobId);
  if (task) {
    task.destroy();
    activeTasks.delete(jobId);
  }
};

const loadAllJobs = async () => {
  const { rows } = await pool.query('SELECT * FROM cron_jobs WHERE is_active = true');
  rows.forEach(scheduleJob);
  console.log(`Loaded ${rows.length} active jobs`);
};

module.exports = { scheduleJob, unscheduleJob, loadAllJobs, executeJob };
