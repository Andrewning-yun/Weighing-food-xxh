import { ReactNode } from 'react';
import { getNutUICSSVariables } from '@fastfood-kitchen/design-tokens';
import './app.scss';

interface AppProps {
  children?: ReactNode;
}

export default function App({ children }: AppProps) {
  // Expose NutUI theme variables as CSS custom properties
  if (typeof document !== 'undefined') {
    const styleId = 'nutui-theme-vars';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `:root { ${getNutUICSSVariables()} }`;
      document.head.appendChild(style);
    }
  }

  return children ?? null;
}
