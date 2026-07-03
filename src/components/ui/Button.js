'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, secondary, danger, success, ghost
  size = 'md', // sm, md, lg
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none rounded-lg';
  
  const variants = {
    primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md active:bg-primary/95',
    secondary: 'border border-border bg-card text-foreground hover:bg-muted hover:text-foreground',
    danger: 'bg-danger text-white hover:bg-danger/90 hover:shadow-md',
    success: 'bg-success text-white hover:bg-success/90 hover:shadow-md',
    ghost: 'hover:bg-muted text-muted-foreground hover:text-foreground'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.md;

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${currentVariant} ${currentSize} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : children}
    </motion.button>
  );
}
