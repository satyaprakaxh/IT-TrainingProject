
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import './components/layout/Layout.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import AssessmentInstructions from './pages/AssessmentInstructions';
import AssessmentAttempt from './pages/AssessmentAttempt';
import AssessmentResult from './pages/AssessmentResult';
import AssessmentHistory from './pages/AssessmentHistory';
import Courses from './pages/Courses';
import LearningPath from './pages/LearningPath';
import Progress from './pages/Progress';
import Profile from './pages/Profile';

import FloatingBubbles from './components/effects/FloatingBubbles';

// Check authentication
const isAuthenticated = () => !!localStorage.getItem('token');

// Protect private routes
function PrivateRoute({ children }) {
  return isAuthenticated()
    ? children
    : <Navigate to="/login" replace />;
}

// Redirect logged-in users away from login/register
function PublicOnlyRoute({ children }) {
  return isAuthenticated()
    ? <Navigate to="/dashboard" replace />
    : children;
}

// Common layout for protected pages
function AppShell({ children }) {
  const [bubblesEnabled, setBubblesEnabled] = useState(
    () => localStorage.getItem('bubbles-enabled') !== 'false'
  );

  const [theme, setTheme] = useState(
    () => localStorage.getItem('dashboard-theme') || 'light'
  );

  // Save bubble setting
  useEffect(() => {
    localStorage.setItem('bubbles-enabled', String(bubblesEnabled));
  }, [bubblesEnabled]);

  // Apply and save theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dashboard-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === 'light' ? 'dark' : 'light'
    );
  };

  return (
    <div className="app-layout">
      {bubblesEnabled && <FloatingBubbles />}

      <Sidebar />

      <div className="main-content">
        <Header
          bubblesEnabled={bubblesEnabled}
          onToggleBubbles={() =>
            setBubblesEnabled((prev) => !prev)
          }
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

// Main application
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AppShell>
                <Dashboard />
              </AppShell>
            </PrivateRoute>
          }
        />

        <Route
          path="/assessment"
          element={
            <PrivateRoute>
              <AppShell>
                <Assessment />
              </AppShell>
            </PrivateRoute>
          }
        />

        <Route
          path="/assessment/instructions/:id"
          element={
            <PrivateRoute>
              <AppShell>
                <AssessmentInstructions />
              </AppShell>
            </PrivateRoute>
          }
        />

        <Route
          path="/assessment/attempt/:id"
          element={
            <PrivateRoute>
              <AppShell>
                <AssessmentAttempt />
              </AppShell>
            </PrivateRoute>
          }
        />

        <Route
          path="/assessment/result/:attemptId"
          element={
            <PrivateRoute>
              <AppShell>
                <AssessmentResult />
              </AppShell>
            </PrivateRoute>
          }
        />

        <Route
          path="/assessment/history"
          element={
            <PrivateRoute>
              <AppShell>
                <AssessmentHistory />
              </AppShell>
            </PrivateRoute>
          }
        />

        <Route
          path="/courses"
          element={
            <PrivateRoute>
              <AppShell>
                <Courses />
              </AppShell>
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <AppShell>
                <Profile />
              </AppShell>
            </PrivateRoute>
          }
        />

        {/* Learning Path route */}
        <Route
          path="/learning-path"
          element={
            <PrivateRoute>
              <AppShell>
                <LearningPath />
              </AppShell>
            </PrivateRoute>
          }
        />

        <Route
          path="/progress"
          element={
            <PrivateRoute>
              <AppShell>
                <Progress />
              </AppShell>
            </PrivateRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}
