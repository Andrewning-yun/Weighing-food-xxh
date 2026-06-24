export const palette = {
  orange50: '#FFF7F3',
  orange100: '#FFF0E8',
  orange200: '#FFDCC8',
  orange300: '#FFBFA0',
  orange400: '#FF9966',
  orange500: '#E8530E',
  orange600: '#D14A0C',
  orange700: '#B33E0A',
  orange800: '#8C3008',
  orange900: '#662206',
} as const;

export const semantic = {
  primary: palette.orange500,
  primaryHover: palette.orange600,
  primaryActive: palette.orange700,
  primaryLight: palette.orange100,
  primaryBg: 'rgba(232, 83, 14, 0.06)',
  success: '#2BA471',
  successLight: '#E8F8F2',
  warning: '#F5A623',
  warningLight: '#FFF8EC',
  danger: '#E53935',
  dangerLight: '#FDECEC',
  info: '#2E86DE',
  infoLight: '#EAF2FC',
  bg: '#F6F3EF',
  bgElevated: '#FFFFFF',
  bgPanel: '#FAF8F6',
  text: '#2D2D2D',
  textSecondary: '#6B6B6B',
  textPlaceholder: '#B0B0B0',
  line: '#E8E3DD',
  lineLight: '#F0ECE7',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
} as const;

export const fontSize = {
  xs: '0.75rem',
  sm: '0.82rem',
  base: '0.9rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
} as const;

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export const fontFamily = [
  "-apple-system, BlinkMacSystemFont",
  "'PingFang SC'",
  "'Microsoft YaHei'",
  "'Noto Sans CJK SC'",
  "sans-serif",
].join(', ');
