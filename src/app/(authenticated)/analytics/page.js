'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/providers';
import { API_BASE_URL } from '@/config';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { BarChart3, Star, ArrowUpRight, ShieldAlert, Award } from 'lucide-react';

export default function AnalyticsPage() {
  const { selectedInstitute, user } = useApp();

  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedInstitute || !user) return;

    setIsLoading(true);
    fetch(`${API_BASE_URL}/students?userId=${user.id}&instituteType=${selectedInstitute}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStudents(data);
          calculateAnalytics(data);
        } else {
          setStudents([]);
          setAnalytics([]);
        }
      })
      .catch(e => console.error('Error loading students:', e))
      .finally(() => setIsLoading(false));
  }, [selectedInstitute, user, selectedPeriod]);

  const calculateAnalytics = (studentsData) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    const computed = studentsData.map(student => {
      let totalClasses = 0;
      let attendedClasses = 0;
      let streak = 0;
      let maxStreak = 0;
      let currentStreak = 0;

      const currentDate = new Date();
      const monthsToCheck = selectedPeriod === 'month' ? 1 : 3;

      for (let i = 0; i < monthsToCheck; i++) {
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = `${monthNames[checkDate.getMonth()]}-${checkDate.getFullYear()}`;
        const monthAttendance = student.attendance?.[monthKey] || {};

        Object.entries(monthAttendance).forEach(([day, status]) => {
          totalClasses++;
          if (status === true) {
            attendedClasses++;
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        });
      }

      const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses * 100).toFixed(1) : 0;
      
      let rating = 'good';
      if (attendanceRate >= 80) rating = 'excellent';
      else if (attendanceRate < 60) rating = 'critical';

      return {
        ...student,
        totalClasses,
        attendedClasses,
        attendanceRate: parseFloat(attendanceRate),
        maxStreak,
        rating
      };
    });

    // Sort by attendance rate (highest to lowest)
    computed.sort((a, b) => b.attendanceRate - a.attendanceRate);
    setAnalytics(computed);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Performance metrics, streaks, and attendance stats.
          </p>
        </div>
        <div className="flex bg-muted rounded-lg p-1 border border-border">
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold select-none transition-all ${
              selectedPeriod === 'month' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Current Month
          </button>
          <button
            onClick={() => setSelectedPeriod('3months')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold select-none transition-all ${
              selectedPeriod === '3months' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Last 3 Months
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Excellent Attendance (80%+) */}
        <Card className="border border-border bg-card p-5 flex gap-4 items-start select-none">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              {isLoading ? '...' : analytics.filter(s => s.attendanceRate >= 80).length}
            </h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
              Excellent Performers (80%+)
            </p>
          </div>
        </Card>

        {/* Good Attendance (60%-80%) */}
        <Card className="border border-border bg-card p-5 flex gap-4 items-start select-none">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              {isLoading ? '...' : analytics.filter(s => s.attendanceRate >= 60 && s.attendanceRate < 80).length}
            </h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
              Steady Performers (60%-80%)
            </p>
          </div>
        </Card>

        {/* Needs Improvement (<60%) */}
        <Card className="border border-border bg-card p-5 flex gap-4 items-start select-none">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              {isLoading ? '...' : analytics.filter(s => s.attendanceRate < 60).length}
            </h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
              Critical Attention (&lt;60%)
            </p>
          </div>
        </Card>
      </div>

      {/* Detailed Analytics List */}
      <Card className="border border-border bg-card overflow-hidden">
        <Card.Header>
          <div className="flex items-center gap-2 text-indigo-500 mb-2">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Analytics table</span>
          </div>
          <Card.Title>Performance Directory</Card.Title>
        </Card.Header>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-900/10 dark:bg-slate-900/50">
                <th className="p-4 text-sm font-semibold text-muted-foreground">Student Name</th>
                <th className="p-4 text-center text-sm font-semibold text-muted-foreground">Attended Sessions</th>
                <th className="p-4 text-center text-sm font-semibold text-muted-foreground">Total Sessions</th>
                <th className="p-4 text-center text-sm font-semibold text-muted-foreground">Max Streak</th>
                <th className="p-4 text-center text-sm font-semibold text-muted-foreground">Attendance Rate</th>
                <th className="p-4 text-center text-sm font-semibold text-muted-foreground w-36">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">Calculating statistics...</span>
                    </div>
                  </td>
                </tr>
              ) : analytics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                    No active students found to compute analytics.
                  </td>
                </tr>
              ) : (
                analytics.map(student => (
                  <tr key={student.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors">
                    {/* Student Name */}
                    <td className="p-4 font-semibold text-sm text-foreground">
                      {student.firstName} {student.lastName}
                    </td>

                    {/* Attended */}
                    <td className="p-4 text-center text-sm text-foreground">
                      {student.attendedClasses}
                    </td>

                    {/* Total */}
                    <td className="p-4 text-center text-sm text-foreground">
                      {student.totalClasses}
                    </td>

                    {/* Max Streak */}
                    <td className="p-4 text-center text-sm text-foreground font-semibold">
                      🔥 {student.maxStreak}
                    </td>

                    {/* Rate */}
                    <td className="p-4 text-center text-sm font-bold text-foreground">
                      {student.attendanceRate}%
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 text-center">
                      <Badge
                        variant={
                          student.rating === 'excellent'
                            ? 'success'
                            : student.rating === 'critical'
                            ? 'danger'
                            : 'warning'
                        }
                        className="capitalize"
                      >
                        {student.rating === 'excellent'
                          ? 'Excellent'
                          : student.rating === 'critical'
                          ? 'Critical'
                          : 'Good'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
