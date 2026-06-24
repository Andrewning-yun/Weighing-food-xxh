'use client';

import type { ReactNode } from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: { value: number; positive?: boolean };
  icon?: ReactNode;
  loading?: boolean;
  color?: string;
  onClick?: () => void;
}

/**
 * KPI statistic card for dashboard-style layouts.
 * Supports loading skeleton, trend indicators, and custom colors.
 */
export function StatCard({
  title,
  value,
  prefix,
  suffix,
  trend,
  icon,
  loading = false,
  color,
  onClick,
}: StatCardProps) {
  const content = (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      style={{
        padding: '1.25rem',
        borderRadius: 14,
        border: '1px solid var(--td-component-border)',
        background: 'var(--td-bg-color-container)',
        display: 'grid',
        gap: '0.5rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 200ms ease, transform 200ms ease',
        ...(onClick ? {
          ':hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            transform: 'translateY(-1px)',
          },
        } : {}),
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--td-text-color-secondary)' }}>
          {title}
        </span>
        {icon && (
          <span style={{ fontSize: '1.2rem', opacity: 0.6, color }}>
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div
          style={{
            height: 32,
            width: '60%',
            borderRadius: 6,
            background: 'linear-gradient(90deg, var(--td-bg-color-component) 25%, var(--td-bg-color-container) 50%, var(--td-bg-color-component) 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-loading 1.5s infinite',
          }}
          aria-label="加载中"
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
          {prefix && (
            <span style={{ fontSize: '0.82rem', color: 'var(--td-text-color-secondary)' }}>
              {prefix}
            </span>
          )}
          <span
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              lineHeight: 1.1,
              color: color || 'var(--td-text-color-primary)',
            }}
          >
            {value}
          </span>
          {suffix && (
            <span style={{ fontSize: '0.82rem', color: 'var(--td-text-color-secondary)' }}>
              {suffix}
            </span>
          )}
          {trend && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.78rem',
                fontWeight: 600,
                color:
                  trend.positive === undefined
                    ? 'var(--td-text-color-placeholder)'
                    : trend.positive
                      ? 'var(--td-success-color)'
                      : 'var(--td-error-color)',
              }}
            >
              {trend.positive === undefined ? '' : trend.positive ? '↑' : '↓'}
              {Math.abs(trend.value).toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  );

  return content;
}
