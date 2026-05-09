import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { alertsAPI } from '../api';

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

const Field = ({ label, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
    <div className="mt-2 text-sm text-slate-900">{children}</div>
  </div>
);

export default function AlertDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ status: '', severity: '', assignee: '' });

  useEffect(() => {
    const loadAlert = async () => {
      try {
        const response = await alertsAPI.get(id);
        setAlert(response.data);
        setDraft({
          status: response.data.status,
          severity: response.data.severity,
          assignee: response.data.assignee || ''
        });
      } catch (err) {
        console.error('Failed to fetch alert:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAlert();
  }, [id]);

  const parsedRawEvent = useMemo(() => {
    if (!alert?.raw_event) {
      return null;
    }

    try {
      return JSON.parse(alert.raw_event);
    } catch {
      return { parseError: 'Unable to parse raw_event', value: alert.raw_event };
    }
  }, [alert]);

  const persistChange = async (updates) => {
    setSaving(true);

    try {
      const response = await alertsAPI.update(id, updates);
      setAlert(response.data);
      setDraft({
        status: response.data.status,
        severity: response.data.severity,
        assignee: response.data.assignee || ''
      });
    } catch (err) {
      console.error('Failed to update alert:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = async (status) => {
    await persistChange({ status });
  };

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="rounded-3xl border border-white/70 bg-white/80 px-6 py-5 shadow-xl shadow-slate-200/60 backdrop-blur">
          <p className="text-sm font-medium text-slate-600">Loading alert...</p>
        </div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <p className="text-lg font-semibold text-slate-950">Alert not found</p>
          <button
            onClick={() => navigate('/alerts')}
            className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to alerts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${severityStyles[alert.severity] || severityStyles.info}`}>
                {alert.severity}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[alert.status] || statusStyles.false_positive}`}>
                {alert.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Alert detail</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">{alert.title}</h1>
              <p className="mt-2 text-sm text-slate-500">Alert ID {alert.id}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/alerts')}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Back
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button
          onClick={() => handleDismiss('resolved')}
          disabled={saving}
          className="rounded-2xl bg-emerald-600 px-5 py-4 text-left text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-100">Dismiss</p>
          <p className="mt-2 text-lg font-semibold">Mark resolved</p>
        </button>
        <button
          onClick={() => handleDismiss('false_positive')}
          disabled={saving}
          className="rounded-2xl bg-slate-900 px-5 py-4 text-left text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Dismiss</p>
          <p className="mt-2 text-lg font-semibold">Mark false positive</p>
        </button>
        <button
          onClick={() => persistChange({ status: 'investigating' })}
          disabled={saving}
          className="rounded-2xl bg-sky-600 px-5 py-4 text-left text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-sky-100">Action</p>
          <p className="mt-2 text-lg font-semibold">Start investigating</p>
        </button>
        <button
          onClick={() => persistChange({ status: draft.status, severity: draft.severity, assignee: draft.assignee || null })}
          disabled={saving}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left text-slate-950 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Save</p>
          <p className="mt-2 text-lg font-semibold">Persist edits</p>
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Field label="Severity">
          <select
            value={draft.severity}
            onChange={(event) => setDraft((current) => ({ ...current, severity: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
          >
            <option value="critical">critical</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
            <option value="info">info</option>
          </select>
        </Field>

        <Field label="Status">
          <select
            value={draft.status}
            onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
          >
            <option value="new">new</option>
            <option value="investigating">investigating</option>
            <option value="resolved">resolved</option>
            <option value="false_positive">false positive</option>
          </select>
        </Field>

        <Field label="Assignee">
          <input
            value={draft.assignee}
            onChange={(event) => setDraft((current) => ({ ...current, assignee: event.target.value }))}
            placeholder="Unassigned"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
          />
        </Field>

        <Field label="Category">
          <p className="capitalize">{alert.category.replace(/_/g, ' ')}</p>
        </Field>

        <Field label="Source">
          <p>{alert.source}</p>
        </Field>

        <Field label="Affected asset">
          <p>{alert.affected_asset}</p>
        </Field>

        <Field label="Timestamp">
          <p>{new Date(alert.timestamp).toLocaleString()}</p>
        </Field>

        <Field label="Updated at">
          <p>{alert.updated_at ? new Date(alert.updated_at).toLocaleString() : 'Unknown'}</p>
        </Field>

        <Field label="Created at">
          <p>{alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Unknown'}</p>
        </Field>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Description</p>
        <p className="mt-3 text-sm leading-7 text-slate-700">{alert.description}</p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Metadata</p>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
              <span>Alert ID</span>
              <span className="font-medium text-slate-950">{alert.id}</span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
              <span>Assignee</span>
              <span className="font-medium text-slate-950">{alert.assignee || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Raw event</p>
              <h2 className="mt-1 text-2xl font-semibold">Underlying telemetry</h2>
            </div>
          </div>
          <div className="mt-4 max-h-[34rem] overflow-auto rounded-2xl bg-slate-900 p-4 text-sm text-slate-100">
            <pre className="whitespace-pre-wrap break-words font-mono leading-6">
              {JSON.stringify(parsedRawEvent, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}