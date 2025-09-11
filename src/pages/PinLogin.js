import React, { useState, useEffect } from 'react';

const PinLogin = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePinInput = (digit) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:3001/pin`);
      const data = await response.json();
      
      if (pin === data.pin) {
        localStorage.setItem('isLoggedIn', 'true');
        onLogin();
      } else {
        setError('Invalid PIN');
        setPin('');
      }
    } catch (e) {
      // Fallback to default PIN if server not available
      if (pin === '1234') {
        localStorage.setItem('isLoggedIn', 'true');
        onLogin();
      } else {
        setError('Invalid PIN (server offline)');
        setPin('');
      }
    }
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePinInput(e.key);
      } else if (e.key === 'Enter') {
        if (pin.length === 4) handleSubmit();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pin]);

  return (
    <div className="flex justify-center items-center" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)'
    }}>
      <div className="card hover-lift" style={{
        width: '95%',
        maxWidth: '380px',
        textAlign: 'center',
        padding: 'var(--spacing-2xl)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-xl)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <span className="karate-emoji" style={{ fontSize: '56px', display: 'block', marginBottom: 'var(--spacing-md)' }}>🥋</span>
          <h1 className="gradient-text" style={{ 
            margin: 'var(--spacing-md) 0', 
            fontFamily: 'Poppins, sans-serif',
            fontSize: '28px',
            fontWeight: '700'
          }}>Attendance System</h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            margin: 0,
            fontSize: '14px',
            fontWeight: '500'
          }}>Enter your PIN to continue</p>
        </div>

        <div className="flex justify-center gap-2" style={{
          marginBottom: 'var(--spacing-xl)'
        }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="transition" style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: i < pin.length ? 'var(--primary)' : 'var(--border)',
              boxShadow: i < pin.length ? 'var(--shadow-sm)' : 'none',
              transform: i < pin.length ? 'scale(1.1)' : 'scale(1)'
            }} />
          ))}
        </div>

        {error && (
          <div className="status-error" style={{
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius)',
            marginBottom: 'var(--spacing-xl)',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-xl)'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
            <button
              key={digit}
              onClick={() => handlePinInput(digit.toString())}
              className="btn-secondary hover-lift"
              style={{
                width: '70px',
                height: '70px',
                fontSize: '20px',
                fontWeight: '600',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="btn-danger hover-lift"
            style={{
              width: '70px',
              height: '70px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: 'var(--radius-md)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Clear
          </button>
          <button
            onClick={() => handlePinInput('0')}
            className="btn-secondary hover-lift"
            style={{
              width: '70px',
              height: '70px',
              fontSize: '20px',
              fontWeight: '600',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            disabled={pin.length !== 4}
            className={pin.length === 4 ? 'btn-success hover-lift' : 'btn-secondary'}
            style={{
              width: '70px',
              height: '70px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: 'var(--radius-md)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              cursor: pin.length === 4 ? 'pointer' : 'not-allowed',
              opacity: pin.length === 4 ? 1 : 0.6
            }}
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinLogin;