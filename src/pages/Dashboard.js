import React, { useState, useEffect } from 'react';

const Dashboard = ({ onBack }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Fetch dashboard data
    Promise.all([
      fetch(`${window.location.protocol}//${window.location.hostname}:3001/students`),
      fetch(`${window.location.protocol}//${window.location.hostname}:3001/absent-students`)
    ])
    .then(([studentsRes, absentRes]) => Promise.all([studentsRes.json(), absentRes.json()]))
    .then(([students, absentStudents]) => {
      const today = new Date().toISOString().split('T')[0];
      const todayAbsent = absentStudents.filter(s => s.absent_date === today);
      
      setStats({
        totalStudents: students.length,
        presentToday: students.length - todayAbsent.length,
        absentToday: todayAbsent.length,
        attendanceRate: students.length > 0 ? ((students.length - todayAbsent.length) / students.length * 100).toFixed(1) : 0
      });
      
      setRecentActivity(absentStudents.slice(-5).reverse());
    })
    .catch(e => console.error('Error loading dashboard:', e));
  }, []);

  return (
    <div className="app-container">
      <div className="app-content fade-in">
        <div className="card-header">
          <button onClick={onBack} className="btn btn-secondary hover-lift">
            ← Back to Main
          </button>
          <h1 className="card-title gradient-text">📊 Dashboard</h1>
          <div></div>
        </div>

        {/* Stats Cards */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)'}}>
          <div className="card hover-lift">
            <div className="flex items-center gap-3">
              <div style={{fontSize: '32px'}}>👥</div>
              <div>
                <h3 style={{margin: 0, fontSize: '24px', color: 'var(--primary)'}}>{stats.totalStudents}</h3>
                <p style={{margin: 0, color: 'var(--text-secondary)'}}>Total Students</p>
              </div>
            </div>
          </div>
          
          <div className="card hover-lift">
            <div className="flex items-center gap-3">
              <div style={{fontSize: '32px'}}>✅</div>
              <div>
                <h3 style={{margin: 0, fontSize: '24px', color: 'var(--success)'}}>{stats.presentToday}</h3>
                <p style={{margin: 0, color: 'var(--text-secondary)'}}>Present Today</p>
              </div>
            </div>
          </div>
          
          <div className="card hover-lift">
            <div className="flex items-center gap-3">
              <div style={{fontSize: '32px'}}>❌</div>
              <div>
                <h3 style={{margin: 0, fontSize: '24px', color: 'var(--danger)'}}>{stats.absentToday}</h3>
                <p style={{margin: 0, color: 'var(--text-secondary)'}}>Absent Today</p>
              </div>
            </div>
          </div>
          
          <div className="card hover-lift">
            <div className="flex items-center gap-3">
              <div style={{fontSize: '32px'}}>📈</div>
              <div>
                <h3 style={{margin: 0, fontSize: '24px', color: 'var(--info)'}}>{stats.attendanceRate}%</h3>
                <p style={{margin: 0, color: 'var(--text-secondary)'}}>Attendance Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="card-title">🕒 Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-center text-secondary">No recent activity</p>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between" style={{padding: 'var(--spacing-md)', background: 'var(--border-light)', borderRadius: 'var(--radius)'}}>
                  <div className="flex items-center gap-3">
                    <span style={{fontSize: '20px'}}>❌</span>
                    <div>
                      <strong>{activity.student_name}</strong> was marked absent
                      <div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>
                        {new Date(activity.absent_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;