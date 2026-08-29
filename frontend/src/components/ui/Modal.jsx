import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  maxWidth = 'max-w-md',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={cn(
          'relative bg-surface rounded-xl shadow-card border border-border w-full overflow-hidden z-10',
          maxWidth
        )}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5 text-ink" />}
            <div>
              <h3 className="text-lg font-semibold text-ink leading-tight">{title}</h3>
              {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink p-1.5 rounded-md hover:bg-page transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 py-5 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
