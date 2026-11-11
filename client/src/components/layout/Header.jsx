
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export default function Header() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initial = user.name?.charAt(0).toUpperCase() || 'S';

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Ignore logout errors; clear local state regardless
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="header">
      <div>
        <h2>Welcome Back, {user.name || 'Student'}!</h2>
        <p>Continue your learning journey.</p>
      </div>

      <div className="profile">
        <span>{user.name || 'Student'}</span>
        <button className="profile-btn" onClick={handleLogout}>Logout</button>
        <div className="profile-icon">{initial}</div>
      </div>
    </header>
  );
}
