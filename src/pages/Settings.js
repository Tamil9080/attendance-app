import React, { useState } from 'react';

const Settings = ({ onBack }) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');

  const handleChangePIN = async () => {
    try {
      // Get current PIN from server
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:3001/pin`);
      const data = await response.json();
      
      if (currentPin !== data.pin) {
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
      
      // Update PIN on server
      const updateResponse = await fetch(`${window.location.protocol}//${window.location.hostname}:3001/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update PIN');
      }
      
      setMessage('PIN changed successfully!');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (e) {
      setMessage('Error: Server not available');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    window.location.reload();
  };

  return (
    <div className="settings-container" style={{padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#1a1a1a', color: '#ffffff', minHeight: '100vh'}}>
      <div className="settings-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
        <button
          onClick={onBack}
          style={{padding: '8px 16px', background: 'linear-gradient(135deg, #6b7280 0%, #4a4845 100%)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
        >
          Back to Main
        </button>
        <h1 style={{margin: 0, color: '#ffffff'}}>Settings</h1>
        <div></div>
      </div>

      <div className="settings-form-container" style={{maxWidth: '400px', margin: '0 auto', padding: '0 20px'}}>
        <div className="settings-card" style={{backgroundColor: '#2d2d2d', padding: '30px', borderRadius: '8px', border: '1px solid #404040', marginBottom: '20px'}}>
          <h2 className="settings-title" style={{marginTop: 0, color: '#ffffff'}}>Change PIN</h2>
          
          <div className="settings-input-group" style={{marginBottom: '15px'}}>
            <label className="settings-label" style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Current PIN:</label>
            <input
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              maxLength="4"
              className="settings-input"
              style={{width: '100%', padding: '10px', border: '2px solid #404040', borderRadius: '4px', backgroundColor: '#1a1a1a', color: '#ffffff'}}
            />
          </div>

          <div className="settings-input-group" style={{marginBottom: '15px'}}>
            <label className="settings-label" style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>New PIN:</label>
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              maxLength="4"
              className="settings-input"
              style={{width: '100%', padding: '10px', border: '2px solid #404040', borderRadius: '4px', backgroundColor: '#1a1a1a', color: '#ffffff'}}
            />
          </div>

          <div className="settings-input-group" style={{marginBottom: '15px'}}>
            <label className="settings-label" style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Confirm New PIN:</label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              maxLength="4"
              className="settings-input"
              style={{width: '100%', padding: '10px', border: '2px solid #404040', borderRadius: '4px', backgroundColor: '#1a1a1a', color: '#ffffff'}}
            />
          </div>

          {message && (
            <div style={{
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
              backgroundColor: message.includes('successfully') ? '#1b2d1b' : '#2d1b1b',
              color: message.includes('successfully') ? '#28a745' : '#dc3545',
              border: '1px solid #404040'
            }}>
              {message}
            </div>
          )}

          <button
            onClick={handleChangePIN}
            className="settings-button"
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
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

        <div className="settings-card" style={{backgroundColor: '#2d2d2d', padding: '30px', borderRadius: '8px', border: '1px solid #404040'}}>
          <h2 className="settings-title" style={{marginTop: 0, color: '#ffffff'}}>Account</h2>
          <button
            onClick={handleLogout}
            className="settings-button"
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #dc3545 0%, #a71d2a 100%)',
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

/* Mobile responsiveness */
const mobileStyles = `
  @media (max-width: 768px) {
    .settings-container {
      padding: 10px !important;
    }
    .settings-header {
      flex-direction: column !important;
      text-align: center !important;
      gap: 10px !important;
    }
    .settings-title {
      font-size: 18px !important;
    }
    .settings-form-container {
      padding: 0 10px !important;
    }
    .settings-card {
      padding: 20px !important;
    }
    .settings-input {
      padding: 8px !important;
      font-size: 16px !important;
    }
    .settings-button {
      padding: 10px !important;
      font-size: 14px !important;
    }
  }
`;

// Inject mobile styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = mobileStyles;
  document.head.appendChild(styleSheet);
}

export default Settings;
