'use client';

import type { ReactNode } from 'react';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}

/**
 * Production-grade form field wrapper with label, required indicator,
 * error message, and help text. Always renders a proper <label> for
 * screen-reader compatibility.
 */
export function FormField({
  label,
  required,
  error,
  help,
  children,
  className,
  htmlFor,
}: FormFieldProps) {
  const fieldId = htmlFor;
  const errorId = error ? `${fieldId || 'field'}-error` : undefined;
  const helpId = help ? `${fieldId || 'field'}-help` : undefined;

  return (
    <div className={className} style={{ display: 'grid', gap: '0.35rem' }}>
      <label
        htmlFor={fieldId}
        style={{
          fontSize: '0.82rem',
          fontWeight: 500,
          color: error ? 'var(--td-error-color)' : 'var(--td-text-color-primary)',
        }}
      >
        {required && (
          <span style={{ color: 'var(--td-error-color)', marginRight: 2 }}>*</span>
        )}
        {label}
      </label>

      <div
        aria-invalid={!!error}
        aria-describedby={errorId || helpId}
        style={
          error
            ? {
                border: '1px solid var(--td-error-color)',
                borderRadius: 'var(--td-radius-default, 6px)',
                overflow: 'hidden',
              }
            : undefined
        }
      >
        {children}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          style={{
            margin: 0,
            fontSize: '0.75rem',
            color: 'var(--td-error-color)',
            lineHeight: 1.4,
          }}
        >
          {error}
        </p>
      )}

      {help && !error && (
        <p
          id={helpId}
          style={{
            margin: 0,
            fontSize: '0.75rem',
            color: 'var(--td-text-color-placeholder)',
            lineHeight: 1.4,
          }}
        >
          {help}
        </p>
      )}
    </div>
  );
}
