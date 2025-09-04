import React, { useState } from 'react';

const Settings = ({ onBack }) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');

  const handleChangePIN = () => {
    const savedPin = localStorage.getItem('appPin') || '1234';
    
    if (currentPin !== savedPin) {
      setMessage('Current PIN is incorrect');
      return;
    }
    
    if (newPin.length !== 4) {
      setMessage('New PIN must be 4 digits');
      return;
    }
    
    if (newPin !== confirmPin) {
      setMessage('New PIN and confirmation do not match');
      return;
    }
    
    localStorage.setItem('appPin', newPin);
    setMessage('PIN changed successfully!');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    window.location.reload();
  };

  return (
    <div style={{padding: '20px', fontFamily: 'Arial, sans-serif'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
        <button
          onClick={onBack}
          style={{padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
        >
          Back to Main
        </button>
        <h1 style={{margin: 0}}>Settings</h1>
        <div></div>
      </div>

      <div style={{maxWidth: '400px', margin: '0 auto'}}>
        <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px'}}>
          <h2 style={{marginTop: 0}}>Change PIN</h2>
          
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Current PIN:</label>
            <input
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              maxLength="4"
              style={{width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px'}}
            />
          </div>

          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>New PIN:</label>
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              maxLength="4"
              style={{width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px'}}
            />
          </div>

          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Confirm New PIN:</label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              maxLength="4"
              style={{width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px'}}
            />
          </div>

          {message && (
            <div style={{
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
              backgroundColor: message.includes('successfully') ? '#d1fae5' : '#fee2e2',
              color: message.includes('successfully') ? '#065f46' : '#dc2626'
            }}>
              {message}
            </div>
          )}

          <button
            onClick={handleChangePIN}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Change PIN
          </button>
        </div>

        <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
          <h2 style={{marginTop: 0}}>Account</h2>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;