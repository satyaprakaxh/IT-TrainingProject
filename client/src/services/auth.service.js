import api from './api';

/**
 * Authentication Service
 * Wraps all auth-related API calls.
 */
export const authService = {
  /**
   * Register a new user account.
   */
  register: (data) =>
    api.post('/auth/register', data, { withCredentials: true }),

  /**
   * Login with email/username + password.
   */
  login: (identifier, password) =>
    api.post('/auth/login', { identifier, password }, { withCredentials: true }),

  /**
   * Logout and clear the session cookie.
   */
  logout: () =>
    api.post('/auth/logout', {}, { withCredentials: true }),

  /**
   * Fetch the currently authenticated user profile.
   */
  me: () =>
    api.get('/auth/me', { withCredentials: true }),
};
