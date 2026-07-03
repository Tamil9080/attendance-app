import React from 'react';

export default function Input({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${
          error ? 'border-danger focus-visible:ring-danger' : ''
        }`}
        {...props}
      />
      {error && (
        <span className="text-xs text-danger flex items-center gap-1 mt-0.5 font-medium">
          ⚠️ {error}
        </span>
      )}
    </div>
  );
}
