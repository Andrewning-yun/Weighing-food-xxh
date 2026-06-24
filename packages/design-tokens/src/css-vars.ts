import { palette, semantic } from './tokens';

export function getTDesignCSSVariables(): string {
  return `
    --td-brand-color: ${semantic.primary};
    --td-brand-color-1: ${palette.orange50};
    --td-brand-color-2: ${palette.orange100};
    --td-brand-color-3: ${palette.orange200};
    --td-brand-color-5: ${semantic.primaryHover};
    --td-brand-color-6: ${semantic.primaryActive};
    --td-brand-color-hover: ${semantic.primaryHover};
    --td-brand-color-active: ${semantic.primaryActive};
    --td-brand-color-focus: ${palette.orange200};
    --td-brand-color-light: ${semantic.primaryLight};
    --td-brand-color-bg: ${semantic.primaryBg};
    --td-success-color: ${semantic.success};
    --td-success-color-light: ${semantic.successLight};
    --td-warning-color: ${semantic.warning};
    --td-warning-color-light: ${semantic.warningLight};
    --td-error-color: ${semantic.danger};
    --td-error-color-light: ${semantic.dangerLight};
    --td-bg-color-page: ${semantic.bg};
    --td-bg-color-container: ${semantic.bgElevated};
    --td-bg-color-component: ${semantic.bgPanel};
    --td-text-color-primary: ${semantic.text};
    --td-text-color-secondary: ${semantic.textSecondary};
    --td-text-color-placeholder: ${semantic.textPlaceholder};
    --td-component-border: ${semantic.line};
    --td-border-level-1-color: ${semantic.lineLight};
    --td-border-level-2-color: ${semantic.line};
  `;
}

export function getNutUICSSVariables(): string {
  return `
    --nut-primary-color: ${semantic.primary};
    --nut-primary-color-end: ${semantic.primaryHover};
    --nut-primary-active-color: ${semantic.primaryActive};
    --nut-help-color: ${semantic.warning};
    --nut-danger-color: ${semantic.danger};
    --nut-success-color: ${semantic.success};
    --nut-text-color: ${semantic.text};
    --nut-text-color-gray: ${semantic.textSecondary};
    --nut-white: ${semantic.bgElevated};
    --nut-page-bg: ${semantic.bg};
    --nut-gray-3: ${semantic.textPlaceholder};
    --nut-border-color: ${semantic.line};
  `;
}

export function getWebAdminThemeCSS(): string {
  return getTDesignCSSVariables() + `
    --primary: ${semantic.primary};
    --primary-hover: ${semantic.primaryHover};
    --primary-light: ${semantic.primaryLight};
    --primary-lighter: ${palette.orange50};
    --primary-bg: ${semantic.primaryBg};
    --success: ${semantic.success};
    --danger: ${semantic.danger};
    --warning: ${semantic.warning};
    --info: ${semantic.info};
    --bg: ${semantic.bg};
    --bg-elevated: ${semantic.bgElevated};
    --panel: ${semantic.bgElevated};
    --panel-2: ${semantic.bgPanel};
    --text: ${semantic.text};
    --text-secondary: ${semantic.textSecondary};
    --muted: ${semantic.textSecondary};
    --line: ${semantic.line};
    --line-light: ${semantic.lineLight};
    --accent: ${semantic.primary};
  `;
}
