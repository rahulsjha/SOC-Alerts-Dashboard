import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertsAPI } from '../api';

const severityPalette = {
  critical: { label: 'Critical', bar: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' },
  high: { label: 'High', bar: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' },
  medium: { label: 'Medium', bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  low: { label: 'Low', bar: 'bg-sky-500', chip: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200' },
  info: { label: 'Info', bar: 'bg-slate-400', chip: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' }
};

const formatCategory = (category) => category.replace(/_/g, ' ');

const dispositionStyles = {
  falsePositive: { label: 'False positive', color: '#f97316' },
  truePositive: { label: 'True positive', color: '#14b8a6' },
  other: { label: 'Other queue', color: '#64748b' }
};

const getChartPoint = (value, index, total, width, height, maxValue) => {
  if (total <= 1) {
    return { x: width / 2, y: height / 2 };
  }

  const x = (index / (total - 1)) * width;
  const y = height - (value / maxValue) * height;

  return { x, y };
};

const buildAreaPath = (points, height) => {
  if (points.length === 0) {
    return '';
  }

  const topPath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  return `${topPath} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;
};

const formatMonthLabel = (label) => label.replace('.', '');

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await alertsAPI.stats();
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const goToAlerts = (query = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    navigate(`/alerts?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="rounded-3xl border border-white/70 bg-white/80 px-6 py-5 shadow-xl shadow-slate-200/60 backdrop-blur">
          <p className="text-sm font-medium text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalAlerts = stats?.total || 0;
  const severityRows = [...(stats?.bySeverity || [])];
  const categoryRows = [...(stats?.byCategory || [])];
  const statusRows = [...(stats?.byStatus || [])];
  const trendRows = stats?.trend || [];
  const sixMonthRows = stats?.sixMonthTrend || [];
  const disposition = stats?.disposition || { falsePositive: 0, truePositive: 0, other: 0, total: 0 };
  const highestTrend = Math.max(...trendRows.map((item) => item.count), 1);
  const highestSixMonth = Math.max(...sixMonthRows.map((item) => item.count), 1);
  const sixMonthPoints = useMemo(() => {
    const width = 520;
    const height = 180;

    return sixMonthRows.map((item, index) =>
      getChartPoint(item.count, index, sixMonthRows.length, width, height, highestSixMonth)
    );
  }, [sixMonthRows, highestSixMonth]);

  const sixMonthAreaPath = useMemo(() => buildAreaPath(sixMonthPoints, 180), [sixMonthPoints]);

  const donutSegments = useMemo(() => {
    const parts = [
      { key: 'falsePositive', value: disposition.falsePositive },
      { key: 'truePositive', value: disposition.truePositive },
      { key: 'other', value: disposition.other }
    ];
    const total = Math.max(disposition.total || 0, 1);
    let cumulative = 0;

    return parts.map((part) => {
      const start = cumulative / total;
      cumulative += part.value;
      const end = cumulative / total;

      return {
        ...part,
        percent: Math.round((part.value / total) * 100),
        dashArray: `${Math.max((end - start) * 100, 0)} 100`,
        dashOffset: 25 - start * 100,
        style: dispositionStyles[part.key]
      };
    });
  }, [disposition]);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-10">
          <div className="space-y-5">
            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
              Analyst Overview
            </span>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Triage the alert flood with a clearer view of what matters.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Explore severity spikes, investigate category clusters, and jump straight into the queue that needs attention.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => goToAlerts({ severity: 'critical' })}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Critical</p>
                <p className="mt-2 text-3xl font-semibold text-rose-300">
                  {severityRows.find((item) => item.severity === 'critical')?.count || 0}
                </p>
              </button>
              <button
                onClick={() => goToAlerts({ status: 'new' })}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">New Queue</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {stats?.byStatus?.find((item) => item.status === 'new')?.count || 0}
                </p>
              </button>
              <button
                onClick={() => goToAlerts({ status: 'investigating' })}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">In Flight</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {stats?.byStatus?.find((item) => item.status === 'investigating')?.count || 0}
                </p>
              </button>
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Total alerts</p>
                <p className="mt-2 text-4xl font-semibold">{totalAlerts}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Open alerts</p>
                <p className="mt-2 text-4xl font-semibold">{stats?.openCount || 0}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Urgent</p>
                <p className="mt-2 text-4xl font-semibold text-orange-300">{stats?.urgentCount || 0}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Resolved</p>
                <p className="mt-2 text-4xl font-semibold text-emerald-300">
                  {stats?.byStatus?.find((item) => item.status === 'resolved')?.count || 0}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-white/10 to-white/5 p-4 text-sm text-slate-300">
              Click any aggregate to jump into the filtered alert queue.
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Severity mix</p>
              <h2 className="text-2xl font-semibold text-slate-950">Where the queue is concentrated</h2>
            </div>
            <button
              onClick={() => goToAlerts()}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              View all alerts
            </button>
          </div>

          <div className="space-y-3">
            {severityRows.map((item) => {
              const percent = totalAlerts ? Math.round((item.count / totalAlerts) * 100) : 0;
              const palette = severityPalette[item.severity] || severityPalette.info;

              return (
                <button
                  key={item.severity}
                  onClick={() => goToAlerts({ severity: item.severity })}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${palette.chip}`}>
                        {palette.label}
                      </span>
                      <span className="text-sm text-slate-500">{item.count} alerts</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{percent}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${palette.bar}`} style={{ width: `${percent}%` }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Vulnerability severity</p>
              <div className="mt-4 space-y-4">
                {severityRows.map((item) => {
                  const percent = totalAlerts ? Math.round((item.count / totalAlerts) * 100) : 0;
                  const palette = severityPalette[item.severity] || severityPalette.info;

                  return (
                    <button
                      key={item.severity}
                      onClick={() => goToAlerts({ severity: item.severity })}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${palette.chip}`}>
                          {palette.label}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">{item.count}</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${palette.bar}`} style={{ width: `${percent}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">6-month curve</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">Trend over the last six months</h3>
              <div className="mt-4 rounded-[1.25rem] bg-white p-4">
                <svg viewBox="0 0 520 220" className="h-56 w-full">
                  <defs>
                    <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#0f172a" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0, 1, 2, 3].map((tick) => {
                    const y = 180 - (tick / 3) * 160;
                    return (
                      <g key={tick}>
                        <line x1="0" x2="520" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 8" />
                        <text x="0" y={y - 4} fill="#94a3b8" fontSize="10">
                          {Math.round((highestSixMonth / 3) * tick)}
                        </text>
                      </g>
                    );
                  })}
                  {sixMonthAreaPath ? <path d={sixMonthAreaPath} fill="url(#trendFill)" /> : null}
                  {sixMonthPoints.length > 1 ? (
                    <polyline
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={sixMonthPoints.map((point) => `${point.x},${point.y}`).join(' ')}
                    />
                  ) : null}
                  {sixMonthPoints.map((point, index) => (
                    <g key={sixMonthRows[index]?.key || index}>
                      <circle cx={point.x} cy={point.y} r="6" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
                      <circle cx={point.x} cy={point.y} r="3" fill="#0f172a" />
                    </g>
                  ))}
                  {sixMonthRows.map((item, index) => (
                    <text key={`${item.key}-label`} x={sixMonthPoints[index]?.x || 0} y="204" textAnchor="middle" fill="#64748b" fontSize="11">
                      {formatMonthLabel(item.month)}
                    </text>
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Disposition ring</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">False positive vs true positive</h2>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-center">
              <div className="grid place-items-center">
                <svg viewBox="0 0 220 220" className="h-56 w-56 -rotate-90">
                  <circle cx="110" cy="110" r="76" fill="none" stroke="#e2e8f0" strokeWidth="32" />
                  {donutSegments.map((segment, index) => (
                    <circle
                      key={segment.key}
                      cx="110"
                      cy="110"
                      r="76"
                      fill="none"
                      stroke={segment.style.color}
                      strokeWidth="32"
                      strokeDasharray={`${segment.value ? (segment.value / Math.max(disposition.total, 1)) * 477 : 0} 477`}
                      strokeDashoffset={
                        index === 0
                          ? 0
                          : donutSegments
                              .slice(0, index)
                              .reduce(
                                (offset, current) => offset + (current.value / Math.max(disposition.total, 1)) * 477,
                                0
                              ) * -1
                      }
                      strokeLinecap="round"
                    />
                  ))}
                  <circle cx="110" cy="110" r="52" fill="#ffffff" />
                </svg>
                <div className="-mt-36 text-center">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Queue split</p>
                  <p className="text-4xl font-semibold text-slate-950">{disposition.total}</p>
                </div>
              </div>

              <div className="space-y-3">
                {donutSegments.map((segment) => (
                  <button
                    key={segment.key}
                    onClick={() => goToAlerts(segment.key === 'falsePositive' ? { status: 'false_positive' } : segment.key === 'truePositive' ? { status: 'resolved' } : { status: 'new' })}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white"
                  >
                    <span className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.style.color }} />
                      <span className="text-sm font-medium text-slate-700">{segment.style.label}</span>
                    </span>
                    <span className="text-sm font-semibold text-slate-950">
                      {segment.value} <span className="text-slate-500">({segment.percent}%)</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">14-day trend</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Alert volume over time</h2>

            <div className="mt-6 flex h-72 items-end gap-2 rounded-[1.5rem] bg-slate-50 p-4">
              {trendRows.map((item) => {
                const height = `${Math.max((item.count / highestTrend) * 100, item.count > 0 ? 8 : 2)}%`;
                const label = new Date(item.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                return (
                  <button
                    key={item.day}
                    onClick={() => goToAlerts({ startDate: item.day, endDate: item.day })}
                    className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-xs font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100">
                      {item.count}
                    </span>
                    <div className="flex w-full items-end justify-center">
                      <div className="w-full max-w-[18px] rounded-t-full bg-gradient-to-t from-slate-900 via-slate-700 to-slate-500 transition group-hover:from-rose-500 group-hover:via-orange-500 group-hover:to-amber-400" style={{ height }} />
                    </div>
                    <span className="text-[11px] text-slate-500">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Category breakdown</p>
            <h2 className="text-2xl font-semibold text-slate-950">Primary alert themes</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categoryRows.map((item) => (
              <button
                key={item.category}
                onClick={() => goToAlerts({ category: item.category })}
                className="rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Category</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">{formatCategory(item.category)}</h3>
                <p className="mt-2 text-3xl font-semibold text-slate-700">{item.count}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Status breakdown</p>
            <h2 className="text-2xl font-semibold text-slate-950">Queue state</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {statusRows.map((item) => (
              <button
                key={item.status}
                onClick={() => goToAlerts({ status: item.status })}
                className="rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Status</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                  {item.status.replace(/_/g, ' ')}
                </h3>
                <p className="mt-2 text-3xl font-semibold text-slate-700">{item.count}</p>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}