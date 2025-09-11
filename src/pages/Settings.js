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
    <div className="app-container">
      <div className="app-content fade-in">
        <div className="card-header">
          <button onClick={onBack} className="btn btn-secondary hover-lift">
            ← Back to Main
          </button>
          <h1 className="card-title gradient-text">⚙️ Settings</h1>
          <div></div>
        </div>

        <div style={{maxWidth: '500px', margin: '0 auto'}}>
          <div className="card hover-lift">
            <h2 className="card-title">🔐 Change PIN</h2>
          
            <div className="form-group">
              <label className="form-label">Current PIN:</label>
              <input
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                maxLength="4"
                className="form-input"
                placeholder="Enter current PIN"
              />
            </div>

            <div className="form-group">
              <label className="form-label">New PIN:</label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                maxLength="4"
                className="form-input"
                placeholder="Enter new 4-digit PIN"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New PIN:</label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                maxLength="4"
                className="form-input"
                placeholder="Confirm new PIN"
              />
            </div>

            {message && (
              <div className={message.includes('successfully') ? 'status-success' : 'status-error'} style={{marginBottom: 'var(--spacing-lg)'}}>
                {message.includes('successfully') ? '✅' : '⚠️'} {message}
              </div>
            )}

            <button
              onClick={handleChangePIN}
              className="btn btn-primary hover-lift"
              style={{width: '100%', padding: 'var(--spacing-lg)'}}
            >
              🔄 Change PIN
            </button>
          </div>

          <div className="card hover-lift">
            <h2 className="card-title">👤 Account</h2>
            <button
              onClick={handleLogout}
              className="btn btn-danger hover-lift"
              style={{width: '100%', padding: 'var(--spacing-lg)'}}
            >
              🚪 Logout
            </button>
          </div>
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
