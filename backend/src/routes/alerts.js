import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /alerts - list alerts with pagination, filtering, sorting
router.get('/', (req, res) => {
  const {
    page = 1,
    limit = 20,
    severity,
    status,
    category,
    sortBy = 'timestamp',
    sortOrder = 'DESC',
    startDate,
    endDate
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  let query = 'SELECT * FROM alerts WHERE 1=1';
  const params = [];

  if (severity) {
    query += ' AND severity = ?';
    params.push(severity);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (startDate) {
    query += ' AND timestamp >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND timestamp <= ?';
    params.push(endDate);
  }

  query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM alerts WHERE 1=1';
    const countParams = [];
    
    if (severity) {
      countQuery += ' AND severity = ?';
      countParams.push(severity);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }
    if (startDate) {
      countQuery += ' AND timestamp >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ' AND timestamp <= ?';
      countParams.push(endDate);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        alerts: rows,
        total: countResult.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.count / parseInt(limit))
      });
    });
  });
});

// GET /alerts/:id - single alert
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM alerts WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(row);
  });
});

// PATCH /alerts/:id - update alert
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { status, severity, assignee } = req.body;

  const updates = [];
  const params = [];

  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (severity) {
    updates.push('severity = ?');
    params.push(severity);
  }
  if (assignee !== undefined) {
    updates.push('assignee = ?');
    params.push(assignee);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  const query = `UPDATE alerts SET ${updates.join(', ')} WHERE id = ?`;
  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.get('SELECT * FROM alerts WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(row);
    });
  });
});

// GET /alerts/stats/dashboard - aggregated stats
router.get('/stats/dashboard', (req, res) => {
  db.all(`
    SELECT 
      severity, 
      COUNT(*) as count 
    FROM alerts 
    GROUP BY severity
  `, (err, severityStats) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.all(`
      SELECT 
        category, 
        COUNT(*) as count 
      FROM alerts 
      GROUP BY category
    `, (err, categoryStats) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.all(`
        SELECT 
          status, 
          COUNT(*) as count 
        FROM alerts 
        GROUP BY status
      `, (err, statusStats) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          bySeverity: severityStats,
          byCategory: categoryStats,
          byStatus: statusStats
        });
      });
    });
  });
});

export default router;
