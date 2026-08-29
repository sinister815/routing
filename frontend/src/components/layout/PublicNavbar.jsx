import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { useSelector } from 'react-redux';

export default function PublicNavbar() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                NexTrack<span className="text-indigo-600">.io</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full font-bold">
                v2.0 &lt;50ms
              </span>
            </div>
          </Link>

          {/* Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-indigo-600 transition-colors">
              Architecture
            </a>
            <a href="#about" className="hover:text-indigo-600 transition-colors">
              About
            </a>
            <a href="#benchmarks" className="hover:text-indigo-600 transition-colors">
              Benchmarks
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard')}
                icon={ArrowRight}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                  icon={ArrowRight}
                >
                  Get Started Free
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
