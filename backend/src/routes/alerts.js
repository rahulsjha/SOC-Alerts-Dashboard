import express from 'express';
import db from '../db.js';

const router = express.Router();

const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
const allowedSeverities = new Set(severityOrder);
const allowedStatuses = new Set(['new', 'investigating', 'resolved', 'false_positive']);
const allowedCategories = new Set([
  'malware',
  'phishing',
  'unauthorized_access',
  'data_exfiltration',
  'policy_violation',
  'suspicious_login'
]);
const allowedSortFields = new Set(['timestamp', 'severity']);
const allowedSortOrders = new Set(['asc', 'desc']);

const severityRankSql = `CASE severity
  WHEN 'critical' THEN 1
  WHEN 'high' THEN 2
  WHEN 'medium' THEN 3
  WHEN 'low' THEN 4
  WHEN 'info' THEN 5
  ELSE 6
END`;

const runQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(rows);
    });
  });

const getQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(row);
    });
  });

const buildFilters = (query) => {
  const filters = ['1 = 1'];
  const params = [];

  const searchTerm = typeof query.q === 'string' ? query.q.trim() : '';
  if (searchTerm) {
    filters.push('(title LIKE ? OR description LIKE ? OR affected_asset LIKE ? OR source LIKE ?)');
    params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
  }

  if (query.severity && allowedSeverities.has(query.severity)) {
    filters.push('severity = ?');
    params.push(query.severity);
  }

  if (query.status && allowedStatuses.has(query.status)) {
    filters.push('status = ?');
    params.push(query.status);
  }

  if (query.category && allowedCategories.has(query.category)) {
    filters.push('category = ?');
    params.push(query.category);
  }

  if (query.startDate) {
    filters.push('timestamp >= ?');
    params.push(query.startDate);
  }

  if (query.endDate) {
    filters.push('timestamp <= ?');
    params.push(query.endDate);
  }

  return { filters, params };
};

const buildOrderClause = (sortBy, sortOrder) => {
  const normalizedSortBy = allowedSortFields.has(sortBy) ? sortBy : 'timestamp';
  const normalizedSortOrder = allowedSortOrders.has(String(sortOrder).toLowerCase())
    ? String(sortOrder).toLowerCase()
    : 'desc';

  if (normalizedSortBy === 'severity') {
    return `${severityRankSql} ${normalizedSortOrder.toUpperCase()}, timestamp DESC`;
  }

  return `timestamp ${normalizedSortOrder.toUpperCase()}, ${severityRankSql}`;
};

// GET /alerts - list alerts with pagination, filtering, sorting
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const orderClause = buildOrderClause(req.query.sortBy, req.query.sortOrder);
    const { filters, params } = buildFilters(req.query);
    const offset = (page - 1) * limit;

    const alerts = await runQuery(
      `SELECT *
       FROM alerts
       WHERE ${filters.join(' AND ')}
       ORDER BY ${orderClause}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const totalRow = await getQuery(
      `SELECT COUNT(*) AS count
       FROM alerts
       WHERE ${filters.join(' AND ')}`,
      params
    );

    res.json({
      alerts,
      total: totalRow?.count || 0,
      page,
      limit,
      totalPages: Math.max(Math.ceil((totalRow?.count || 0) / limit), 1)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /alerts/stats/dashboard - aggregated stats for the dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    const [severityRows, categoryRows, statusRows, trendRows, totalsRow] = await Promise.all([
      runQuery('SELECT severity, COUNT(*) AS count FROM alerts GROUP BY severity'),
      runQuery('SELECT category, COUNT(*) AS count FROM alerts GROUP BY category'),
      runQuery('SELECT status, COUNT(*) AS count FROM alerts GROUP BY status'),
      runQuery(
        `SELECT DATE(timestamp) AS day, COUNT(*) AS count
         FROM alerts
         WHERE timestamp >= datetime('now', '-13 days')
         GROUP BY DATE(timestamp)
         ORDER BY day ASC`
      ),
      getQuery(
        `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status IN ('new', 'investigating') THEN 1 ELSE 0 END) AS openCount,
          SUM(CASE WHEN severity IN ('critical', 'high') THEN 1 ELSE 0 END) AS urgentCount
         FROM alerts`
      )
    ]);

    const trendMap = new Map(trendRows.map((row) => [row.day, row.count]));
    const trend = [];

    for (let offset = 13; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const day = date.toISOString().slice(0, 10);
      trend.push({ day, count: trendMap.get(day) || 0 });
    }

    const total = totalsRow?.total || 0;

    res.json({
      total,
      openCount: totalsRow?.openCount || 0,
      urgentCount: totalsRow?.urgentCount || 0,
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
    const alert = await getQuery('SELECT * FROM alerts WHERE id = ?', [req.params.id]);

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

    if (status !== undefined) {
      if (!allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      updates.push('status = ?');
      params.push(status);
    }

    if (severity !== undefined) {
      if (!allowedSeverities.has(severity)) {
        return res.status(400).json({ error: 'Invalid severity value' });
      }

      updates.push('severity = ?');
      params.push(severity);
    }

    if (assignee !== undefined) {
      updates.push('assignee = ?');
      params.push(assignee || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const result = await new Promise((resolve, reject) => {
      db.run(
        `UPDATE alerts SET ${updates.join(', ')} WHERE id = ?`,
        params,
        function (err) {
          if (err) {
            reject(err);
            return;
          }

          resolve(this);
        }
      );
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const alert = await getQuery('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;