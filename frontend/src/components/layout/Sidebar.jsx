import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Megaphone,
  Tag,
  FileText,
  Share2,
  X,
} from 'lucide-react';

const groups = [
  {
    label: 'Analytics',
    items: [{ to: '/analytics', label: 'Overview', icon: BarChart3 }],
  },
  {
    label: 'Tracking',
    items: [
      { to: '/campaigns', label: 'Campaigns & Links', icon: Megaphone },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/offers', label: 'Offers', icon: Tag },
      { to: '/landers', label: 'Landers', icon: FileText },
    ],
  },
  {
    label: 'Integrations',
    items: [{ to: '/postbacks', label: 'S2S Postback', icon: Share2 }],
  },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 bg-surface border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border">
          <span className="font-display font-semibold text-lg text-ink">TrackFlow</span>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-muted hover:text-ink rounded-md hover:bg-page"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-1.5 text-sm uppercase tracking-wide text-muted font-semibold">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary-50 text-primary border-l-2 border-primary'
                            : 'text-muted hover:bg-page hover:text-ink border-l-2 border-transparent'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
