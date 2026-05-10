import fs from 'fs/promises';
import path from 'path';
import bcryptjs from 'bcryptjs';
import { fileURLToPath } from 'url';
import { query } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, '..', '..', 'data', 'alerts.json');

/**
 * Auto-seed database on startup if empty (useful for Render deployments without shell access)
 */
export const autoSeedIfEmpty = async () => {
  try {
    // Check if users table has data
    const userResult = await query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userResult.rows[0].count);

    if (userCount > 0) {
      console.log('✓ Database already seeded, skipping auto-seed');
      return;
    }

    console.log('ℹ Database is empty, running auto-seed...');

    // Create default user
    const email = 'analyst@company.com';
    const password = 'Alert123!';
    const hashedPassword = await bcryptjs.hash(password, 10);

    await query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)',
      [email, hashedPassword, 'Security Analyst']
    );

    // Load and insert alerts
    try {
      const content = await fs.readFile(dataFilePath, 'utf8');
      const alerts = JSON.parse(content);

      if (!Array.isArray(alerts)) {
        throw new Error('alerts.json must contain an array');
      }

      const insertSql = `
        INSERT INTO alerts (
          id, timestamp, title, severity, status, category,
          source, affected_asset, assignee, description, raw_event
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
      `;

      let inserted = 0;
      for (const alert of alerts) {
        await query(insertSql, [
          alert.id,
          alert.timestamp,
          alert.title,
          alert.severity,
          alert.status,
          alert.category,
          alert.source,
          alert.affected_asset,
          alert.assignee ?? null,
          alert.description,
          JSON.stringify(alert.raw_event || {})
        ]);
        inserted++;
      }

      console.log(`✓ Auto-seed complete: user=${email}, alerts=${inserted}`);
    } catch (fileErr) {
      if (fileErr.code === 'ENOENT') {
        console.log('ℹ alerts.json not found, skipping alert seeding (user created)');
      } else {
        throw fileErr;
      }
    }
  } catch (err) {
    console.warn('⚠ Auto-seed failed (non-fatal):', err.message);
  }
};
