import React from 'react';

const InstituteSelector = ({ onSelect }) => {
  const options = [
    {
      id: 'gym',
      title: 'Gym & Fitness',
      description: 'Manage members, personal training, and workout attendance',
      icon: '🏋️‍♂️',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.2) 100%)',
      borderColor: 'rgba(16, 185, 129, 0.3)'
    },
    {
      id: 'school',
      title: 'School / Academy',
      description: 'Track student rolls, classes, schedules, and reports',
      icon: '🏫',
      gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.2) 100%)',
      borderColor: 'rgba(99, 102, 241, 0.3)'
    },
    {
      id: 'college',
      title: 'College / University',
      description: 'Manage courses, lectures, semesters, and attendance logs',
      icon: '🎓',
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.2) 100%)',
      borderColor: 'rgba(139, 92, 246, 0.3)'
    },
    {
      id: 'other',
      title: 'Other Institute',
      description: 'General attendance workspace for custom events, organizations, and seminars',
      icon: '🏢',
      gradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(14, 165, 233, 0.2) 100%)',
      borderColor: 'rgba(14, 165, 233, 0.3)'
    }
  ];

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '90vh', display: 'flex', padding: '20px' }}>
      <div className="app-content fade-in" style={{ width: '100%', maxWidth: '800px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h1 className="gradient-text" style={{ fontSize: '32px', marginBottom: '10px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Choose Workspace
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Select the institute database you want to manage attendance for
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {options.map((opt) => (
            <div
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="card hover-lift"
              style={{
                cursor: 'pointer',
                background: opt.gradient,
                borderColor: opt.borderColor,
                padding: '30px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '20px',
                margin: 0,
                borderWidth: '2px',
                borderRadius: '16px'
              }}
            >
              <div style={{
                fontSize: '44px',
                background: 'var(--bg-card)',
                padding: '12px',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-sm)',
                lineHeight: 1
              }}>{opt.icon}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--text-primary)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif'
                }}>{opt.title}</h3>
                <p style={{
                  fontSize: '13px',
                  lineHeight: '1.5',
                  margin: 0,
                  color: 'var(--text-secondary)'
                }}>{opt.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstituteSelector;
