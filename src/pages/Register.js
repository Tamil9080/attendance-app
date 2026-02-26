import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (pin && pin.length !== 4) {
      setError('PIN must be 4 digits');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, phone_number: phoneNumber, pin: pin || '1234' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        navigate('/login');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (e) {
      setError('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '50px' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h2 className="gradient-text" style={{ margin: '0 0 10px 0', fontSize: '28px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>Join us to manage your attendance</p>
        </div>
        
        {error && (
          <div style={{
            backgroundColor: '#fff5f5',
            color: '#c53030',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '14px',
            border: '1px solid #feb2b2'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="form-group">
            <label>4-Digit PIN (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(val);
              }}
              placeholder="Set a 4-digit PIN (Default: 1234)"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', padding: '14px', fontSize: '16px' }}
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '15px', color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ 
              color: 'var(--primary)', 
              fontWeight: '600', 
              textDecoration: 'none' 
            }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
