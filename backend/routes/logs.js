const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET logs for a job
router.get('/job/:jobId', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM execution_logs WHERE job_id = $1 ORDER BY executed_at DESC LIMIT 50`,
    [req.params.jobId]
  );
  res.json(rows);
});

// GET all recent logs
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT l.*, j.name as job_name FROM execution_logs l
     JOIN cron_jobs j ON l.job_id = j.id
     ORDER BY l.executed_at DESC LIMIT 100`
  );
  res.json(rows);
});

module.exports = router;
