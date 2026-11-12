
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export default function Header({
  bubblesEnabled,
  onToggleBubbles,
  theme,
  onToggleTheme
}) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initial = user.name?.charAt(0).toUpperCase() || 'S';

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

  return (
    <header className="header">

      <div className="header-brand">
        <h2>SkillPath AI</h2>
      </div>

      <div className="header-actions">

        <div className="header-effects">
          <button
            type="button"
            className={`header-control bubble-control ${
              bubblesEnabled ? 'active' : ''
            }`}
            onClick={onToggleBubbles}
            aria-pressed={bubblesEnabled}
          >
            🫧 {bubblesEnabled ? 'Bubbles ON' : 'Bubbles OFF'}
          </button>

          <button
            type="button"
            className="header-control theme-control"
            onClick={onToggleTheme}
          >
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>

        {/* Original profile section */}
        <div className="profile">
          <span>Hello, {user.name || 'Student'}!</span>

          <div className="profile-icon">
            {initial}
          </div>

          <button
            className="profile-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

      </div>
    </header>
  );
}
