import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTrip from './pages/CreateTrip';
import TripDetails from './pages/TripDetails';
import InviteResponse from './pages/InviteResponse';
import ProtectedRoute from "./pages/ProtectedRoute";
import PublicRoute from "./pages/PublicRoute";
import InvitePage from "./pages/InvitePage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
  <Route path="/" element={<Navigate to="/login" />} />

  <Route
    path="/login"
    element={
      <PublicRoute>
        <Login />
      </PublicRoute>
    }
  />

<Route
  path="/invite/:token"
  element={<InvitePage />}
/>
  <Route
    path="/register"
    element={
      <PublicRoute>
        <Register />
      </PublicRoute>
    }
  />

  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />

  <Route
    path="/create-trip"
    element={
      <ProtectedRoute>
        <CreateTrip />
      </ProtectedRoute>
    }
  />

  <Route
    path="/trip/:id"
    element={
      <ProtectedRoute>
        <TripDetails />
      </ProtectedRoute>
    }
  />

  <Route
    path="/invite/accept/:invitationId"
    element={
      <ProtectedRoute>
        <InviteResponse />
      </ProtectedRoute>
    }
  />
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
    </BrowserRouter>
  );
}

export default App;
