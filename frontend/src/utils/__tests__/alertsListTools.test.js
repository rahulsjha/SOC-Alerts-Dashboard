import { describe, expect, it } from 'vitest';
import {
  buildBulkPayload,
  buildCurrentFilterPreset,
  deletePreset,
  getPresetByName,
  isAllVisibleSelected,
  normalizePresetName,
  toggleAlertSelection,
  toggleSelectAllVisible,
  upsertPreset
} from '../alertsListTools';

describe('alertsListTools', () => {
  const filters = buildCurrentFilterPreset({
    severity: 'high',
    status: 'new',
    category: 'malware',
    range: '7d',
    startDate: '2026-05-01',
    endDate: '2026-05-07',
    q: 'powershell',
    sortBy: 'severity',
    sortOrder: 'asc'
  });

  it('buildCurrentFilterPreset copies the current filter state', () => {
    expect(filters).toEqual({
      severity: 'high',
      status: 'new',
      category: 'malware',
      range: '7d',
      startDate: '2026-05-01',
      endDate: '2026-05-07',
      q: 'powershell',
      sortBy: 'severity',
      sortOrder: 'asc'
    });
  });

  it('normalizePresetName trims whitespace', () => {
    expect(normalizePresetName('  Night shift  ')).toBe('Night shift');
  });

  it('normalizePresetName returns an empty string for blank input', () => {
    expect(normalizePresetName('   ')).toBe('');
  });

  it('upsertPreset inserts a new preset into sorted order', () => {
    const next = upsertPreset(
      [{ name: 'Bravo', filters: {} }],
      'Alpha',
      filters
    );

    expect(next.map((preset) => preset.name)).toEqual(['Alpha', 'Bravo']);
  });

  it('upsertPreset replaces an existing preset with the same name', () => {
    const next = upsertPreset(
      [{ name: 'Alpha', filters: { severity: 'low' } }],
      'Alpha',
      filters
    );

    expect(next).toHaveLength(1);
    expect(next[0].filters).toEqual(filters);
  });

  it('upsertPreset preserves other presets', () => {
    const next = upsertPreset(
      [
        { name: 'Alpha', filters: {} },
        { name: 'Charlie', filters: {} }
      ],
      'Bravo',
      filters
    );

    expect(next.map((preset) => preset.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('deletePreset removes the target preset', () => {
    const next = deletePreset(
      [
        { name: 'Alpha', filters: {} },
        { name: 'Bravo', filters: {} }
      ],
      'Alpha'
    );

    expect(next.map((preset) => preset.name)).toEqual(['Bravo']);
  });

  it('getPresetByName returns the matching preset', () => {
    const preset = getPresetByName(
      [
        { name: 'Alpha', filters: { q: 'a' } },
        { name: 'Bravo', filters: { q: 'b' } }
      ],
      'Bravo'
    );

    expect(preset).toEqual({ name: 'Bravo', filters: { q: 'b' } });
  });

  it('getPresetByName returns undefined when the preset is missing', () => {
    const preset = getPresetByName([{ name: 'Alpha', filters: {} }], 'Zulu');

    expect(preset).toBeUndefined();
  });

  it('isAllVisibleSelected is false when nothing is selected', () => {
    expect(isAllVisibleSelected([{ id: 'a' }, { id: 'b' }], [])).toBe(false);
  });

  it('isAllVisibleSelected is true when every visible row is selected', () => {
    expect(isAllVisibleSelected([{ id: 'a' }, { id: 'b' }], ['a', 'b'])).toBe(true);
  });

  it('isAllVisibleSelected ignores extra selected ids', () => {
    expect(isAllVisibleSelected([{ id: 'a' }, { id: 'b' }], ['a', 'b', 'c'])).toBe(true);
  });

  it('toggleAlertSelection adds a missing alert id', () => {
    expect(toggleAlertSelection(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('toggleAlertSelection removes an existing alert id', () => {
    expect(toggleAlertSelection(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('toggleSelectAllVisible selects all visible rows when none are selected', () => {
    expect(toggleSelectAllVisible([{ id: 'a' }, { id: 'b' }], [])).toEqual(['a', 'b']);
  });

  it('toggleSelectAllVisible clears the selection when all visible rows are already selected', () => {
    expect(toggleSelectAllVisible([{ id: 'a' }, { id: 'b' }], ['a', 'b'])).toEqual([]);
  });

  it('buildBulkPayload maps investigating to a status update', () => {
    expect(buildBulkPayload('investigating')).toEqual({ status: 'investigating' });
  });

  it('buildBulkPayload maps resolved to a status update', () => {
    expect(buildBulkPayload('resolved')).toEqual({ status: 'resolved' });
  });

  it('buildBulkPayload maps false positive to a status update', () => {
    expect(buildBulkPayload('false_positive')).toEqual({ status: 'false_positive' });
  });

  it('buildBulkPayload maps high to a severity update', () => {
    expect(buildBulkPayload('high')).toEqual({ severity: 'high' });
  });

  it('buildBulkPayload returns an empty payload for unknown actions', () => {
    expect(buildBulkPayload('archive')).toEqual({});
  });
});