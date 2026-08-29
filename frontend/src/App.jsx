import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuth } from './store/slices/authSlice.js';

import ProtectedRoute, { PublicRoute } from './components/layout/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CampaignsPage from './pages/CampaignsPage.jsx';
import OffersPage from './pages/OffersPage.jsx';
import LandersPage from './pages/LandersPage.jsx';
import PostbackPage from './pages/PostbackPage.jsx';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          {/* Public Marketing Homepage */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected SaaS App */}
        <Route element={<ProtectedRoute />}>
          <Route path="/analytics" element={<DashboardPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/landers" element={<LandersPage />} />
          <Route path="/postbacks" element={<PostbackPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
