import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { openLogoutModal } from '../../store/slices/uiSlice.js';

const titles = {
  '/analytics': 'Overview',
  '/campaigns': 'Campaigns & Links',
  '/offers': 'Offers',
  '/landers': 'Landers',
  '/postbacks': 'S2S Postback',
};

export default function AppNavbar({ onMenuClick }) {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const { user } = useSelector((state) => state.auth);

  const title = titles[pathname] || 'Dashboard';

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-muted hover:text-ink rounded-md hover:bg-page"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display font-semibold text-lg text-ink">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm uppercase">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="text-left text-sm leading-tight">
              <p className="font-medium text-ink">{user?.name || 'User'}</p>
              <p className="text-sm text-muted">{user?.email || ''}</p>
            </div>
          </div>

          <button
            onClick={() => dispatch(openLogoutModal())}
            title="Sign out"
            className="p-2 text-muted hover:text-danger hover:bg-danger/5 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
