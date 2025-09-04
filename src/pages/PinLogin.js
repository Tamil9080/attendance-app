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
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '95%',
        maxWidth: '320px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <span style={{ fontSize: '48px' }}>🥋</span>
          <h1 style={{ margin: '10px 0', color: '#991b1b' }}>Attendance App</h1>
          <p style={{ color: '#666', margin: 0 }}>Enter PIN to continue</p>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: i < pin.length ? '#991b1b' : '#ddd'
            }} />
          ))}
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
            <button
              key={digit}
              onClick={() => handlePinInput(digit.toString())}
              style={{
                width: '70px',
                height: '70px',
                fontSize: '24px',
                fontWeight: 'bold',
                backgroundColor: '#f8f9fa',
                border: '2px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleClear}
            style={{
              width: '70px',
              height: '70px',
              fontSize: '16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
          <button
            onClick={() => handlePinInput('0')}
            style={{
              width: '70px',
              height: '70px',
              fontSize: '24px',
              fontWeight: 'bold',
              backgroundColor: '#f8f9fa',
              border: '2px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            disabled={pin.length !== 4}
            style={{
              width: '70px',
              height: '70px',
              fontSize: '16px',
              backgroundColor: pin.length === 4 ? '#059669' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: pin.length === 4 ? 'pointer' : 'not-allowed'
            }}
          >
            Enter
          </button>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: '#f0f9ff',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#0369a1'
        }}>
          <strong>Default PIN: 1234</strong><br/>
          Change PIN in Settings after login
        </div>
      </div>
    </div>
  );
};

export default PinLogin;