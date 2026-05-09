import sqlite3 from 'sqlite3';
import bcryptjs from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'alerts.db');

const db = new sqlite3.Database(dbPath);

const severities = ['critical', 'high', 'medium', 'low', 'info'];
const statuses = ['new', 'investigating', 'resolved', 'false_positive'];
const categories = ['malware', 'phishing', 'unauthorized_access', 'data_exfiltration', 'policy_violation', 'suspicious_login'];
const sources = ['endpoint-agent', 'email-gateway', 'firewall', 'cloud-audit', 'ids-system', 'dlp-engine'];

const titles = {
  malware: [
    'Potential Ransomware Activity Detected',
    'Suspicious Process Execution Detected',
    'Malware Signature Match',
    'Unwanted Software Installation',
    'Trojan Detection'
  ],
  phishing: [
    'Phishing Email Detected',
    'Suspicious Email Link Click',
    'Email Spoofing Attempt',
    'Credential Harvesting Attempt',
    'Phishing Domain Detection'
  ],
  unauthorized_access: [
    'Unauthorized Access Attempt',
    'Privilege Escalation Detected',
    'Failed Authentication Threshold Exceeded',
    'Suspicious Account Activity',
    'Unauthorized File Access'
  ],
  data_exfiltration: [
    'Large Data Transfer Detected',
    'Suspicious Cloud Upload',
    'Data Exfiltration Attempt',
    'Anomalous Data Access',
    'Bulk Export Activity'
  ],
  policy_violation: [
    'Acceptable Use Policy Violation',
    'Shadow IT Activity',
    'Unauthorized Software Installation',
    'Security Configuration Change',
    'Compliance Policy Violation'
  ],
  suspicious_login: [
    'Login from Unusual Location',
    'Login from New Device',
    'Impossible Travel Detected',
    'Brute Force Attack',
    'After-Hours Login Activity'
  ]
};

const affectedAssets = [
  'john.doe@company.com',
  'jane.smith@company.com',
  'mike.johnson@company.com',
  'sarah.wilson@company.com',
  '192.168.1.105',
  '192.168.1.210',
  'DESKTOP-ABC123',
  'LAPTOP-XYZ789',
  'mailserver-01',
  'database-prod-01'
];

function generateRandomId() {
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomTimestamp() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30); // Last 30 days
  const hoursAgo = Math.floor(Math.random() * 24);
  const minutesAgo = Math.floor(Math.random() * 60);
  
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000 - minutesAgo * 60 * 1000);
  return date.toISOString();
}

function generateAlerts(count) {
  const alerts = [];
  
  // Skew toward lower severity and newer status
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let severity;
    if (rand < 0.05) severity = 'critical';
    else if (rand < 0.15) severity = 'high';
    else if (rand < 0.35) severity = 'medium';
    else if (rand < 0.65) severity = 'low';
    else severity = 'info';

    const statusRand = Math.random();
    let status;
    if (statusRand < 0.4) status = 'new';
    else if (statusRand < 0.6) status = 'investigating';
    else if (statusRand < 0.85) status = 'resolved';
    else status = 'false_positive';

    const category = getRandomElement(categories);
    const title = getRandomElement(titles[category]);
    
    const alert = {
      id: generateRandomId(),
      timestamp: generateRandomTimestamp(),
      title: title,
      severity: severity,
      status: status,
      category: category,
      source: getRandomElement(sources),
      affected_asset: getRandomElement(affectedAssets),
      assignee: Math.random() > 0.7 ? getRandomElement(['alice', 'bob', 'charlie']) : null,
      description: `This is a ${severity} severity ${category} alert. ${title}. Further investigation recommended.`,
      raw_event: JSON.stringify({
        event_id: generateRandomId(),
        event_type: category,
        severity: severity,
        timestamp: new Date().toISOString(),
        source_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        destination_ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        protocol: getRandomElement(['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS']),
        port: Math.floor(Math.random() * 65535),
        action: getRandomElement(['blocked', 'allowed', 'quarantined', 'logged']),
        details: {
          process_name: getRandomElement(['explorer.exe', 'svchost.exe', 'powershell.exe', 'chrome.exe']),
          user: getRandomElement(affectedAssets),
          domain: 'company.com'
        }
      })
    };

    alerts.push(alert);
  }

  return alerts;
}

function seedDatabase() {
  db.serialize(() => {
    // Clear existing data
    db.run('DELETE FROM alerts');
    db.run('DELETE FROM users');

    // Insert seeded user
    const email = 'analyst@company.com';
    const password = 'Alert123!';
    const hashedPassword = bcryptjs.hashSync(password, 10);

    db.run(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, hashedPassword, 'Security Analyst'],
      (err) => {
        if (err) {
          console.error('Error inserting user:', err);
          return;
        }
        console.log(`✓ User created: ${email} / ${password}`);
      }
    );

    // Generate and insert alerts
    const alerts = generateAlerts(1000);
    const stmt = db.prepare(
      'INSERT INTO alerts (id, timestamp, title, severity, status, category, source, affected_asset, assignee, description, raw_event) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    alerts.forEach((alert) => {
      stmt.run([
        alert.id,
        alert.timestamp,
        alert.title,
        alert.severity,
        alert.status,
        alert.category,
        alert.source,
        alert.affected_asset,
        alert.assignee,
        alert.description,
        alert.raw_event
      ]);
    });

    stmt.finalize((err) => {
      if (err) {
        console.error('Error inserting alerts:', err);
      } else {
        console.log(`✓ ${alerts.length} alerts seeded successfully`);
      }
      db.close();
    });
  });
}

seedDatabase();
