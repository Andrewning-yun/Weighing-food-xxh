import type { ReactNode } from 'react';
import type { RouteConfig } from '../lib/routes';
import { GROUP_LABELS } from '../lib/routes';

export interface PageHeaderProps {
  route: RouteConfig;
  actions?: ReactNode;
}

export function PageHeader({ route, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.25rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--td-component-border)',
      }}
    >
      <div>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.78rem', color: 'var(--td-text-color-secondary)' }}>
          <span>{GROUP_LABELS[route.group]}</span>
          <span style={{ margin: '0 6px' }}>/</span>
          <span style={{ color: 'var(--td-text-color-primary)' }}>{route.name}</span>
        </div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
          {route.name}
        </h2>
        {route.description && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--td-text-color-secondary)' }}>
            {route.description}
          </p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>{actions}</div>}
    </div>
  );
}
