'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  hoverEffect = false,
  onClick,
  ...props
}) {
  const baseStyle = 'rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden';
  
  if (onClick) {
    return (
      <motion.div
        whileHover={hoverEffect ? { y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' } : {}}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className={`${baseStyle} cursor-pointer transition-shadow duration-300 ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  if (hoverEffect) {
    return (
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
        className={`${baseStyle} transition-shadow duration-300 ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseStyle} ${className}`} {...props}>
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 border-b border-border/50 ${className}`}>
      {children}
    </div>
  );
};

Card.Title = function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  );
};

Card.Description = function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      {children}
    </p>
  );
};

Card.Content = function CardContent({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={`flex items-center p-6 border-t border-border/50 ${className}`}>
      {children}
    </div>
  );
};
