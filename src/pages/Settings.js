import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const Settings = ({ onBack, instituteType }) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');
  const [defaultFee, setDefaultFee] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/settings/defaultFee?instituteType=${instituteType}`)
      .then(res => res.json())
      .then(data => setDefaultFee(data.value || ''))
      .catch(e => console.error('Could not load settings', e));
  }, [instituteType]);

  const handleSetDefaultFee = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settings`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'defaultFee', value: defaultFee, instituteType })
        });
      if (response.ok) {
        setMessage('Default fee updated successfully!');
      } else {
        setMessage('Failed to update default fee');
      }
    } catch (e) {
      setMessage('Error: Server not available');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePIN = async () => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id;

      // Get current PIN from server
      const response = await fetch(`${API_BASE_URL}/pin?userId=${userId}`);
      const data = await response.json();
      
      if (currentPin !== data.pin) {
        setMessage('Current PIN is incorrect');
        setIsLoading(false);
        return;
      }
      
      if (newPin.length !== 4) {
        setMessage('New PIN must be 4 digits');
        setIsLoading(false);
        return;
      }
      
      if (newPin !== confirmPin) {
        setMessage('New PIN and confirmation do not match');
        setIsLoading(false);
        return;
      }
      
      // Update PIN on server
      const updateResponse = await fetch(`${API_BASE_URL}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin, userId })
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="app-container">
      <div className="app-content fade-in">
        <div className="card-header">
          <button onClick={onBack} className="btn btn-secondary hover-lift">
            ← Back
          </button>
          <h1 className="card-title gradient-text">Settings</h1>
          <div style={{ width: '60px' }}></div>
        </div>

        <div className="card" style={{maxWidth: '600px', margin: '0 auto'}}>
          {message && (
            <div style={{
              backgroundColor: message.includes('successfully') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: message.includes('successfully') ? 'var(--success)' : 'var(--danger)',
              padding: '12px',
              borderRadius: 'var(--radius)',
              marginBottom: '25px',
              textAlign: 'center',
              border: `1px solid ${message.includes('successfully') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
            }}>
              {message.includes('successfully') ? '✅' : '⚠️'} {message}
            </div>
          )}

          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', borderBottom: '2px solid var(--border)', paddingBottom: '10px' }}>
              💰 Fee Settings
            </h3>
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '14px'}}>Default Monthly Fee</label>
              <input
                type="number"
                value={defaultFee}
                onChange={(e) => setDefaultFee(e.target.value)}
                className="form-input"
                placeholder="Enter amount"
                style={{width: '100%', marginBottom: '15px'}}
              />
              <button onClick={handleSetDefaultFee} className="btn btn-primary hover-lift" style={{width: '100%'}}>
                Save Fee Setting
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', borderBottom: '2px solid var(--border)', paddingBottom: '10px' }}>
              🔐 Security
            </h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '14px'}}>Current PIN</label>
              <input
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                maxLength="4"
                className="form-input"
                placeholder="Enter current 4-digit PIN"
                style={{width: '100%'}}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '14px'}}>New PIN</label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                maxLength="4"
                className="form-input"
                placeholder="Enter new 4-digit PIN"
                style={{width: '100%'}}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '14px'}}>Confirm New PIN</label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                maxLength="4"
                className="form-input"
                placeholder="Confirm new PIN"
                style={{width: '100%', marginBottom: '15px'}}
              />
              <button onClick={handleChangePIN} className="btn btn-primary hover-lift" style={{width: '100%'}}>
                Update PIN
              </button>
            </div>
          </div>

          <div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', borderBottom: '2px solid var(--border)', paddingBottom: '10px' }}>
              👤 Account
            </h3>
            <button 
              onClick={handleLogout}
              className="btn btn-danger hover-lift"
              style={{width: '100%'}}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
