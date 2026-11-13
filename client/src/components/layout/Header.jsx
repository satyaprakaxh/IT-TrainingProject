import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';

import {
  User,
  LogOut,
  ChevronDown,
  Menu,
  BookOpen,
  Target,
} from 'lucide-react';

export default function Header({
  bubblesEnabled,
  onToggleBubbles,
  theme,
  onToggleTheme
}) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initial = user.name?.charAt(0).toUpperCase() || 'S';

  const dropdownRef = useRef(null);
  const avatarRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Clear local state even if logout request fails
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setDropdownOpen(false);
    navigate('/login');
  };

  // Close dropdown on outside click or Escape
  const handleClickOutside = useCallback(
    (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClickOutside, handleKeyDown]);

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
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

        {/* Profile section with dropdown */}
        <div className="profile">
          <span className="profile-greeting">
            Hello, {user.name || 'Student'}!
          </span>

          {/* Avatar trigger */}
          <div
            className="profile-avatar-wrap"
            ref={avatarRef}
            onClick={toggleDropdown}
            role="button"
            tabIndex={0}
            aria-label="User profile menu"
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDropdown();
              }
            }}
          >
            <div className="profile-avatar">{initial}</div>
            <ChevronDown
              size={12}
              className={`profile-chevron ${dropdownOpen ? 'rotate' : ''}`}
            />
          </div>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="profile-dropdown" ref={dropdownRef}>
              <ul className="profile-dropdown-list" role="menu">
                <li role="menuitem">
                  <Link
                    to="/profile"
                    className="profile-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <User size={16} className="profile-dropdown-icon" />
                    My Profile
                  </Link>
                </li>
                <li role="menuitem">
                  <Link
                    to="/courses"
                    className="profile-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <BookOpen size={16} className="profile-dropdown-icon" />
                    My Courses
                  </Link>
                </li>
                <li role="menuitem">
                  <button
                    className="profile-dropdown-item profile-dropdown-item-danger"
                    onClick={handleLogout}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <LogOut size={16} className="profile-dropdown-icon" />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
