'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useApp } from '@/app/providers';
import { API_BASE_URL } from '@/config';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

const RotatingGlobe = dynamic(() => import('@/components/3d/RotatingGlobe'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
});

export default function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [isPinLogin, setIsPinLogin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let url = `${API_BASE_URL}/login`;
      let body = { email, password };

      if (isPinLogin) {
        url = `${API_BASE_URL}/pin-login`;
        body = { email, pin };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        login(data.user);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (e) {
      // Demo Credentials Fallback
      if (email === 'admin' && (password === 'admin123' || pin === '1234')) {
        login({ 
          id: 1, 
          username: 'admin', 
          email: 'admin@attendance.local', 
          workspaces: ['gym', 'school', 'college', 'other'] 
        });
      } else {
        setError('Server not running. Try using admin/admin123 or start the server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950 text-slate-100 overflow-hidden">
      {/* Left: Login Form */}
      <div className="flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20 xl:px-24 z-10">
        <div className="mx-auto w-full max-w-md">
          {/* Logo / Icon */}
          <div className="flex items-center gap-3 mb-8">
            <span className="text-3xl" role="img" aria-label="calendar">
              📅
            </span>
            <span className="font-semibold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-indigo-600 font-sans">
              ATTENDANCE.IO
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Sign in to manage your workspace attendance.
            </p>
          </div>

          <Card className="border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-2 items-center">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address or Username"
                id="email"
                type="text"
                placeholder="admin or email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-slate-100"
              />

              {!isPinLogin ? (
                <Input
                  label="Password"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isPinLogin}
                />
              ) : (
                <Input
                  label="4-Digit PIN"
                  id="pin"
                  type="password"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPin(val);
                  }}
                  maxLength={4}
                  required={isPinLogin}
                  className="text-center tracking-widest text-lg"
                />
              )}

              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                {isPinLogin ? 'Sign In with PIN' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 flex flex-col gap-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsPinLogin(!isPinLogin);
                  setError('');
                  setPassword('');
                  setPin('');
                }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {isPinLogin ? 'Use Password Sign In' : 'Use 4-Digit PIN Sign In'}
              </button>

              <hr className="border-slate-800" />

              <p className="text-xs text-slate-400">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Create one here
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Right: 3D Globe Visual (hidden on small/medium screens) */}
      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 relative border-l border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_50%)]" />
        <div className="w-full max-w-lg z-10 flex flex-col items-center">
          <div className="w-full aspect-square">
            <RotatingGlobe />
          </div>
          <div className="text-center px-12 -mt-10">
            <h3 className="text-lg font-semibold text-slate-200">Interactive 3D Workspace</h3>
            <p className="text-sm text-slate-400 mt-2">
              Select dynamic workspaces, add custom cohorts, and view student analytics in high fidelity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
