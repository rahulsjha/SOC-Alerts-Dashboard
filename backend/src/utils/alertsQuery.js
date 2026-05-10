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

export const buildFilters = (query) => {
  const filters = ['1 = 1'];
  const params = [];
  let idx = 1;

  const searchTerm = typeof query.q === 'string' ? query.q.trim() : '';
  if (searchTerm) {
    filters.push(
      `(title ILIKE $${idx} OR description ILIKE $${idx + 1} OR affected_asset ILIKE $${idx + 2} OR source ILIKE $${idx + 3})`
    );
    params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    idx += 4;
  }

  if (query.severity && allowedSeverities.has(query.severity)) {
    filters.push(`severity = $${idx}`);
    params.push(query.severity);
    idx += 1;
  }

  if (query.status && allowedStatuses.has(query.status)) {
    filters.push(`status = $${idx}`);
    params.push(query.status);
    idx += 1;
  }

  if (query.category && allowedCategories.has(query.category)) {
    filters.push(`category = $${idx}`);
    params.push(query.category);
    idx += 1;
  }

  if (query.startDate) {
    filters.push(`timestamp >= $${idx}`);
    params.push(query.startDate);
    idx += 1;
  }

  if (query.endDate) {
    filters.push(`timestamp <= $${idx}`);
    params.push(query.endDate);
    idx += 1;
  }

  return { filters, params };
};

export const buildOrderClause = (sortBy, sortOrder) => {
  const normalizedSortBy = allowedSortFields.has(sortBy) ? sortBy : 'timestamp';
  const normalizedSortOrder = allowedSortOrders.has(String(sortOrder).toLowerCase())
    ? String(sortOrder).toLowerCase()
    : 'desc';

  if (normalizedSortBy === 'severity') {
    return `${severityRankSql} ${normalizedSortOrder.toUpperCase()}, timestamp DESC`;
  }

  return `timestamp ${normalizedSortOrder.toUpperCase()}, ${severityRankSql}`;
};

export const buildTrendDays = (now = new Date(), count = 14) => {
  const days = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - offset);
    days.push(date.toISOString().slice(0, 10));
  }

  return days;
};

export { severityOrder, severityRankSql };