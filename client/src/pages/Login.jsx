import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../components/auth/auth.css';
import { AuthField, Spinner, AlertBanner } from '../components/auth/AuthField';
import { LearnerIllustration } from '../components/auth/AuthIllustrations';
import { authService } from '../services/auth.service';

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
    if (globalError) setGlobalError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.identifier.trim()) errs.identifier = 'Email or username is required';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setGlobalError('');

    try {
      const res = await authService.login(form.identifier.trim(), form.password);
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setGlobalError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">

        {/* ── Left: Form panel ── */}
        <div className="auth-form-panel">
          <h1 className="auth-heading">Welcome Back!</h1>
          <p className="auth-subtitle">
            Continue your learning journey with your personalized AI training platform.
          </p>

          <AlertBanner type="error" message={globalError} />

          <form onSubmit={handleSubmit} noValidate>
            <AuthField
              label="Email or Username"
              id="identifier"
              type="text"
              placeholder="Enter your email or username"
              value={form.identifier}
              onChange={handleChange}
              error={errors.identifier}
              autoComplete="username"
            />

            <AuthField
              label="Password"
              id="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="current-password"
            />

            <a href="#" className="auth-forgot">Forgot Password?</a>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? <><Spinner /> Logging in…</> : 'Login'}
            </button>
          </form>

          <div className="auth-divider">or continue with</div>

          <p className="auth-switch">
            Don&apos;t have an account?{' '}
            <Link to="/register">Register now</Link>
          </p>
        </div>

        {/* ── Right: Illustration panel ── */}
        <div className="auth-illus-panel">
          <div className="auth-illus-art">
            <LearnerIllustration />
          </div>

          <div className="auth-float-cards">
            <div className="auth-float-card">
              <div className="auth-float-card-icon green">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <div className="auth-float-card-label">JavaScript Training</div>
                <div className="auth-float-card-sub">12 Lessons</div>
                <div className="auth-progress-bar">
                  <div className="auth-progress-fill" style={{ width: '84%' }} />
                </div>
              </div>
            </div>

            <div className="auth-float-card">
              <div className="auth-float-card-icon dark">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="auth-float-card-label">Learning Progress</div>
                <div className="auth-float-card-sub">84% Complete</div>
              </div>
            </div>

            <div className="auth-float-card">
              <div className="auth-float-card-icon teal">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="auth-float-card-label">Skill Assessment</div>
                <div className="auth-float-card-sub">Completed ✓</div>
              </div>
            </div>
          </div>

          <h2 className="auth-illus-heading">Learn Smarter. Grow Faster.</h2>
          <p className="auth-illus-desc">
            Personalized AI-powered training designed around your skills, goals, and learning pace.
          </p>
        </div>

      </div>
    </div>
  );
}
