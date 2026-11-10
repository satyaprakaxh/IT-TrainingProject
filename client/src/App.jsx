
import React from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import './components/layout/Layout.css';

export default function App() {
  return (
    <div className="app-layout">

      <Sidebar />

      <div className="main-content">
        <Header />

        <main className="page-content">
          <h1>AI-Based IT Training System</h1>
          <p>
            Welcome to your personalized IT learning platform.
          </p>
        </main>
      </div>

    </div>
  );
}
