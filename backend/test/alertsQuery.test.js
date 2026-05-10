import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFilters, buildOrderClause, buildTrendDays, severityOrder } from '../src/utils/alertsQuery.js';

test('buildFilters always starts with a neutral clause', () => {
  const result = buildFilters({});

  assert.deepEqual(result.filters, ['1 = 1']);
  assert.deepEqual(result.params, []);
});

test('buildFilters trims search terms', () => {
  const result = buildFilters({ q: '  phishing  ' });

  assert.equal(result.params[0], '%phishing%');
  assert.equal(result.filters[1].includes('ILIKE $1'), true);
});

test('buildFilters expands search terms across all searchable columns', () => {
  const result = buildFilters({ q: 'vpn' });

  assert.equal(result.params.length, 4);
  assert.deepEqual(result.params, ['%vpn%', '%vpn%', '%vpn%', '%vpn%']);
});

test('buildFilters accepts severity filters', () => {
  const result = buildFilters({ severity: 'high' });

  assert.deepEqual(result.params, ['high']);
  assert.equal(result.filters[1], 'severity = $1');
});

test('buildFilters accepts status filters', () => {
  const result = buildFilters({ status: 'resolved' });

  assert.deepEqual(result.params, ['resolved']);
  assert.equal(result.filters[1], 'status = $1');
});

test('buildFilters accepts category filters', () => {
  const result = buildFilters({ category: 'malware' });

  assert.deepEqual(result.params, ['malware']);
  assert.equal(result.filters[1], 'category = $1');
});

test('buildFilters accepts a start date', () => {
  const result = buildFilters({ startDate: '2026-05-01T00:00:00.000Z' });

  assert.equal(result.filters[1], 'timestamp >= $1');
  assert.equal(result.params[0], '2026-05-01T00:00:00.000Z');
});

test('buildFilters accepts an end date', () => {
  const result = buildFilters({ endDate: '2026-05-10T23:59:59.999Z' });

  assert.equal(result.filters[1], 'timestamp <= $1');
  assert.equal(result.params[0], '2026-05-10T23:59:59.999Z');
});

test('buildFilters ignores invalid severity values', () => {
  const result = buildFilters({ severity: 'urgent' });

  assert.deepEqual(result.filters, ['1 = 1']);
  assert.deepEqual(result.params, []);
});

test('buildFilters ignores invalid status values', () => {
  const result = buildFilters({ status: 'done' });

  assert.deepEqual(result.filters, ['1 = 1']);
  assert.deepEqual(result.params, []);
});

test('buildFilters ignores invalid category values', () => {
  const result = buildFilters({ category: 'access' });

  assert.deepEqual(result.filters, ['1 = 1']);
  assert.deepEqual(result.params, []);
});

test('buildFilters preserves parameter order across combined filters', () => {
  const result = buildFilters({
    q: 'vpn',
    severity: 'high',
    status: 'investigating',
    category: 'phishing',
    startDate: '2026-05-01T00:00:00.000Z',
    endDate: '2026-05-10T23:59:59.999Z'
  });

  assert.equal(result.params.length, 9);
  assert.equal(result.filters[1].includes('$1'), true);
  assert.equal(result.filters[2], 'severity = $5');
  assert.equal(result.filters[3], 'status = $6');
  assert.equal(result.filters[4], 'category = $7');
  assert.equal(result.filters[5], 'timestamp >= $8');
  assert.equal(result.filters[6], 'timestamp <= $9');
});

test('buildOrderClause defaults to timestamp descending', () => {
  const clause = buildOrderClause(undefined, undefined);

  assert.equal(clause.startsWith('timestamp DESC'), true);
});

test('buildOrderClause accepts timestamp ascending', () => {
  const clause = buildOrderClause('timestamp', 'asc');

  assert.equal(clause.startsWith('timestamp ASC'), true);
});

test('buildOrderClause accepts timestamp descending', () => {
  const clause = buildOrderClause('timestamp', 'desc');

  assert.equal(clause.startsWith('timestamp DESC'), true);
});

test('buildOrderClause sorts severity by rank first', () => {
  const clause = buildOrderClause('severity', 'asc');

  assert.equal(clause.startsWith("CASE severity"), true);
  assert.equal(clause.includes('timestamp DESC'), true);
});

test('buildOrderClause falls back to timestamp when field is unknown', () => {
  const clause = buildOrderClause('priority', 'asc');

  assert.equal(clause.startsWith('timestamp ASC'), true);
});

test('buildOrderClause falls back to descending when order is unknown', () => {
  const clause = buildOrderClause('timestamp', 'up');

  assert.equal(clause.startsWith('timestamp DESC'), true);
});

test('buildTrendDays returns 14 day labels by default', () => {
  const days = buildTrendDays(new Date('2026-05-10T12:00:00.000Z'));

  assert.equal(days.length, 14);
  assert.equal(days[0], '2026-04-27');
  assert.equal(days[13], '2026-05-10');
});

test('buildTrendDays supports a custom window size', () => {
  const days = buildTrendDays(new Date('2026-05-10T12:00:00.000Z'), 5);

  assert.deepEqual(days, ['2026-05-06', '2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10']);
});

test('severityOrder keeps critical alerts first', () => {
  assert.deepEqual(severityOrder[0], 'critical');
  assert.deepEqual(severityOrder[severityOrder.length - 1], 'info');
});