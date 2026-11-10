import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../components/auth/auth.css';
import { AuthField, AuthSelect, Spinner, AlertBanner } from '../components/auth/AuthField';
import { authService } from '../services/auth.service';

const SKILL_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' }
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    skillLevel: 'BEGINNER',
    terms: false
  });

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm(f => ({ ...f, [name]: val }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
    if (globalError) setGlobalError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = 'Full name must be at least 2 characters';
    if (!form.email.trim() || !EMAIL_RE.test(form.email))
      errs.email = 'Please enter a valid email address';
    if (!form.username.trim() || form.username.trim().length < 3)
      errs.username = 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(form.username))
      errs.username = 'Username can only contain letters, numbers, and underscores';
    if (!form.password || form.password.length < 8)
      errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    if (!form.terms)
      errs.terms = 'You must accept the Terms & Conditions to continue';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setGlobalError('');
    setSuccessMsg('');

    try {
      const res = await authService.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        username: form.username.trim(),
        password: form.password,
        skillLevel: form.skillLevel
      });

      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      setSuccessMsg('Account created! Redirecting to your dashboard…');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors && typeof serverErrors === 'object') {
        const mapped = {};
        Object.entries(serverErrors).forEach(([key, msgs]) => {
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setErrors(mapped);
      } else {
        const msg = err.response?.data?.message || 'Registration failed. Please try again.';
        setGlobalError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">

        {/* ── Left: Form panel ── */}
        <div className="auth-form-panel">
          <h1 className="auth-heading">Create Your Account</h1>
          <p className="auth-subtitle">
            Start your personalized learning journey with AI-powered training.
          </p>

          <AlertBanner type="error" message={globalError} />
          <AlertBanner type="success" message={successMsg} />

          <form onSubmit={handleSubmit} noValidate>
            <AuthField
              label="Full Name"
              id="name"
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              autoComplete="name"
            />

            <AuthField
              label="Email Address"
              id="email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />

            <AuthField
              label="Username"
              id="username"
              type="text"
              placeholder="john_doe"
              value={form.username}
              onChange={handleChange}
              error={errors.username}
              autoComplete="username"
            />

            <AuthField
              label="Password"
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="new-password"
            />

            <AuthField
              label="Confirm Password"
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <AuthSelect
              label="Skill Level"
              id="skillLevel"
              value={form.skillLevel}
              onChange={handleChange}
              error={errors.skillLevel}
            >
              {SKILL_LEVELS.map(sl => (
                <option key={sl.value} value={sl.value}>{sl.label}</option>
              ))}
            </AuthSelect>

            {/* Terms checkbox */}
            <div className="auth-checkbox-row">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={form.terms}
                onChange={handleChange}
              />
              <label htmlFor="terms">
                I agree to the{' '}
                <a href="#" onClick={e => e.preventDefault()}>Terms &amp; Conditions</a>
                {' '}and{' '}
                <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
              </label>
            </div>
            {errors.terms && (
              <p className="auth-field-error" style={{ marginTop: '-10px', marginBottom: '12px' }}
                role="alert">{errors.terms}</p>
            )}

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? <><Spinner /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login">Login</Link>
          </p>
        </div>

        {/* ── Right: Illustration panel ── */}
        <div className="auth-illus-panel">
          <div className="auth-illus-art">
            <img
              src="/images/register-illustration.png"
              alt="Student learning with AI"
              className="auth-illus-img"
              loading="lazy"
            />
          </div>

          <div className="auth-float-cards">
            <div className="auth-float-card">
              <div className="auth-float-card-icon green">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <div className="auth-float-card-label">Personalized Learning</div>
                <div className="auth-float-card-sub">Courses designed for you</div>
              </div>
            </div>

            <div className="auth-float-card">
              <div className="auth-float-card-icon dark">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="auth-float-card-label">Skill Development</div>
                <div className="auth-float-card-sub">Build industry-ready skills</div>
              </div>
            </div>

            <div className="auth-float-card">
              <div className="auth-float-card-icon teal">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="auth-float-card-label">AI Progress Tracking</div>
                <div className="auth-float-card-sub">Track your growth</div>
              </div>
            </div>
          </div>

          <h2 className="auth-illus-heading">Your Learning Journey Starts Here</h2>
          <p className="auth-illus-desc">
            Discover your potential with personalized AI training that adapts to your skills,
            goals, and learning pace.
          </p>
        </div>

      </div>
    </div>
  );
}
