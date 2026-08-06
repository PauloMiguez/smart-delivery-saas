// ============================================================
//  DESIGN TOKENS - SMART DELIVERY SAAS (Foodtech Warm Theme)
// ============================================================

export const tokens = {
  colors: {
    // Neutros
    background: '#fafafa',
    surface: '#ffffff',
    text: '#1f2421',
    textSecondary: '#60696b',
    textMuted: '#8c9699',
    placeholder: '#a1aab0',
    
    // Bordas
    border: '#e8ebeb',
    borderHover: '#d1d8d8',
    
    // Accent / Brand (Terracota Quente - Apetite & Foodtech)
    accent: '#d9531e',
    accentHover: '#c04313',
    accentLight: '#fdf3ef',
    
    // Status (Avisos, Sucesso e Erros)
    success: '#2e7d32',
    successLight: '#e8f5e9',
    warning: '#d97706',
    warningLight: '#fef3c7',
    error: '#d32f2f',
    errorLight: '#ffebee',
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
    md: '10px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  
  typography: {
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '2rem',    // 32px
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
    // Elevações suaves sem opacidade preta marcada
    sm: '0 1px 3px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02)',
    md: '0 4px 12px rgba(0, 0, 0, 0.04)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.06)',
    floating: '0 8px 24px rgba(217, 83, 30, 0.22)', // Elevação do botão do carrinho
  },
  
  breakpoints: {
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};

export default tokens;