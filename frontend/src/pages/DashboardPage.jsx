import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertsAPI } from '../api';

const severityColors = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300',
  info: 'bg-gray-100 text-gray-800 border-gray-300',
};

const statusColors = {
  new: 'bg-purple-100 text-purple-800',
  investigating: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  false_positive: 'bg-gray-100 text-gray-800',
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await alertsAPI.stats();
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleSeverityClick = (severity) => {
    navigate(`/alerts?severity=${severity}`);
  };

  const handleCategoryClick = (category) => {
    navigate(`/alerts?category=${category}`);
  };

  const handleStatusClick = (status) => {
    navigate(`/alerts?status=${status}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  const totalAlerts = stats?.bySeverity?.reduce((sum, s) => sum + s.count, 0) || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Security Alerts Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor and triage security alerts across your organization</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Alerts</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalAlerts}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Critical</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {stats?.bySeverity?.find(s => s.severity === 'critical')?.count || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">High Priority</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {stats?.bySeverity?.find(s => s.severity === 'high')?.count || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Unresolved</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {(stats?.byStatus?.find(s => s.status === 'new')?.count || 0) + 
             (stats?.byStatus?.find(s => s.status === 'investigating')?.count || 0)}
          </p>
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Alerts by Severity</h2>
        <div className="space-y-3">
          {stats?.bySeverity?.sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
            return severityOrder[a.severity] - severityOrder[b.severity];
          }).map((item) => (
            <div
              key={item.severity}
              onClick={() => handleSeverityClick(item.severity)}
              className="cursor-pointer hover:bg-gray-50 p-4 rounded border-2 border-gray-200 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`capitalize font-semibold px-3 py-1 rounded border ${severityColors[item.severity]}`}>
                    {item.severity}
                  </span>
                  <span className="text-gray-600">{item.count} alerts</span>
                </div>
                <div className="w-48 h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.severity === 'critical' ? 'bg-red-600' : item.severity === 'high' ? 'bg-orange-500' : item.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                    style={{ width: `${(item.count / totalAlerts) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Alerts by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats?.byCategory?.sort((a, b) => b.count - a.count).map((item) => (
            <div
              key={item.category}
              onClick={() => handleCategoryClick(item.category)}
              className="cursor-pointer hover:shadow-lg p-4 rounded-lg border-2 border-gray-200 transition"
            >
              <p className="font-semibold text-gray-900 capitalize">{item.category.replace(/_/g, ' ')}</p>
              <p className="text-2xl font-bold text-gray-600 mt-2">{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Alerts by Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats?.byStatus?.map((item) => (
            <div
              key={item.status}
              onClick={() => handleStatusClick(item.status)}
              className={`cursor-pointer p-4 rounded-lg text-center font-semibold transition hover:shadow-lg border-2 border-gray-200 ${statusColors[item.status]}`}
            >
              <p className="capitalize">{item.status.replace(/_/g, ' ')}</p>
              <p className="text-2xl font-bold mt-2">{item.count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
