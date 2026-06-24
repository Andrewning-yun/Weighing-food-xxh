'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from 'tdesign-react/es/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * React error boundary that catches render errors and displays
 * a user-friendly fallback UI instead of crashing the whole page.
 * Logs errors to console in dev; can call onError callback for
 * external reporting (e.g. Sentry).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            display: 'grid',
            placeItems: 'center',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '2.5rem', opacity: 0.3 }}>⚠</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--td-text-color-primary)' }}>
              页面渲染异常
            </h3>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--td-text-color-secondary)' }}>
              {this.state.error.message || '发生了意外错误，请尝试刷新页面。'}
            </p>
          </div>
          <Button theme="primary" onClick={this.handleReset}>
            重试
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
