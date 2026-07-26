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