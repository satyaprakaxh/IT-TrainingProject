import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export default function Header() {
  const navigate = useNavigate();

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
        <h2>Welcome Back!</h2>
        <p>Continue your learning journey.</p>
      </div>

      <div className="profile">
        <span>Student</span>
        <button className="profile-btn" onClick={handleLogout}>Logout</button>
        <div className="profile-icon">S</div>
      </div>
    </header>
  );
}
