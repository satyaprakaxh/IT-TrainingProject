
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import './components/layout/Layout.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import Courses from './pages/Courses';
import Progress from './pages/Progress';

// Check if the user is authenticated
const isAuthenticated = () => !!localStorage.getItem('token');

// Protect private routes
function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

// Redirect logged-in users away from login/register
function PublicOnlyRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

// Common layout for protected pages
function AppShell({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        <Header />

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        {/* Register */}
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        {/* Dashboard */}
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

        {/* Assessment */}
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

        {/* Courses */}
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

        {/* Progress */}
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

        {/* Default route */}
        <Route
          path="*"
          element={
            <Navigate
              to={isAuthenticated() ? '/dashboard' : '/login'}
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
