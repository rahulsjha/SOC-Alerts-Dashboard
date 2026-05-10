import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_rgba(248,250,252,0.96)_35%,_rgba(241,245,249,1)_100%)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-slate-950/90 text-white backdrop-blur-xl shadow-[0_16px_40px_rgba(15,23,42,0.24)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-left"
          >
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">SOC Console</p>
            <h1 className="text-lg font-semibold leading-tight">Alerts Dashboard</h1>
          </button>

          <nav className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/alerts')}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              Alerts
            </button>
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-right sm:block">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in as</p>
              <p className="text-sm font-medium text-white">{user?.name || user?.email || 'Security Analyst'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
