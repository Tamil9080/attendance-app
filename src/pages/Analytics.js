import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const Analytics = ({ onBack }) => {
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? user.id : null;

    fetch(`${API_BASE_URL}/students?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStudents(data);
          calculateAnalytics(data);
        } else {
          console.error('API error:', data);
          setStudents([]);
        }
      })
      .catch(e => console.error('Error loading students:', e));
  }, [selectedPeriod]);

  const calculateAnalytics = (studentsData) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    const analytics = studentsData.map(student => {
      let totalClasses = 0;
      let attendedClasses = 0;
      let streak = 0;
      let maxStreak = 0;
      let currentStreak = 0;

      // Calculate for current month or last 3 months based on selection
      const currentDate = new Date();
      const monthsToCheck = selectedPeriod === 'month' ? 1 : 3;

      for (let i = 0; i < monthsToCheck; i++) {
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = `${monthNames[checkDate.getMonth()]}-${checkDate.getFullYear()}`;
        const monthAttendance = student.attendance[monthKey] || {};

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
      
      return {
        ...student,
        totalClasses,
        attendedClasses,
        attendanceRate: parseFloat(attendanceRate),
        maxStreak,
        status: attendanceRate >= 80 ? 'excellent' : attendanceRate >= 60 ? 'good' : 'needs-improvement'
      };
    });

    // Sort by attendance rate
    analytics.sort((a, b) => b.attendanceRate - a.attendanceRate);
    setAnalytics(analytics);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'var(--success)';
      case 'good': return 'var(--warning)';
      case 'needs-improvement': return 'var(--danger)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent': return '🏆';
      case 'good': return '👍';
      case 'needs-improvement': return '⚠️';
      default: return '📊';
    }
  };

  return (
    <div className="app-container">
      <div className="app-content fade-in">
        <div className="card-header">
          <button onClick={onBack} className="btn btn-secondary hover-lift">
            ← Back to Main
          </button>
          <h1 className="card-title gradient-text">📈 Analytics</h1>
          <div></div>
        </div>

        {/* Period Selection */}
        <div className="card">
          <div className="flex gap-3 items-center">
            <label className="form-label" style={{margin: 0}}>Analysis Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="form-input"
              style={{minWidth: '150px'}}
            >
              <option value="month">Current Month</option>
              <option value="quarter">Last 3 Months</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)'}}>
          <div className="card hover-lift">
            <div className="text-center">
              <div style={{fontSize: '32px', marginBottom: 'var(--spacing-sm)'}}>🏆</div>
              <h3 style={{color: 'var(--success)', margin: 0}}>
                {analytics.filter(s => s.status === 'excellent').length}
              </h3>
              <p style={{margin: 0, color: 'var(--text-secondary)'}}>Excellent (≥80%)</p>
            </div>
          </div>
          
          <div className="card hover-lift">
            <div className="text-center">
              <div style={{fontSize: '32px', marginBottom: 'var(--spacing-sm)'}}>👍</div>
              <h3 style={{color: 'var(--warning)', margin: 0}}>
                {analytics.filter(s => s.status === 'good').length}
              </h3>
              <p style={{margin: 0, color: 'var(--text-secondary)'}}>Good (60-79%)</p>
            </div>
          </div>
          
          <div className="card hover-lift">
            <div className="text-center">
              <div style={{fontSize: '32px', marginBottom: 'var(--spacing-sm)'}}>⚠️</div>
              <h3 style={{color: 'var(--danger)', margin: 0}}>
                {analytics.filter(s => s.status === 'needs-improvement').length}
              </h3>
              <p style={{margin: 0, color: 'var(--text-secondary)'}}>Needs Improvement (&lt;60%)</p>
            </div>
          </div>
          
          <div className="card hover-lift">
            <div className="text-center">
              <div style={{fontSize: '32px', marginBottom: 'var(--spacing-sm)'}}>📊</div>
              <h3 style={{color: 'var(--info)', margin: 0}}>
                {analytics.length > 0 ? (analytics.reduce((sum, s) => sum + s.attendanceRate, 0) / analytics.length).toFixed(1) : 0}%
              </h3>
              <p style={{margin: 0, color: 'var(--text-secondary)'}}>Average Rate</p>
            </div>
          </div>
        </div>

        {/* Student Analytics Table */}
        <div className="card">
          <h2 className="card-title">Student Performance</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Attendance Rate</th>
                  <th>Classes Attended</th>
                  <th>Max Streak</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((student, index) => (
                  <tr key={student.id}>
                    <td className="text-center">
                      <strong style={{
                        color: index < 3 ? 'var(--primary)' : 'var(--text-secondary)',
                        fontSize: index < 3 ? '18px' : '14px'
                      }}>
                        #{index + 1}
                      </strong>
                    </td>
                    <td className="names">
                      {student.firstName} {student.lastName}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: '60px',
                            height: '8px',
                            background: 'var(--border-light)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              width: `${student.attendanceRate}%`,
                              height: '100%',
                              background: getStatusColor(student.status),
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                        <strong style={{color: getStatusColor(student.status)}}>
                          {student.attendanceRate}%
                        </strong>
                      </div>
                    </td>
                    <td className="text-center">
                      {student.attendedClasses}/{student.totalClasses}
                    </td>
                    <td className="text-center">
                      <span style={{
                        background: student.maxStreak > 5 ? 'var(--success)' : student.maxStreak > 2 ? 'var(--warning)' : 'var(--border-light)',
                        color: student.maxStreak > 2 ? 'white' : 'var(--text-primary)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {student.maxStreak} days
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span>{getStatusIcon(student.status)}</span>
                        <span style={{color: getStatusColor(student.status), fontWeight: '500'}}>
                          {student.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;