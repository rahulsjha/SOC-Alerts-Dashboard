import { describe, expect, it } from 'vitest';
import { deriveRangeDates } from '../alertsFilters';

describe('deriveRangeDates', () => {
  const now = new Date('2026-05-10T12:00:00.000Z');

  it('returns undefined range boundaries for all time', () => {
    expect(deriveRangeDates('all', '', '', now)).toEqual({
      startDate: undefined,
      endDate: undefined
    });
  });

  it('returns the expected custom range boundaries', () => {
    const expectedStart = new Date('2026-05-01T00:00:00.000').toISOString();
    const expectedEnd = new Date('2026-05-03T23:59:59.999').toISOString();

    expect(deriveRangeDates('custom', '2026-05-01', '2026-05-03', now)).toEqual({
      startDate: expectedStart,
      endDate: expectedEnd
    });
  });

  it('returns a 7 day rolling range', () => {
    const output = deriveRangeDates('7d', '', '', now);
    const expectedEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    ).toISOString();
    const expectedStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    expect(output.endDate).toBe(expectedEnd);
    expect(output.startDate).toBe(expectedStart);
  });

  it('returns a 24 hour rolling range', () => {
    const output = deriveRangeDates('24h', '', '', now);

    expect(output.startDate).toBe(new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
    expect(output.endDate).toBe(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString());
  });

  it('returns a 30 day rolling range', () => {
    const output = deriveRangeDates('30d', '', '', now);

    expect(output.startDate).toBe(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());
    expect(output.endDate).toBe(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString());
  });

  it('returns undefined start date for an incomplete custom range', () => {
    const output = deriveRangeDates('custom', '', '2026-05-03', now);

    expect(output.startDate).toBeUndefined();
    expect(output.endDate).toBe(new Date('2026-05-03T23:59:59.999').toISOString());
  });

  it('returns undefined end date for an incomplete custom range', () => {
    const output = deriveRangeDates('custom', '2026-05-01', '', now);

    expect(output.startDate).toBe(new Date('2026-05-01T00:00:00.000').toISOString());
    expect(output.endDate).toBeUndefined();
  });

  it('returns undefined boundaries for an unknown range', () => {
    expect(deriveRangeDates('weekly', '', '', now)).toEqual({
      startDate: undefined,
      endDate: undefined
    });
  });

  it('keeps custom date boundaries stable across inputs', () => {
    const output = deriveRangeDates('custom', '2026-04-14', '2026-04-20', now);

    expect(output).toEqual({
      startDate: new Date('2026-04-14T00:00:00.000').toISOString(),
      endDate: new Date('2026-04-20T23:59:59.999').toISOString()
    });
  });
});
