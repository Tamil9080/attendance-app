'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '@/app/providers';
import { API_BASE_URL } from '@/config';
import Card from '@/components/ui/Card';
import TiltCard from '@/components/ui/TiltCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Calendar, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { selectedInstitute, user, selectedMonth, selectedYear } = useApp();
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0
  });
  const [students, setStudents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (!selectedInstitute || !user) return;

    setIsLoading(true);
    // Fetch dashboard stats from backend
    Promise.all([
      fetch(`${API_BASE_URL}/students?userId=${user.id}&instituteType=${selectedInstitute}`),
      fetch(`${API_BASE_URL}/absent-students?userId=${user.id}&instituteType=${selectedInstitute}`)
    ])
    .then(([studentsRes, absentRes]) => Promise.all([studentsRes.json(), absentRes.json()]))
    .then(([loadedStudents, absentStudents]) => {
      const studentList = Array.isArray(loadedStudents) ? loadedStudents : [];
      const absentList = Array.isArray(absentStudents) ? absentStudents : [];
      const today = new Date().toISOString().split('T')[0];
      const todayAbsent = absentList.filter(s => s.absent_date === today);

      setStudents(studentList);
      setStats({
        totalStudents: studentList.length,
        presentToday: Math.max(0, studentList.length - todayAbsent.length),
        absentToday: todayAbsent.length,
        attendanceRate: studentList.length > 0 ? ((studentList.length - todayAbsent.length) / studentList.length * 100).toFixed(1) : 0
      });
      setRecentActivity(absentList.slice(0, 5));
    })
    .catch(e => console.error('Error loading dashboard stats:', e))
    .finally(() => setIsLoading(false));
  }, [selectedInstitute, user]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  const handleQuickCheckInAll = async () => {
    // Implement check in all active students for today
    triggerConfetti();
    alert('Mock Action: Checked-in all students for today! (Saves automatically as present)');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/20 p-6 rounded-xl border border-border">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Welcome back, {user?.username || 'Admin'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here is a summary of your workspace attendance for {monthNames[selectedMonth]} {selectedYear}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleQuickCheckInAll}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9"
          >
            ⚡ Quick Check-In All
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { title: 'Present Today', value: stats.presentToday, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { title: 'Absent Today', value: stats.absentToday, icon: UserX, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { title: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: TrendingUp, color: 'text-sky-500', bg: 'bg-sky-500/10' }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <TiltCard key={idx} className="border border-border bg-card p-5 select-none relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.title}</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">{isLoading ? '...' : card.value}</h3>
                </div>
                <div className={`p-2.5 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </TiltCard>
          );
        })}
      </div>

      {/* Grid Layout for Heatmap & Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Heatmap & Check-in Widget */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border bg-card">
            <Card.Header>
              <Card.Title>📅 Scoped Attendance Heatmap</Card.Title>
              <Card.Description>Monthly distribution density of active registers.</Card.Description>
            </Card.Header>
            <Card.Content>
              {isLoading ? (
                <div className="h-44 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Attendance Density Grid */}
                  <div className="grid grid-cols-7 gap-2 max-w-lg">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <div key={idx} className="text-center text-xs font-semibold text-muted-foreground py-1">{day}</div>
                    ))}
                    {Array.from({ length: 31 }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const hasClass = dayNum % 7 === 0; // Simulated class days (Sundays)
                      return (
                        <div
                          key={idx}
                          className={`aspect-square rounded flex items-center justify-center text-xs font-medium border border-border/40 cursor-default select-none ${
                            hasClass 
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                          title={`Day ${dayNum}`}
                        >
                          {dayNum}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" /> Active Session</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted border border-border/40" /> Off Day</span>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-6">
          <Card className="border border-border bg-card h-full flex flex-col">
            <Card.Header>
              <Card.Title>🕒 Recent Absences</Card.Title>
              <Card.Description>Recent absent timeline records.</Card.Description>
            </Card.Header>
            <Card.Content className="flex-grow">
              {isLoading ? (
                <div className="h-44 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm space-y-2">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p>100% Attendance recorded today!</p>
                </div>
              ) : (
                <div className="space-y-4 relative pl-4 border-l border-border/80">
                  {recentActivity.map((act, idx) => (
                    <div key={idx} className="relative group space-y-1">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-card" />
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-foreground leading-none">{act.student_name}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(act.absent_date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Reason: {act.reason || 'None specified'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}
