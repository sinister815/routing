import React from 'react';
import { cn } from '../../lib/utils.js';

export default function Badge({
  children,
  variant = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  className,
  dot = false,
}) {
  const variants = {
    default: 'bg-page text-muted border-border',
    primary: 'bg-primary-50 text-primary border-primary-100',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    info: 'bg-primary-50 text-primary border-primary-100',
    purple: 'bg-primary-50 text-primary border-primary-100',
  };

  const dots = {
    default: 'bg-muted',
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-primary',
    purple: 'bg-primary',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium border select-none tabular-nums',
        variants[variant],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dots[variant])} />}
      <span>{children}</span>
    </span>
  );
}
