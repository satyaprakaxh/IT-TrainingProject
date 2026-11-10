import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import './components/layout/Layout.css';

import Login    from './pages/Login';
import Register from './pages/Register';
import Dashboard   from './pages/Dashboard';
import Assessment  from './pages/Assessment';
import Courses     from './pages/Courses';
import Progress    from './pages/Progress';

/** Checks if a user is currently authenticated */
const isAuthenticated = () => !!localStorage.getItem('token');

/** Protects routes — redirects unauthenticated users to /login */
function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

/** Prevents already-logged-in users from seeing auth pages */
function PublicOnlyRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

/** Dashboard shell wrapping all protected pages */
function AppShell({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={
          <PublicOnlyRoute><Login /></PublicOnlyRoute>
        } />
        <Route path="/register" element={
          <PublicOnlyRoute><Register /></PublicOnlyRoute>
        } />

        {/* Protected app routes */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <AppShell><Dashboard /></AppShell>
          </PrivateRoute>
        } />
        <Route path="/assessment" element={
          <PrivateRoute>
            <AppShell><Assessment /></AppShell>
          </PrivateRoute>
        } />
        <Route path="/courses" element={
          <PrivateRoute>
            <AppShell><Courses /></AppShell>
          </PrivateRoute>
        } />
        <Route path="/progress" element={
          <PrivateRoute>
            <AppShell><Progress /></AppShell>
          </PrivateRoute>
        } />

        {/* Default redirect */}
        <Route path="*" element={
          <Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}
