import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

export const Input = forwardRef(
  ({ label, error, helperText, icon: Icon, className, required, ...props }, ref) => {
    return (
      <div className="space-y-1.5 text-left w-full">
        {label && (
          <label className="block text-sm font-medium text-ink">
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'block w-full rounded-lg border border-border bg-surface py-2 px-3 text-base text-ink placeholder-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors',
              Icon && 'pl-9',
              error && 'border-danger focus:border-danger focus:ring-danger bg-danger/5',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-danger font-medium">{error}</p>}
        {helperText && !error && <p className="text-sm text-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Select = forwardRef(
  ({ label, error, helperText, options = [], children, className, required, ...props }, ref) => {
    return (
      <div className="space-y-1.5 text-left w-full">
        {label && (
          <label className="block text-sm font-medium text-ink">
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'block w-full rounded-lg border border-border bg-surface py-2 px-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors',
            error && 'border-danger focus:border-danger focus:ring-danger bg-danger/5',
            className
          )}
          {...props}
        >
          {children ||
            options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
        </select>
        {error && <p className="text-sm text-danger font-medium">{error}</p>}
        {helperText && !error && <p className="text-sm text-muted">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
