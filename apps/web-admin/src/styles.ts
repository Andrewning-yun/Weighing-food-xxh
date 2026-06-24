import { getWebAdminThemeCSS } from '@fastfood-kitchen/design-tokens';

const STYLE_ID = 'web-admin-base-styles';

function getCSS(): string {
  const themeVars = getWebAdminThemeCSS();

  return `
:root {
  ${themeVars}
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

html, body, #root {
  margin: 0;
  min-height: 100%;
  background: var(--bg);
  color: var(--text);
}

body {
  min-height: 100vh;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid var(--line-light);
}

th {
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 500;
}

.card,
.auth-panel {
  border: 1px solid var(--line);
  background: var(--bg-elevated);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-kicker {
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 600;
}

.muted {
  color: var(--muted);
}

.page-stack {
  display: grid;
  gap: 1rem;
}

.card {
  padding: 1.2rem;
  display: grid;
  gap: 1rem;
}

.grid-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.grid-span-2 {
  grid-column: span 2;
}

.table-shell {
  overflow: auto;
  border-radius: 12px;
  border: 1px solid var(--line);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.detail-grid > div {
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--line-light);
  background: #FAF8F6;
}

.detail-label {
  display: block;
  color: var(--text-secondary);
  margin-bottom: 0.35rem;
  font-size: 0.8rem;
}

td:last-child {
  white-space: nowrap;
}

tbody tr {
  transition: background 140ms ease;
}

tbody tr:hover {
  background: var(--primary-bg);
}

.is-selected-row {
  background: var(--primary-lighter);
}

.pill {
  border: 1px solid var(--line);
  color: var(--text-secondary);
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.82rem;
}

.action-row,
.row-split {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.row-split {
  justify-content: space-between;
}

.stack-list {
  display: grid;
  gap: 0.85rem;
}

.nested-card {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  border-radius: 14px;
  border: 1px solid var(--line-light);
  background: #FAF8F6;
}

.inline-grid {
  display: grid;
  gap: 0.9rem;
}

.inline-grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.inline-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.inline-grid-4 {
  grid-template-columns: 2fr 1fr 1fr 1fr;
}

.auth-panel {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 420px);
  gap: 1rem;
  align-items: center;
  padding: 1.5rem;
}

.auth-copy {
  padding: 2rem;
  background: linear-gradient(135deg, var(--primary-light), #FFFFFF);
  border: 1px solid var(--line);
  border-radius: 16px;
}

.form-error {
  color: var(--danger);
  margin: 0;
}

@media (max-width: 1024px) {
  .auth-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .auth-panel {
    padding: 0.9rem;
  }

  .grid-form {
    grid-template-columns: 1fr;
  }

  .grid-span-2 {
    grid-column: auto;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .inline-grid-2,
  .inline-grid-3,
  .inline-grid-4 {
    grid-template-columns: 1fr;
  }

  .action-row,
  .row-split {
    flex-direction: column;
    align-items: stretch;
  }
}
`;
}

let cachedCSS: string | null = null;

export function ensureWebAdminStyles(): void {
  if (typeof document === 'undefined') return;

  if (document.getElementById(STYLE_ID)) return;

  if (!cachedCSS) {
    cachedCSS = getCSS();
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = cachedCSS;
  document.head.appendChild(style);
}
