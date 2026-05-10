import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, '..', 'data', 'alerts.json');

let seed = 1337;

const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const pick = (items) => items[Math.floor(random() * items.length)];

const weightedPick = (items) => {
  const value = random();
  let total = 0;

  for (const [item, weight] of items) {
    total += weight;
    if (value <= total) return item;
  }

  return items[items.length - 1][0];
};

const severities = [
  ['critical', 0.05],
  ['high', 0.1],
  ['medium', 0.2],
  ['low', 0.3],
  ['info', 0.35]
];

const statuses = [
  ['new', 0.4],
  ['investigating', 0.2],
  ['resolved', 0.25],
  ['false_positive', 0.15]
];

const categories = [
  'malware',
  'phishing',
  'unauthorized_access',
  'data_exfiltration',
  'policy_violation',
  'suspicious_login'
];

const sources = ['endpoint-agent', 'email-gateway', 'firewall', 'cloud-audit', 'ids-system', 'dlp-engine'];

const assets = [
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

const now = Date.now();

const makeAlert = (index) => {
  const category = pick(categories);
  const severity = weightedPick(severities);
  const status = weightedPick(statuses);
  const daysAgo = Math.floor(random() * 30);
  const hoursAgo = Math.floor(random() * 24);
  const minutesAgo = Math.floor(random() * 60);
  const timestamp = new Date(now - (daysAgo * 24 * 60 * 60 * 1000 + hoursAgo * 60 * 60 * 1000 + minutesAgo * 60 * 1000)).toISOString();
  const title = pick(titles[category]);
  const asset = pick(assets);

  return {
    id: `alert-${String(index + 1).padStart(4, '0')}`,
    timestamp,
    title,
    severity,
    status,
    category,
    source: pick(sources),
    affected_asset: asset,
    assignee: random() > 0.7 ? pick(['alice', 'bob', 'charlie']) : null,
    description: `This is a ${severity} severity ${category} alert. ${title}. Further investigation recommended.`,
    raw_event: {
      event_id: `evt-${String(index + 1).padStart(6, '0')}`,
      event_type: category,
      severity,
      timestamp,
      source_ip: `192.168.${Math.floor(random() * 255)}.${Math.floor(random() * 255)}`,
      destination_ip: `10.0.${Math.floor(random() * 255)}.${Math.floor(random() * 255)}`,
      protocol: pick(['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS']),
      port: Math.floor(random() * 65535),
      action: pick(['blocked', 'allowed', 'quarantined', 'logged']),
      details: {
        process_name: pick(['explorer.exe', 'svchost.exe', 'powershell.exe', 'chrome.exe']),
        user: asset,
        domain: 'company.com'
      }
    }
  };
};

const generate = async () => {
  const alerts = Array.from({ length: 1000 }, (_, idx) => makeAlert(idx));

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(alerts, null, 2), 'utf8');

  console.log(`Generated ${alerts.length} alerts at ${outputPath}`);
};

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
