import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { loginUser } = useAppContext();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle standard callback response when Google credential is piped back
  const handleGoogleCallback = async (response) => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Posting Google Credential to backend verification endpoint...');
      const res = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        loginUser(data.user);
        console.log('Google login session initialized successfully!');
        // Google auth pathways default strictly to Faculty selections dashboard
        navigate('/departments');
      } else {
        setError(data.error || 'Google Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Google Sign-In connection failed:', err);
      setError('Connection to authorization server failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mount Google branded pill button dynamically on load
  useEffect(() => {
    let active = true;
    
    const initGoogleSignIn = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/config');
        const data = await res.json();
        
        if (res.ok && data.success && data.googleClientId) {
          if (!active) return;
          
          // Poll for GIS client availability
          const checkGsiAvailable = setInterval(() => {
            if (window.google && window.google.accounts && window.google.accounts.id) {
              clearInterval(checkGsiAvailable);
              
              window.google.accounts.id.initialize({
                client_id: data.googleClientId,
                callback: handleGoogleCallback,
                cancel_on_tap_outside: true
              });
              
              const btnContainer = document.getElementById('google-signin-btn');
              if (btnContainer) {
                window.google.accounts.id.renderButton(
                  btnContainer,
                  { 
                    theme: 'outline', 
                    size: 'large', 
                    width: 370,
                    text: 'continue_with',
                    shape: 'pill'
                  }
                );
              }
            }
          }, 150);
        }
      } catch (err) {
        console.error('Failed to configure Google client credentials:', err);
      }
    };
    
    initGoogleSignIn();
    
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();

      if (res.ok && data.success) {
        loginUser(data.user);
        // Redirect based on role
        if (data.user.role === 'Admin' || data.user.role === 'SYSTEM_OWNER') {
          navigate('/admin');
        } else {
          navigate('/departments');
        }
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection to server failed. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 800 }}>Sign In</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back to Course File Generator</p>
        </div>

        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            backgroundColor: '#fee2e2', 
            color: '#b91c1c', 
            padding: '0.75rem 1rem', 
            borderRadius: 'var(--radius-sm)', 
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={16} /> Username
            </label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={16} /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className="input-field" 
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Sign In <ArrowRight size={18} /></span>}
          </button>
        </form>

        {/* Separator and Google Button Container */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }}></div>
          <span style={{ padding: '0 0.75rem', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '0.5rem' }}>
          <div id="google-signin-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register here</Link>
        </div>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: 'rgba(79, 70, 229, 0.05)', 
          borderRadius: 'var(--radius-sm)', 
          fontSize: '0.8rem', 
          color: 'var(--text-secondary)',
          lineHeight: '1.5'
        }}>
          <strong>Demo Accounts:</strong><br />
          • Faculty: <code>faculty</code> / <code>faculty123</code><br />
          • Administrator: <code>admin</code> / <code>admin123</code>
        </div>
      </div>
    </div>
  );
};

export default Login;
