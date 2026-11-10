import React from 'react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2>SkillPath AI</h2>

      <nav>
        <a href="/">Dashboard</a>
        <a href="/assessment">Assessment</a>
        <a href="/courses">Courses</a>
        <a href="/learning-path">Learning Path</a>
        <a href="/progress">My Progress</a>
      </nav>
    </aside>
  );
}