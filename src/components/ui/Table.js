import React from 'react';

export function Table({ children, className = '', ...props }) {
  return (
    <div className="w-full overflow-auto">
      <table className={`w-full text-left border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead className={`border-b border-border bg-slate-900/10 dark:bg-slate-900/50 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={`${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', ...props }) {
  return (
    <tr className={`border-b border-border/40 hover:bg-muted/40 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th className={`p-4 text-sm font-semibold text-muted-foreground ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={`p-4 text-sm text-foreground align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}
