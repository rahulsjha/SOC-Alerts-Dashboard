import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="text-red-600 font-bold text-2xl">🚨</div>
            <h1 className="ml-2 text-xl font-bold text-gray-900">SOC Alerts</h1>
          </div>
          <nav className="flex items-center gap-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/alerts')}
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Alerts
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
