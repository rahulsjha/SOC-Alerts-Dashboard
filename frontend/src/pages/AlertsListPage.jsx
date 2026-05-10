import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { alertsAPI } from '../api';
import { deriveRangeDates } from '../utils/alertsFilters';
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
} from '../utils/alertsListTools';

const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];

const severityStyles = {
  critical: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
  high: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200',
  medium: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  low: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
  info: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
};

const statusStyles = {
  new: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
  investigating: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
  resolved: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  false_positive: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
};

const categoryOptions = [
  ['malware', 'Malware'],
  ['phishing', 'Phishing'],
  ['unauthorized_access', 'Unauthorized Access'],
  ['data_exfiltration', 'Data Exfiltration'],
  ['policy_violation', 'Policy Violation'],
  ['suspicious_login', 'Suspicious Login']
];

const rangeOptions = [
  ['all', 'All time'],
  ['24h', 'Last 24 hours'],
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['custom', 'Custom range']
];

const sortFields = [
  ['timestamp', 'Timestamp'],
  ['severity', 'Severity']
];

const sortOrders = [
  ['desc', 'Descending'],
  ['asc', 'Ascending']
];

const presetStorageKey = 'soc-alerts-filter-presets';

export default function AlertsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [savedPresets, setSavedPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState('');

  const page = Number(searchParams.get('page') || '1');
  const severity = searchParams.get('severity') || '';
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';
  const range = searchParams.get('range') || 'all';
  const startDateInput = searchParams.get('startDate') || '';
  const endDateInput = searchParams.get('endDate') || '';
  const q = searchParams.get('q') || '';
  const sortBy = searchParams.get('sortBy') || 'timestamp';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const resolvedDates = useMemo(
    () => deriveRangeDates(range, startDateInput, endDateInput),
    [range, startDateInput, endDateInput]
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(presetStorageKey);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setSavedPresets(parsed);
      }
    } catch {
      setSavedPresets([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(presetStorageKey, JSON.stringify(savedPresets));
  }, [savedPresets]);

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);

      try {
        const response = await alertsAPI.list({
          page,
          limit: 20,
          severity: severity || undefined,
          status: status || undefined,
          category: category || undefined,
          q: q || undefined,
          startDate: resolvedDates.startDate,
          endDate: resolvedDates.endDate,
          sortBy,
          sortOrder
        });

        setAlerts(response.data.alerts);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [page, severity, status, category, q, sortBy, sortOrder, resolvedDates.startDate, resolvedDates.endDate, refreshTick]);

  useEffect(() => {
    setSelectedIds([]);
  }, [alerts]);

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    if (!updates.page) {
      next.set('page', '1');
    }

    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams({ page: '1', sortBy, sortOrder });
  };

  const currentFilterPreset = buildCurrentFilterPreset({
    severity,
    status,
    category,
    range,
    startDate: startDateInput,
    endDate: endDateInput,
    q,
    sortBy,
    sortOrder
  });

  const saveCurrentPreset = () => {
    const trimmedName = normalizePresetName(presetName);
    if (!trimmedName) {
      return;
    }

    setSavedPresets(upsertPreset(savedPresets, trimmedName, currentFilterPreset));
    setSelectedPresetName(trimmedName);
    setPresetName('');
  };

  const applySelectedPreset = () => {
    const preset = getPresetByName(savedPresets, selectedPresetName);
    if (!preset) {
      return;
    }

    updateParams({ ...preset.filters, page: '1' });
  };

  const deleteSelectedPreset = () => {
    if (!selectedPresetName) {
      return;
    }

    setSavedPresets((current) => deletePreset(current, selectedPresetName));
    setSelectedPresetName('');
  };

  const allVisibleSelected = isAllVisibleSelected(alerts, selectedIds);

  const onToggleAlertSelection = (id) => setSelectedIds((current) => toggleAlertSelection(current, id));

  const onToggleSelectAllVisible = () => setSelectedIds((current) => toggleSelectAllVisible(alerts, current));

  const runBulkUpdate = async (payload) => {
    if (selectedIds.length === 0) {
      return;
    }

    setBulkSaving(true);
    try {
      await Promise.all(selectedIds.map((id) => alertsAPI.update(id, payload)));
      setSelectedIds([]);
      setRefreshTick((current) => current + 1);
    } catch (err) {
      console.error('Bulk update failed:', err);
    } finally {
      setBulkSaving(false);
    }
  };

  const summaryText = total === 0
    ? 'No alerts match the current filter set.'
    : `Showing ${(page - 1) * 20 + 1} - ${Math.min(page * 20, total)} of ${total} alerts`;

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Alerts list</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-950">Filter and sort the triage queue</h1>
            <p className="mt-2 text-sm text-slate-600">{summaryText}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Back to dashboard
          </button>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Search</label>
            <input
              value={q}
              onChange={(event) => updateParams({ q: event.target.value })}
              placeholder="Search title, description, asset, or source"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Severity</label>
            <select
              value={severity}
              onChange={(event) => updateParams({ severity: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
            >
              <option value="">All severities</option>
              {severityOrder.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select
              value={status}
              onChange={(event) => updateParams({ status: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">False positive</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
            <select
              value={category}
              onChange={(event) => updateParams({ category: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
            >
              <option value="">All categories</option>
              {categoryOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Time range</label>
            <select
              value={range}
              onChange={(event) => updateParams({ range: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
            >
              {rangeOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Sort field</label>
            <select
              value={sortBy}
              onChange={(event) => updateParams({ sortBy: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
            >
              {sortFields.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Sort order</label>
            <select
              value={sortOrder}
              onChange={(event) => updateParams({ sortOrder: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
            >
              {sortOrders.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {range === 'custom' && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Start date</label>
              <input
                type="date"
                value={startDateInput}
                onChange={(event) => updateParams({ startDate: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">End date</label>
              <input
                type="date"
                value={endDateInput}
                onChange={(event) => updateParams({ endDate: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={clearFilters}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Clear filters
          </button>
          {['severity', 'status', 'category', 'range', 'q'].some((key) => searchParams.get(key)) && (
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {severity && <span className="rounded-full bg-slate-100 px-3 py-1">Severity: {severity}</span>}
              {status && <span className="rounded-full bg-slate-100 px-3 py-1">Status: {status.replace(/_/g, ' ')}</span>}
              {category && <span className="rounded-full bg-slate-100 px-3 py-1">Category: {category.replace(/_/g, ' ')}</span>}
              {range !== 'all' && <span className="rounded-full bg-slate-100 px-3 py-1">Range: {range}</span>}
              {q && <span className="rounded-full bg-slate-100 px-3 py-1">Search: {q}</span>}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Saved presets</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={presetName}
                onChange={(event) => setPresetName(event.target.value)}
                placeholder="Preset name (e.g. Critical queue)"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
              />
              <select
                value={selectedPresetName}
                onChange={(event) => setSelectedPresetName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
              >
                <option value="">Select saved preset</option>
                {savedPresets.map((preset) => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={saveCurrentPreset}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Save preset
            </button>
            <div className="flex gap-2">
              <button
                onClick={applySelectedPreset}
                disabled={!selectedPresetName}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
              <button
                onClick={deleteSelectedPreset}
                disabled={!selectedPresetName}
                className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <p className="text-sm font-medium text-slate-700">
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select alerts for bulk actions'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => runBulkUpdate(buildBulkPayload('investigating'))}
              disabled={selectedIds.length === 0 || bulkSaving}
              className="rounded-full border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark investigating
            </button>
            <button
              onClick={() => runBulkUpdate(buildBulkPayload('resolved'))}
              disabled={selectedIds.length === 0 || bulkSaving}
              className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark resolved
            </button>
            <button
              onClick={() => runBulkUpdate(buildBulkPayload('false_positive'))}
              disabled={selectedIds.length === 0 || bulkSaving}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark false positive
            </button>
            <button
              onClick={() => runBulkUpdate(buildBulkPayload('high'))}
              disabled={selectedIds.length === 0 || bulkSaving}
              className="rounded-full border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Set severity high
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm font-medium text-slate-600">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-10 text-center text-sm font-medium text-slate-600">No alerts found for the current filters.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={onToggleSelectAllVisible}
                        aria-label="Select all visible alerts"
                      />
                    </th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Severity</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="transition hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(alert.id)}
                          onChange={() => onToggleAlertSelection(alert.id)}
                          aria-label={`Select ${alert.title}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/alerts/${alert.id}`)}
                          className="text-left text-sm font-semibold text-slate-950 transition hover:text-rose-600"
                        >
                          {alert.title}
                        </button>
                        <p className="mt-1 text-xs text-slate-500">{alert.id}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${severityStyles[alert.severity] || severityStyles.info}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[alert.status] || statusStyles.false_positive}`}>
                          {alert.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 capitalize">{alert.category.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{alert.affected_asset}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{alert.source}</td>
                      <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                        {new Date(alert.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/alerts/${alert.id}`)}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => updateParams({ page: Math.max(1, page - 1) })}
                  disabled={page <= 1}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => updateParams({ page: Math.min(totalPages, page + 1) })}
                  disabled={page >= totalPages}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}