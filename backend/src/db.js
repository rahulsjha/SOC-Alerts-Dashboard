import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'alerts.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

const run = (sql) => {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const initializeDatabase = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      timestamp DATETIME NOT NULL,
      title TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low', 'info')),
      status TEXT NOT NULL CHECK(status IN ('new', 'investigating', 'resolved', 'false_positive')),
      category TEXT NOT NULL CHECK(category IN ('malware', 'phishing', 'unauthorized_access', 'data_exfiltration', 'policy_violation', 'suspicious_login')),
      source TEXT NOT NULL,
      affected_asset TEXT NOT NULL,
      assignee TEXT,
      description TEXT NOT NULL,
      raw_event TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_alerts_category ON alerts(category)`);

  return db;
};

export default db;
