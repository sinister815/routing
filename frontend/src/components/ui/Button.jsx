import React from 'react';
import { cn } from '../../lib/utils.js';
import { RefreshCw } from 'lucide-react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon: Icon,
  className,
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary:
      'bg-primary hover:bg-primary-hover text-white focus:ring-primary border border-transparent',
    secondary:
      'bg-page hover:bg-border text-ink border border-border focus:ring-border',
    outline:
      'bg-surface hover:bg-page text-ink border border-border focus:ring-border',
    danger:
      'bg-danger hover:bg-danger text-white focus:ring-danger border border-transparent',
    ghost:
      'bg-transparent hover:bg-page text-muted hover:text-ink border-transparent',
  };

  const sizes = {
    sm: 'px-2.5 py-1.5 text-sm space-x-1.5',
    md: 'px-4 py-2 text-sm space-x-2',
    lg: 'px-5 py-2.5 text-base space-x-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
