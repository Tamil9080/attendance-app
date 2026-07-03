'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
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

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (pin && pin.length !== 4) {
      setError('PIN must be exactly 4 digits');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          phone_number: phoneNumber,
          pin: pin || '1234'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (e) {
      setError('Connection to server failed. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950 text-slate-100 overflow-hidden">
      {/* Left: Registration Form */}
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
              Create Account
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Set up your account to start tracking scoped workspaces.
            </p>
          </div>

          <Card className="border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-2 items-center">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex gap-2 items-center">
                <span>✅</span>
                <span>Registration successful! Redirecting to login...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                id="email"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                id="password"
                type="password"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input
                label="Phone Number"
                id="phoneNumber"
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />

              <Input
                label="4-Digit login PIN (Optional)"
                id="pin"
                type="password"
                placeholder="1234"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                }}
                maxLength={4}
                className="tracking-widest"
              />

              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={success}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                Sign Up
              </Button>
            </form>

            <div className="mt-6 flex flex-col gap-4 text-center">
              <hr className="border-slate-800" />

              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Sign in instead
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
            <h3 className="text-lg font-semibold text-slate-200">Start Scoping Scenarios</h3>
            <p className="text-sm text-slate-400 mt-2">
              Our 3D canvas and dynamic UI adapts automatically to whether you are managing gyms, classes, or general events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
