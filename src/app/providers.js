'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { API_BASE_URL } from '../config';

const AppContext = createContext();

export function Providers({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [workspaces, setWorkspaces] = useState(['gym', 'school', 'college', 'other']);
  const [theme, setTheme] = useState('dark'); // default theme is dark
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isMounted, setIsMounted] = useState(false);

  // Hydrate states from localStorage after mounting
  useEffect(() => {
    setIsMounted(true);
    const loginStatus = localStorage.getItem('isLoggedIn') === 'true';
    const storedUserStr = localStorage.getItem('user');
    const storedInstitute = localStorage.getItem('selectedInstitute');
    const savedTheme = localStorage.getItem('theme') || 'dark';

    setTheme(savedTheme);

    if (loginStatus && storedUserStr) {
      const storedUser = JSON.parse(storedUserStr);
      setIsLoggedIn(true);
      setUser(storedUser);
      setWorkspaces(storedUser.workspaces || ['gym', 'school', 'college', 'other']);
      if (storedInstitute) {
        setSelectedInstitute(storedInstitute);
      }
    }
  }, []);

  // Update theme class on HTML element
  useEffect(() => {
    if (!isMounted) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme, isMounted]);

  // Route guards
  useEffect(() => {
    if (!isMounted) return;

    const publicRoutes = ['/login', '/register'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isLoggedIn && !isPublicRoute) {
      router.push('/login');
    } else if (isLoggedIn) {
      if (isPublicRoute) {
        router.push('/');
      } else if (!selectedInstitute && pathname !== '/selector') {
        router.push('/selector');
      }
    }
  }, [isLoggedIn, selectedInstitute, pathname, isMounted]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = (userData) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
    setWorkspaces(userData.workspaces || ['gym', 'school', 'college', 'other']);
    router.push('/selector');
  };

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedInstitute');
    setIsLoggedIn(false);
    setUser(null);
    setSelectedInstitute(null);
    router.push('/login');
  };

  const selectInstitute = (inst) => {
    localStorage.setItem('selectedInstitute', inst);
    setSelectedInstitute(inst);
    router.push('/');
  };

  const addWorkspace = async (newWorkspaceName) => {
    if (!user) return false;
    
    // Trim and normalize workspace name
    const normalized = newWorkspaceName.trim();
    if (!normalized || workspaces.includes(normalized)) return false;

    const updatedWorkspaces = [...workspaces, normalized];

    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}/workspaces`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaces: updatedWorkspaces })
      });

      if (response.ok) {
        const updatedUser = { ...user, workspaces: updatedWorkspaces };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setWorkspaces(updatedWorkspaces);
        return true;
      }
    } catch (e) {
      console.error('Error adding custom workspace:', e);
    }
    
    // Fallback local update if offline or server fails
    const updatedUser = { ...user, workspaces: updatedWorkspaces };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setWorkspaces(updatedWorkspaces);
    return true;
  };

  if (!isMounted) {
    // Return empty shell during SSR to prevent hydration flicker
    return <div className="min-h-screen bg-slate-950"></div>;
  }

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        user,
        selectedInstitute,
        workspaces,
        theme,
        toggleTheme,
        login,
        logout,
        selectInstitute,
        addWorkspace,
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
