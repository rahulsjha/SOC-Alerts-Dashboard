import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { alertsAPI } from '../api';

const severityColors = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300',
  info: 'bg-gray-100 text-gray-800 border-gray-300',
};

const statusColors = {
  new: 'bg-purple-100 text-purple-800 border-purple-300',
  investigating: 'bg-blue-100 text-blue-800 border-blue-300',
  resolved: 'bg-green-100 text-green-800 border-green-300',
  false_positive: 'bg-gray-100 text-gray-800 border-gray-300',
};

export default function AlertDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editedStatus, setEditedStatus] = useState('');
  const [editedSeverity, setEditedSeverity] = useState('');

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const response = await alertsAPI.get(id);
        setAlert(response.data);
        setEditedStatus(response.data.status);
        setEditedSeverity(response.data.severity);
      } catch (err) {
        console.error('Failed to fetch alert:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlert();
  }, [id]);

  const handleUpdate = async (updates) => {
    setUpdating(true);
    try {
      const response = await alertsAPI.update(id, updates);
      setAlert(response.data);
      setEditedStatus(response.data.status);
      setEditedSeverity(response.data.severity);
    } catch (err) {
      console.error('Failed to update alert:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDismiss = async () => {
    const action = window.confirm(
      'Mark this alert as resolved? Click Cancel to mark as false positive instead.'
    );
    await handleUpdate({
      status: action ? 'resolved' : 'false_positive'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading alert...</p>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg">Alert not found</p>
        <button
          onClick={() => navigate('/alerts')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Back to Alerts
        </button>
      </div>
    );
  }

  const rawEvent = JSON.parse(alert.raw_event);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{alert.title}</h1>
          <p className="text-gray-600 mt-2">Alert ID: {alert.id}</p>
        </div>
        <button
          onClick={() => navigate('/alerts')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 flex gap-4">
        <button
          onClick={handleDismiss}
          disabled={updating}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded font-medium transition"
        >
          {updating ? 'Updating...' : 'Dismiss Alert'}
        </button>
        <button
          onClick={() => handleUpdate({ status: 'investigating' })}
          disabled={updating}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded font-medium transition"
        >
          {updating ? 'Updating...' : 'Start Investigating'}
        </button>
      </div>

      {/* Alert Details */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={editedSeverity}
              onChange={(e) => {
                setEditedSeverity(e.target.value);
                handleUpdate({ severity: e.target.value });
              }}
              disabled={updating}
              className={`w-full px-4 py-2 rounded-lg border-2 font-semibold capitalize ${severityColors[editedSeverity]}`}
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={editedStatus}
              onChange={(e) => {
                setEditedStatus(e.target.value);
                handleUpdate({ status: e.target.value });
              }}
              disabled={updating}
              className={`w-full px-4 py-2 rounded-lg border-2 font-semibold capitalize ${statusColors[editedStatus]}`}
            >
              <option value="new">New</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">False Positive</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <p className="px-4 py-2 bg-gray-50 rounded capitalize text-gray-900 font-medium">
              {alert.category.replace(/_/g, ' ')}
            </p>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
            <p className="px-4 py-2 bg-gray-50 rounded text-gray-900 font-medium">{alert.source}</p>
          </div>

          {/* Affected Asset */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Affected Asset</label>
            <p className="px-4 py-2 bg-gray-50 rounded text-gray-900 font-medium">{alert.affected_asset}</p>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
            <p className="px-4 py-2 bg-gray-50 rounded text-gray-900 font-medium">
              {alert.assignee || 'Unassigned'}
            </p>
          </div>

          {/* Timestamp */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Timestamp</label>
            <p className="px-4 py-2 bg-gray-50 rounded text-gray-900 font-medium">
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <p className="px-4 py-3 bg-gray-50 rounded text-gray-700 leading-relaxed">{alert.description}</p>
        </div>
      </div>

      {/* Raw Event */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Raw Event Data</h2>
        <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
          <pre>{JSON.stringify(rawEvent, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
