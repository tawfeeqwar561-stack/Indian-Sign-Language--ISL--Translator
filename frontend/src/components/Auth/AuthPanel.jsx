import React, { useState } from 'react';
import './AuthPanel.css';

const AuthPanel = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [loginMethod, setLoginMethod] = useState('email'); // 'phone' or 'email'
  const [step, setStep] = useState('credentials'); // signup steps: credentials, otp, profile
  const [forgotStep, setForgotStep] = useState('request'); // forgot steps: request, otp, reset
  
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // ── Authentication Handlers ─────────────────────────────────────

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginMethod === 'email') {
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setError('Invalid email');
      if (password.length < 4) return setError('Password too short');
    } else {
      if (phone.length < 10) return setError('Invalid phone number');
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Mock login: if name/email contains "faculty", assign faculty role
      const isFaculty = email.toLowerCase().includes('faculty') || name.toLowerCase().includes('faculty');
      const user = { 
        phone: loginMethod === 'phone' ? phone : email, 
        name: name || 'User', 
        role: isFaculty ? 'faculty' : 'student', 
        id: '123', 
        loginMethod 
      };
      localStorage.setItem('isl-user', JSON.stringify(user));
      if (onLogin) onLogin(user);
    }, 1000);
  };

  const handleSignUpInit = (e) => {
    e.preventDefault();
    if (loginMethod === 'phone' && phone.length < 10) return setError('Invalid phone');
    if (loginMethod === 'email' && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setError('Invalid email');
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length < 4) return setError('Enter valid OTP');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (authMode === 'signup') setStep('profile');
      else setForgotStep('reset');
    }, 800);
  };

  const handleForgotRequest = (e) => {
    e.preventDefault();
    if (loginMethod === 'email' && !email) return setError('Enter email');
    if (loginMethod === 'phone' && !phone) return setError('Enter phone');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setForgotStep('otp');
    }, 1000);
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    if (newPassword.length < 4) return setError('Password too short');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Password reset successful! Please login.');
      setAuthMode('login');
      setForgotStep('request');
    }, 1000);
  };

  const handleCompleteSignUp = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name');
    setSuccessMsg('Account created successfully! You can now login.');
    setAuthMode('login');
    setStep('credentials');
  };

  // ── Helpers ───────────────────────────────────────────────────

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setError('');
    setSuccessMsg('');
    setStep('credentials');
    setForgotStep('request');
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <svg className="logo-icon-svg" style={{ margin: '0 auto 12px', display: 'block' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.82-2.82L7 15"></path>
          </svg>
          <h2 className="auth-title">ISL Platform</h2>
          <p className="auth-subtitle">
            {authMode === 'login' && 'Welcome back! Sign in to continue'}
            {authMode === 'signup' && 'Create an account to start learning'}
            {authMode === 'forgot' && 'Reset your account password'}
          </p>
        </div>

        <div className="auth-body">
          {successMsg && <div className="auth-success animate-fade-in">{successMsg}</div>}
          
          {/* Method Toggles (Email/Phone) - Only in initial steps */}
          {(authMode === 'login' || (authMode === 'signup' && step === 'credentials') || (authMode === 'forgot' && forgotStep === 'request')) && (
            <div className="login-method-toggle">
              <button className={`method-btn ${loginMethod === 'email' ? 'active' : ''}`} onClick={() => setLoginMethod('email')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                Email
              </button>
              <button className={`method-btn ${loginMethod === 'phone' ? 'active' : ''}`} onClick={() => setLoginMethod('phone')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                Phone
              </button>
            </div>
          )}

          {/* ── LOGIN MODE ── */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="auth-form animate-fade-in">
              {loginMethod === 'email' ? (
                <>
                  <label className="auth-label">Email Address</label>
                  <input type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <label className="auth-label">Password</label>
                  <input type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </>
              ) : (
                <>
                  <label className="auth-label">Phone Number</label>
                  <div className="phone-input-group">
                    <span className="phone-prefix">+91</span>
                    <input type="tel" className="input phone-input" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} required />
                  </div>
                </>
              )}
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
              <div className="auth-links">
                <button type="button" className="link-btn" onClick={() => switchAuthMode('forgot')}>Forgot Password?</button>
                <button type="button" className="link-btn" onClick={() => switchAuthMode('signup')}>Need an account? Sign Up</button>
              </div>
            </form>
          )}

          {/* ── SIGNUP MODE ── */}
          {authMode === 'signup' && (
            <div className="signup-flow animate-fade-in">
              {step === 'credentials' && (
                <form onSubmit={handleSignUpInit} className="auth-form">
                  {loginMethod === 'email' ? (
                    <>
                      <label className="auth-label">Email Address</label>
                      <input type="email" className="input" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      <label className="auth-label">Create Password</label>
                      <input type="password" className="input" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </>
                  ) : (
                    <>
                      <label className="auth-label">Phone Number</label>
                      <div className="phone-input-group">
                        <span className="phone-prefix">+91</span>
                        <input type="tel" className="input phone-input" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} required />
                      </div>
                    </>
                  )}
                  {error && <p className="auth-error">{error}</p>}
                  <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
                    {loading ? 'Processing...' : 'Continue'}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm w-full mt-2" onClick={() => switchAuthMode('login')}>Back to Login</button>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="auth-form animate-fade-in">
                  <p className="auth-hint">Verification code sent to your {loginMethod}</p>
                  <label className="auth-label">Verification Code</label>
                  <input type="text" className="input otp-input" placeholder="0 0 0 0 0 0" value={otp} onChange={(e) => setOtp(e.target.value.slice(0,6))} required />
                  {error && <p className="auth-error">{error}</p>}
                  <button type="submit" className="btn btn-primary btn-lg auth-btn">Verify Account</button>
                </form>
              )}

              {step === 'profile' && (
                <form onSubmit={handleCompleteSignUp} className="auth-form animate-fade-in">
                  <label className="auth-label">Full Name</label>
                  <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
                  <label className="auth-label">Role</label>
                  <div className="role-selector">
                    <button type="button" className={`role-btn ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>Student</button>
                    <button type="button" className={`role-btn ${role === 'faculty' ? 'active' : ''}`} onClick={() => setRole('faculty')}>Faculty</button>
                  </div>
                  {error && <p className="auth-error">{error}</p>}
                  <button type="submit" className="btn btn-primary btn-lg auth-btn">Complete Registration</button>
                </form>
              )}
            </div>
          )}

          {/* ── FORGOT MODE ── */}
          {authMode === 'forgot' && (
            <div className="forgot-flow animate-fade-in">
              {forgotStep === 'request' && (
                <form onSubmit={handleForgotRequest} className="auth-form">
                  <label className="auth-label">{loginMethod === 'email' ? 'Email Address' : 'Phone Number'}</label>
                  {loginMethod === 'email' ? (
                    <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  ) : (
                    <div className="phone-input-group">
                      <span className="phone-prefix">+91</span>
                      <input type="tel" className="input phone-input" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} required />
                    </div>
                  )}
                  {error && <p className="auth-error">{error}</p>}
                  <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>Send Reset Link</button>
                  <button type="button" className="btn btn-ghost btn-sm w-full mt-2" onClick={() => switchAuthMode('login')}>Back to Login</button>
                </form>
              )}

              {forgotStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="auth-form animate-fade-in">
                  <label className="auth-label">Enter Reset OTP</label>
                  <input type="text" className="input otp-input" value={otp} onChange={(e) => setOtp(e.target.value.slice(0,6))} required />
                  {error && <p className="auth-error">{error}</p>}
                  <button type="submit" className="btn btn-primary btn-lg auth-btn">Verify OTP</button>
                </form>
              )}

              {forgotStep === 'reset' && (
                <form onSubmit={handlePasswordReset} className="auth-form animate-fade-in">
                  <label className="auth-label">New Password</label>
                  <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  {error && <p className="auth-error">{error}</p>}
                  <button type="submit" className="btn btn-primary btn-lg auth-btn">Reset Password</button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPanel;
