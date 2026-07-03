import React from 'react';

export default function Badge({
  children,
  variant = 'default', // default, secondary, success, danger, warning, info
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold select-none transition-colors duration-200';
  
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-muted text-muted-foreground',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    danger: 'border-danger/30 bg-danger/10 text-danger dark:text-danger',
    warning: 'border-warning/30 bg-warning/10 text-warning dark:text-warning',
    info: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400'
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <span className={`${baseStyles} ${currentVariant} ${className}`} {...props}>
      {children}
    </span>
  );
}
