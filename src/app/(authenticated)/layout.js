'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/app/providers';
import { 
  LayoutDashboard, 
  UserPlus, 
  Zap, 
  CalendarDays, 
  UserMinus, 
  UserX, 
  CreditCard, 
  TrendingUp, 
  Bell, 
  Settings, 
  RefreshCw, 
  LogOut,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function AuthenticatedLayout({ children }) {
  const pathname = usePathname();
  const { 
    selectedInstitute, 
    theme, 
    toggleTheme, 
    logout, 
    selectInstitute 
  } = useApp();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Add Student', path: '/add-student', icon: UserPlus },
    { name: 'Bulk Operations', path: '/bulk', icon: Zap },
    { name: 'Attendance Register', path: '/history', icon: CalendarDays },
    { name: 'Absent Students', path: '/absent', icon: UserMinus },
    { name: 'Inactive Students', path: '/inactive', icon: UserX },
    { name: 'Fees Management', path: '/fees', icon: CreditCard },
    { name: 'Analytics', path: '/analytics', icon: TrendingUp },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const getWorkspaceLabel = () => {
    if (!selectedInstitute) return 'Select Workspace';
    const presets = {
      gym: '🏋️‍♂️ Gym',
      school: '🏫 School',
      college: '🎓 College',
      other: '🏢 Other'
    };
    return presets[selectedInstitute.toLowerCase()] || `🏢 ${selectedInstitute}`;
  };

  const handleSwitchWorkspace = () => {
    selectInstitute(null); // Triggers redirect back to selector
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300 w-64">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800 bg-slate-950/20">
        <span className="text-xl" role="img" aria-label="calendar">📅</span>
        <span className="font-bold text-sm tracking-wider text-slate-100 uppercase">
          Attendance.io
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 select-none group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                  : 'hover:bg-slate-800 hover:text-slate-100 text-slate-400'
              }`}
            >
              <Icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer controls */}
      <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/10">
        <button
          onClick={handleSwitchWorkspace}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all select-none"
        >
          <RefreshCw className="h-4 w-4" />
          Switch Workspace
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all select-none"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:block flex-shrink-0 h-full">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar (animated slide-in) */}
      <div className={`fixed inset-y-0 left-0 z-50 transform md:hidden transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 border-b border-border bg-card px-6">
          {/* Left panel header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="inline-flex items-center rounded-lg bg-indigo-600/10 border border-indigo-600/20 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              {getWorkspaceLabel()}
            </span>
          </div>

          {/* Right panel header */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Dynamic Route View Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
