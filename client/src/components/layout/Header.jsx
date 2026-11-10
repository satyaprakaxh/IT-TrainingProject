
import React from 'react';

export default function Header() {
  return (
    <header className="header">
      <div>
        <h2>Welcome Back!</h2>
        <p>Continue your learning journey.</p>
      </div>

      <div className="profile">
        <span>Student</span>
        <div className="profile-icon">S</div>
      </div>
    </header>
  );
}
