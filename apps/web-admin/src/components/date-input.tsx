'use client';

import { useId } from 'react';

export interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Styled date input consistent with TDesign design tokens.
 * Uses native <input type="date"> for accessibility (native picker
 * on mobile, keyboard-navigable, screen-reader friendly).
 */
export function DateInput({
  value,
  onChange,
  error,
  min,
  max,
  disabled = false,
  placeholder = '请选择日期',
}: DateInputProps) {
  const instanceId = useId();
  const inputId = `date-${instanceId}`;

  return (
    <input
      id={inputId}
      type="date"
      value={value}
      min={min}
      max={max}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      aria-label={placeholder}
      aria-invalid={!!error}
      style={{
        width: '100%',
        height: 32,
        padding: '0 8px',
        fontSize: '0.9rem',
        fontFamily: 'inherit',
        color: value ? 'var(--td-text-color-primary)' : 'var(--td-text-color-placeholder)',
        background: disabled
          ? 'var(--td-bg-color-component)'
          : 'var(--td-bg-color-container)',
        border: `1px solid ${
          error ? 'var(--td-error-color)' : 'var(--td-component-border)'
        }`,
        borderRadius: 'var(--td-radius-default, 6px)',
        outline: 'none',
        transition: 'border-color 200ms ease',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxSizing: 'border-box',
        lineHeight: '32px',
      }}
      onFocus={(e) => {
        if (!error) {
          e.target.style.borderColor = 'var(--td-brand-color)';
        }
      }}
      onBlur={(e) => {
        if (!error) {
          e.target.style.borderColor = 'var(--td-component-border)';
        }
      }}
    />
  );
}
