const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { scheduleJob, unscheduleJob, executeJob } = require('../scheduler');
const cron = require('node-cron');

// GET all jobs
router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM cron_jobs ORDER BY created_at DESC');
  res.json(rows);
});

// GET single job
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM cron_jobs WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Job not found' });
  res.json(rows[0]);
});

// POST create job
router.post('/', async (req, res) => {
  const { name, url, method = 'GET', headers = {}, body, cron_expression, is_active = true, notify_on = 'always', retry_enabled = false, retry_count = 2 } = req.body;

  if (!name || !url || !cron_expression) {
    return res.status(400).json({ error: 'name, url and cron_expression are required' });
  }
  if (!cron.validate(cron_expression)) {
    return res.status(400).json({ error: 'Invalid cron expression' });
  }

  const { rows } = await pool.query(
    `INSERT INTO cron_jobs (name, url, method, headers, body, cron_expression, is_active, notify_on, retry_enabled, retry_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [name, url, method, headers, body, cron_expression, is_active, notify_on, retry_enabled, Math.min(retry_count, 3)]
  );

  if (is_active) scheduleJob(rows[0]);
  res.status(201).json(rows[0]);
});

// PUT update job
router.put('/:id', async (req, res) => {
  const { name, url, method, headers, body, cron_expression, is_active, notify_on, retry_enabled, retry_count } = req.body;

  if (cron_expression && !cron.validate(cron_expression)) {
    return res.status(400).json({ error: 'Invalid cron expression' });
  }

  const { rows } = await pool.query(
    `UPDATE cron_jobs SET
      name = COALESCE($1, name),
      url = COALESCE($2, url),
      method = COALESCE($3, method),
      headers = COALESCE($4, headers),
      body = COALESCE($5, body),
      cron_expression = COALESCE($6, cron_expression),
      is_active = COALESCE($7, is_active),
      notify_on = COALESCE($8, notify_on),
      retry_enabled = COALESCE($9, retry_enabled),
      retry_count = COALESCE($10, retry_count)
     WHERE id = $11 RETURNING *`,
    [name, url, method, headers, body, cron_expression, is_active, notify_on, retry_enabled, retry_count != null ? Math.min(retry_count, 3) : null, req.params.id]
  );

  if (!rows.length) return res.status(404).json({ error: 'Job not found' });

  unscheduleJob(rows[0].id);
  if (rows[0].is_active) scheduleJob(rows[0]);

  res.json(rows[0]);
});

// DELETE job
router.delete('/:id', async (req, res) => {
  unscheduleJob(parseInt(req.params.id));
  await pool.query('DELETE FROM cron_jobs WHERE id = $1', [req.params.id]);
  res.json({ message: 'Job deleted' });
});

// POST trigger job manually
router.post('/:id/trigger', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM cron_jobs WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Job not found' });
  await executeJob(rows[0]);
  res.json({ message: 'Job triggered' });
});

module.exports = router;
