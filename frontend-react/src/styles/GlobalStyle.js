import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: ${props => props.theme.colors.background};
        color: ${props => props.theme.colors.text};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        padding-bottom: 80px;
    }

    /* Importar Inter do Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    .loader {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        font-size: 18px;
        color: ${props => props.theme.colors.textLight};
    }

    .loader::after {
        content: '';
        width: 40px;
        height: 40px;
        margin-left: 12px;
        border: 4px solid ${props => props.theme.colors.border};
        border-top-color: ${props => props.theme.colors.primary};
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
// Adicionar no final do GlobalStyle
const responsiveStyles = `
    /* ============================================================
       RESPONSIVIDADE DO DASHBOARD - UM GRÁFICO POR LINHA NO MOBILE
       ============================================================ */
    @media (max-width: 768px) {
        /* Grid dos gráficos de status e produtos */
        .dashboard-charts-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
        }
        
        /* Cards de métricas */
        .stats-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
        }
    }

    @media (max-width: 480px) {
        /* Em telas muito pequenas, métricas ficam uma abaixo da outra */
        .stats-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
        }
        
        .dashboard-charts-grid {
            gap: 12px !important;
        }
    }
`;
