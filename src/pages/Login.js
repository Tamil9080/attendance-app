import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [isPinLogin, setIsPinLogin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      let url = `${API_BASE_URL}/login`;
      let body = { email, password };

      if (isPinLogin) {
        url = `${API_BASE_URL}/pin-login`;
        body = { email, pin };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin();
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (e) {
      // Fallback to hardcoded login if server is not running
      if (email === 'admin' && (password === 'admin123' || pin === '1234')) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify({ id: 1, username: 'admin' }));
        onLogin();
      } else {
        setError('Server not running. Use admin/admin123 or start the server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '50px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <div style={{ 
            fontSize: '56px', 
            marginBottom: '15px',
            background: 'var(--bg-secondary)',
            width: '100px',
            height: '100px',
            lineHeight: '100px',
            borderRadius: '50%',
            margin: '0 auto 20px',
            boxShadow: 'var(--shadow-sm)'
          }}>🥋</div>
          <h1 className="gradient-text" style={{ margin: '10px 0', fontSize: '28px' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>Sign in to manage attendance</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="text"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {!isPinLogin ? (
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required={!isPinLogin}
              />
            </div>
          ) : (
            <div className="form-group">
              <label>4-Digit PIN</label>
              <input
                type="password"
                className="form-input"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                }}
                placeholder="Enter your PIN"
                maxLength="4"
                style={{ letterSpacing: '4px', textAlign: 'center' }}
                required={isPinLogin}
              />
            </div>
          )}

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

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', padding: '14px', fontSize: '16px' }}
          >
            {isLoading ? 'Signing in...' : (isPinLogin ? 'Sign In with PIN' : 'Sign In')}
          </button>
          
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsPinLogin(!isPinLogin);
                setError('');
                setPassword('');
                setPin('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'underline'
              }}
            >
              {isPinLogin ? 'Use Password instead' : 'Use PIN instead'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '15px', color: 'var(--text-secondary)' }}>
            Don't have an account? <Link to="/register" style={{ 
              color: 'var(--primary)', 
              fontWeight: '600', 
              textDecoration: 'none' 
            }}>Create Account</Link>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          fontSize: '13px',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)'
        }}>
          <strong>Demo Credentials:</strong><br />
          Email: admin<br />
          Password: admin123
        </div>
      </div>
    </div>
  );
};

export default Login;