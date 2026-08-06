// ============================================================
//  DESIGN TOKENS - SMART DELIVERY SAAS
// ============================================================

export const tokens = {
  colors: {
    // Neutros
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    placeholder: '#94a3b8',
    
    // Bordas
    border: '#e2e8f0',
    borderHover: '#cbd5e1',
    
    // Accent (azul)
    accent: '#2563eb',
    accentHover: '#1d4ed8',
    accentLight: 'rgba(37, 99, 235, 0.08)',
    
    // Status
    success: '#16a34a',
    successLight: 'rgba(22, 163, 74, 0.08)',
    warning: '#f59e0b',
    warningLight: 'rgba(245, 158, 11, 0.08)',
    error: '#dc2626',
    errorLight: 'rgba(220, 38, 38, 0.08)',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  
  typography: {
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 12px rgba(0, 0, 0, 0.06)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },
  
  breakpoints: {
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};

export default tokens;
