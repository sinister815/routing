import React from 'react';
import { cn } from '../../lib/utils.js';

export function TableContainer({ children, className }) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-xl overflow-hidden shadow-card',
        className
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({ children, className }) {
  return <table className={cn('w-full text-left table-dense', className)}>{children}</table>;
}

export function TableHead({ children, className }) {
  return <thead className={cn('bg-page border-b border-border', className)}>{children}</thead>;
}

export function TableBody({ children, className }) {
  return <tbody className={cn('divide-y divide-border', className)}>{children}</tbody>;
}

export function TableRow({ children, className, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'hover:bg-primary-50/40 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHeader({ children, className, align = 'left' }) {
  return (
    <th
      className={cn(
        'py-3 px-4 font-semibold text-sm uppercase tracking-wide text-muted',
        align === 'right' && 'text-right tabular-nums',
        align === 'center' && 'text-center',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className, align = 'left' }) {
  return (
    <td
      className={cn(
        'py-3 px-4 text-sm text-ink',
        align === 'right' && 'text-right tabular-nums',
        align === 'center' && 'text-center',
        className
      )}
    >
      {children}
    </td>
  );
}
