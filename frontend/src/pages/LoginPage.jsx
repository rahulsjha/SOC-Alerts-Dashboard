import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../api';

export default function LoginPage() {
  const [email, setEmail] = useState('analyst@company.com');
  const [password, setPassword] = useState('Alert123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(254,242,242,0.95),_rgba(248,250,252,1)_45%,_rgba(15,23,42,0.98)_130%)] px-4 py-10">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.55),transparent_30%,transparent_70%,rgba(255,255,255,0.18))]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center lg:grid-cols-[1.05fr_0.95fr]">
        <div className="mb-10 max-w-xl text-slate-950 lg:mb-0 lg:pr-10">
          <p className="mb-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-lg shadow-slate-900/20">
            SOC alerts triage
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Find the real signal in the noise.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
            A focused workspace for security analysts to review alerts, prioritize what matters, and preserve every change.
          </p>

          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-lg shadow-slate-200/50 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Dataset</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">~1000 alerts</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-lg shadow-slate-200/50 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Auth</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">Cookie session</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-lg shadow-slate-200/50 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Workflow</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">Dashboard to detail</p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.2)] backdrop-blur-xl">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Welcome back</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">Sign in to continue</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Use the seeded analyst account below to enter the dashboard.</p>
          </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-950">Demo credentials</p>
            <p className="mt-2">Email: analyst@company.com</p>
            <p>Password: Alert123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
