import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { alertsAPI } from '../api';

const severityColors = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
  info: 'bg-gray-100 text-gray-800',
};

const statusColors = {
  new: 'bg-purple-100 text-purple-800',
  investigating: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  false_positive: 'bg-gray-100 text-gray-800',
};

export default function AlertsListPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const pageSize = 20;
  const severity = searchParams.get('severity') || '';
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const response = await alertsAPI.list({
          page,
          limit: pageSize,
          severity: severity || undefined,
          status: status || undefined,
          category: category || undefined,
          sortBy: 'timestamp',
          sortOrder: 'DESC'
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

    fetchAlerts();
  }, [page, severity, status, category]);

  const handleFilterChange = (newFilters) => {
    setPage(1);
    const params = new URLSearchParams();
    if (severity) params.set('severity', severity);
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Alerts List</h1>
        <p className="text-gray-600 mt-1">Showing {Math.min((page - 1) * pageSize + 1, total)} - {Math.min(page * pageSize, total)} of {total} alerts</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={severity}
              onChange={(e) => handleFilterChange({ severity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => handleFilterChange({ status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">False Positive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => handleFilterChange({ category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Categories</option>
              <option value="malware">Malware</option>
              <option value="phishing">Phishing</option>
              <option value="unauthorized_access">Unauthorized Access</option>
              <option value="data_exfiltration">Data Exfiltration</option>
              <option value="policy_violation">Policy Violation</option>
              <option value="suspicious_login">Suspicious Login</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No alerts found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Severity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Asset</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Time</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{alert.title}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${severityColors[alert.severity]}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[alert.status]}`}>
                          {alert.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                        {alert.category.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{alert.affected_asset}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(alert.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/alerts/${alert.id}`)}
                          className="text-red-600 hover:text-red-900 font-medium text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <div>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
