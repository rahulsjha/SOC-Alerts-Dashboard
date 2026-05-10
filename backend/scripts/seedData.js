import fs from 'fs/promises';
import path from 'path';
import bcryptjs from 'bcryptjs';
import { fileURLToPath } from 'url';
import pool, { initializeDatabase, query } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, '..', 'data', 'alerts.json');

const loadAlertsFromJson = async () => {
  const content = await fs.readFile(dataFilePath, 'utf8');
  const parsed = JSON.parse(content);

  if (!Array.isArray(parsed)) {
    throw new Error('alerts.json must contain an array of alert objects');
  }

  return parsed;
};

const seedDatabase = async () => {
  try {
    await initializeDatabase();

    await query('DELETE FROM alerts');
    await query('DELETE FROM users');

    const email = 'analyst@company.com';
    const password = 'Alert123!';
    const hashedPassword = await bcryptjs.hash(password, 10);

    await query('INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)', [
      email,
      hashedPassword,
      'Security Analyst'
    ]);

    const alerts = await loadAlertsFromJson();

    const insertSql = `
      INSERT INTO alerts (
        id,
        timestamp,
        title,
        severity,
        status,
        category,
        source,
        affected_asset,
        assignee,
        description,
        raw_event
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
    `;

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
    }

    console.log(`Seed complete. User: ${email} / ${password}`);
    console.log(`Loaded ${alerts.length} alerts from data/alerts.json`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seedDatabase();
