import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RefreshCw } from 'lucide-react';
import AppNavbar from './AppNavbar.jsx';
import Sidebar from './Sidebar.jsx';
import Footer from './Footer.jsx';
import LogoutModal from './LogoutModal.jsx';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="flex flex-col items-center space-y-3">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <p className="text-sm text-muted">Loading…</p>
      </div>
    </div>
  );
}

export function PublicRoute() {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/analytics" replace />;
  }

  return <Outlet />;
}

export default function ProtectedRoute() {
  const { user, loading } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <div className="flex flex-1 min-h-0">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <AppNavbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 px-4 lg:px-6 py-6">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
      <LogoutModal />
    </div>
  );
}
