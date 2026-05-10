import 'dotenv/config';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.EXTERNAL_DATABASE_URL ||
  process.env.INTERNAL_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'Missing database connection string. Set DATABASE_URL or EXTERNAL_DATABASE_URL/INTERNAL_DATABASE_URL.'
  );
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export const query = (text, params = []) => pool.query(text, params);

export const initializeDatabase = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL,
      title TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low', 'info')),
      status TEXT NOT NULL CHECK(status IN ('new', 'investigating', 'resolved', 'false_positive')),
      category TEXT NOT NULL CHECK(category IN ('malware', 'phishing', 'unauthorized_access', 'data_exfiltration', 'policy_violation', 'suspicious_login')),
      source TEXT NOT NULL,
      affected_asset TEXT NOT NULL,
      assignee TEXT,
      description TEXT NOT NULL,
      raw_event JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_alerts_category ON alerts(category)`);

  return pool;
};

export default pool;
