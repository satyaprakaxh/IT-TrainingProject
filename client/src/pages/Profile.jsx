import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

import {
  User,
  Mail,
  UserCircle,
  Clock,
  ShieldCheck,
  Layers,
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (err) {
        setError('Failed to load user data.');
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Clear local state even if logout request fails
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-skeleton wide" />
          <div className="profile-skeleton" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h1>Profile</h1>
          <p className="profile-muted">{error || 'Unable to load profile.'}</p>
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button
              className="profile-btn-primary"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <Link to="/dashboard" className="profile-back">
          ← Back to Dashboard
        </Link>
        <div>
          <h1>My Profile</h1>
          <p className="profile-subtitle">
            Manage your account and learning information.
          </p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card profile-info-card">
          <div className="profile-avatar">
            {initial}
          </div>
          <div className="profile-info">
            <h2>{user.name || 'User'}</h2>
            <p className="profile-email">{user.email || 'No email'}</p>
            <p className="profile-username">
              @{user.username || 'user'}
            </p>
            <span className={`profile-role-badge role-${(user.role || 'employee').toLowerCase()}`}>
              {user.role || 'Employee'}
            </span>
          </div>
        </div>

        <div className="profile-card profile-stats-card">
          <h3>Account Overview</h3>
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-icon">
                <UserCircle size={22} />
              </div>
              <div>
                <div className="profile-stat-label">Member Since</div>
                <div className="profile-stat-value">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : '—'}
                </div>
              </div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-icon">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="profile-stat-label">Account Status</div>
                <div className="profile-stat-value">Active</div>
              </div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-icon">
                <Layers size={22} />
              </div>
              <div>
                <div className="profile-stat-label">Role</div>
                <div className="profile-stat-value">
                  {user.role || 'Employee'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card profile-actions-card">
          <h3>Quick Actions</h3>
          <div className="profile-actions">
            <button
              className="profile-action-btn"
              onClick={() => navigate('/courses')}
            >
              <div className="profile-action-icon">
                <Layers size={18} />
              </div>
              <div>
                <div className="profile-action-title">My Courses</div>
                <div className="profile-action-desc">
                  Browse and enroll in courses
                </div>
              </div>
            </button>
            <button
              className="profile-action-btn"
              onClick={() => navigate('/learning-path')}
            >
              <div className="profile-action-icon">
                <Clock size={18} />
              </div>
              <div>
                <div className="profile-action-title">Learning Path</div>
                <div className="profile-action-desc">
                  Continue your learning journey
                </div>
              </div>
            </button>
            <button
              className="profile-action-btn profile-action-btn-danger"
              onClick={handleLogout}
            >
              <div className="profile-action-icon">
                <User size={18} />
              </div>
              <div>
                <div className="profile-action-title">Logout</div>
                <div className="profile-action-desc">
                  Sign out of your account
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
