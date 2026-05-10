import express from 'express';
import { query } from '../db.js';
import { buildFilters, buildOrderClause, buildTrendDays, severityOrder } from '../utils/alertsQuery.js';

const router = express.Router();

// GET /alerts - list alerts with pagination, filtering, sorting
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const orderClause = buildOrderClause(req.query.sortBy, req.query.sortOrder);
    const { filters, params } = buildFilters(req.query);
    const offset = (page - 1) * limit;
    const limitPlaceholder = params.length + 1;
    const offsetPlaceholder = params.length + 2;

    const alertsResult = await query(
      `SELECT *
       FROM alerts
       WHERE ${filters.join(' AND ')}
       ORDER BY ${orderClause}
       LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder}`,
      [...params, limit, offset]
    );

    const totalResult = await query(
      `SELECT COUNT(*) AS count
       FROM alerts
       WHERE ${filters.join(' AND ')}`,
      params
    );

    const total = Number(totalResult.rows[0]?.count || 0);

    res.json({
      alerts: alertsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /alerts/stats/dashboard - aggregated stats for the dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    const [severityResult, categoryResult, statusResult, trendResult, totalsResult] = await Promise.all([
      query('SELECT severity, COUNT(*)::int AS count FROM alerts GROUP BY severity'),
      query('SELECT category, COUNT(*)::int AS count FROM alerts GROUP BY category'),
      query('SELECT status, COUNT(*)::int AS count FROM alerts GROUP BY status'),
      query(
        `SELECT DATE(timestamp)::text AS day, COUNT(*)::int AS count
         FROM alerts
         WHERE timestamp >= NOW() - INTERVAL '13 days'
         GROUP BY DATE(timestamp)
         ORDER BY day ASC`
      ),
      query(
        `SELECT
          COUNT(*)::int AS total,
          COALESCE(SUM(CASE WHEN status IN ('new', 'investigating') THEN 1 ELSE 0 END), 0)::int AS "openCount",
          COALESCE(SUM(CASE WHEN severity IN ('critical', 'high') THEN 1 ELSE 0 END), 0)::int AS "urgentCount"
         FROM alerts`
      )
    ]);

    const severityRows = severityResult.rows;
    const categoryRows = categoryResult.rows;
    const statusRows = statusResult.rows;
    const trendRows = trendResult.rows;
    const totalsRow = totalsResult.rows[0] || {};

    const trendMap = new Map(trendRows.map((row) => [row.day, row.count]));
    const trend = [];

    buildTrendDays().forEach((day) => {
      trend.push({ day, count: trendMap.get(day) || 0 });
    });

    const total = Number(totalsRow?.total || 0);

    res.json({
      total,
      openCount: Number(totalsRow?.openCount || 0),
      urgentCount: Number(totalsRow?.urgentCount || 0),
      bySeverity: severityRows.sort(
        (left, right) => severityOrder.indexOf(left.severity) - severityOrder.indexOf(right.severity)
      ),
      byCategory: categoryRows.sort((left, right) => right.count - left.count),
      byStatus: statusRows,
      trend
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /alerts/:id - single alert
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM alerts WHERE id = $1', [req.params.id]);
    const alert = result.rows[0];

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /alerts/:id - update alert
router.patch('/:id', async (req, res) => {
  try {
    const updates = [];
    const params = [];
    const { status, severity, assignee } = req.body;
    let idx = 1;

    if (status !== undefined) {
      if (!allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      updates.push(`status = $${idx}`);
      params.push(status);
      idx += 1;
    }

    if (severity !== undefined) {
      if (!allowedSeverities.has(severity)) {
        return res.status(400).json({ error: 'Invalid severity value' });
      }

      updates.push(`severity = $${idx}`);
      params.push(severity);
      idx += 1;
    }

    if (assignee !== undefined) {
      updates.push(`assignee = $${idx}`);
      params.push(assignee || null);
      idx += 1;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');
    params.push(req.params.id);

    const updateResult = await query(
      `UPDATE alerts SET ${updates.join(', ')} WHERE id = $${idx}`,
      params
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const alertResult = await query('SELECT * FROM alerts WHERE id = $1', [req.params.id]);
    const alert = alertResult.rows[0];
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;