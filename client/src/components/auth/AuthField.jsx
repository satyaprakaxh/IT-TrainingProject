import React, { useState } from 'react';

/** Reusable input field with optional label, error, and password toggle */
export function AuthField({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
  children // extra content (e.g. forgot password)
}) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPw ? 'text' : 'password') : type;

  return (
    <div className="auth-field">
      {label && <label className="auth-label" htmlFor={id}>{label}</label>}
      <div className="auth-input-wrap">
        <input
          id={id}
          name={id}
          type={inputType}
          className={`auth-input${isPassword ? ' has-toggle' : ''}${error ? ' error' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-eye-btn"
            onClick={() => setShowPw(v => !v)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p id={`${id}-error`} className="auth-field-error" role="alert">{error}</p>}
      {children}
    </div>
  );
}

/** Reusable select dropdown */
export function AuthSelect({ label, id, value, onChange, error, children }) {
  return (
    <div className="auth-field">
      {label && <label className="auth-label" htmlFor={id}>{label}</label>}
      <select
        id={id}
        name={id}
        className={`auth-select${error ? ' error' : ''}`}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
      >
        {children}
      </select>
      {error && <p className="auth-field-error" role="alert">{error}</p>}
    </div>
  );
}

/** Spinner shown inside the submit button */
export function Spinner() {
  return <span className="auth-spinner" role="status" aria-label="Loading" />;
}

/** Error / Success alert banners */
export function AlertBanner({ type = 'error', message }) {
  if (!message) return null;
  const cls = type === 'error' ? 'auth-error-banner' : 'auth-success-banner';
  const icon = type === 'error' ? (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
  return <div className={cls} role="alert">{icon}<span>{message}</span></div>;
}

