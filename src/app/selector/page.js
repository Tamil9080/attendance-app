'use client';

import React, { useState } from 'react';
import { useApp } from '@/app/providers';
import { API_BASE_URL } from '@/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SelectorPage() {
  const { workspaces, selectInstitute, addWorkspace, logout, user } = useApp();
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Default presets metadata
  const presets = {
    gym: {
      title: 'Gym & Fitness',
      description: 'Manage members, personal training, and workout attendance',
      icon: '🏋️‍♂️',
      gradient: 'from-emerald-500/10 to-emerald-500/20',
      borderColor: 'group-hover:border-emerald-500/50'
    },
    school: {
      title: 'School / Academy',
      description: 'Track student rolls, classes, schedules, and reports',
      icon: '🏫',
      gradient: 'from-indigo-500/10 to-indigo-500/20',
      borderColor: 'group-hover:border-indigo-500/50'
    },
    college: {
      title: 'College / University',
      description: 'Manage courses, lectures, semesters, and attendance logs',
      icon: '🎓',
      gradient: 'from-violet-500/10 to-violet-500/20',
      borderColor: 'group-hover:border-violet-500/50'
    },
    other: {
      title: 'Other Institute',
      description: 'General attendance workspace for custom events, seminars, or organizations',
      icon: '🏢',
      gradient: 'from-sky-500/10 to-sky-500/20',
      borderColor: 'group-hover:border-sky-500/50'
    }
  };

  const handleAddWorkspace = async (e) => {
    e.preventDefault();
    setError('');
    const name = customName.trim();
    if (!name) return;

    if (workspaces.map(w => w.toLowerCase()).includes(name.toLowerCase())) {
      setError('A workspace with this name already exists.');
      return;
    }

    setIsLoading(true);
    const success = await addWorkspace(name);
    setIsLoading(false);

    if (success) {
      setCustomName('');
    } else {
      setError('Failed to create workspace. Please check your connection.');
    }
  };

  const getWorkspaceDetails = (wName) => {
    const key = wName.toLowerCase();
    if (presets[key]) return presets[key];

    // Details for custom workspaces
    return {
      title: wName,
      description: 'Custom scoped student attendance and payment records',
      icon: '🏷️',
      gradient: 'from-slate-800/40 to-indigo-950/20',
      borderColor: 'group-hover:border-indigo-500/30'
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-12 px-6 lg:px-20 relative">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.05),transparent_60%)] pointer-events-none" />

      {/* Top Header */}
      <header className="flex justify-between items-center max-w-6xl mx-auto w-full z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="calendar">📅</span>
          <span className="font-semibold tracking-wider text-slate-200">ATTENDANCE.IO</span>
        </div>
        <Button 
          variant="ghost" 
          onClick={logout}
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-900/40 px-3 h-8"
        >
          🚪 Logout
        </Button>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto w-full py-12 z-10 flex-grow flex flex-col justify-center">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Choose Workspace
          </h1>
          <p className="mt-3 text-slate-400 max-w-lg mx-auto">
            Select the institute database you want to manage. Each workspace maintains an isolated list of students, fees, and registers.
          </p>
        </div>

        {/* Workspaces Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {workspaces.map((wName) => {
            const details = getWorkspaceDetails(wName);
            return (
              <div 
                key={wName} 
                className="group cursor-pointer"
                onClick={() => selectInstitute(wName.toLowerCase())}
              >
                <Card 
                  hoverEffect 
                  className={`h-full border border-slate-900 bg-slate-900/40 p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden backdrop-blur-md ${details.borderColor}`}
                >
                  {/* Subtle top gradient glow on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${details.gradient} opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none`} />

                  <div className="relative z-10 space-y-4">
                    <div className="text-4xl w-14 h-14 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center shadow-lg">
                      {details.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">
                        {details.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        {details.description}
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10 mt-6 flex justify-end">
                    <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all duration-300">
                      Enter Database →
                    </span>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Add Custom Workspace Form */}
        <div className="max-w-md mx-auto w-full">
          <Card className="border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-md shadow-xl">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              ➕ Create Custom Workspace or Class
            </h3>
            {error && (
              <p className="text-xs text-red-400 mb-3 flex gap-1 items-center">
                <span>⚠️</span> {error}
              </p>
            )}
            <form onSubmit={handleAddWorkspace} className="flex gap-2">
              <div className="flex-grow">
                <Input
                  id="customWorkspace"
                  placeholder="e.g. Yoga Class, Karate Dojo"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                  className="h-9"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4"
              >
                Add
              </Button>
            </form>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 z-10">
        Signed in as <span className="text-slate-400 font-medium">{user?.email || user?.username}</span>
      </footer>
    </div>
  );
}
