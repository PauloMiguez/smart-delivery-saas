import styled from 'styled-components';

export const AdminContainer = styled.div`
    display: flex;
    min-height: 100vh;
    background: ${props => props.theme.colors.background};
    max-width: 100vw;
    overflow-x: hidden;
`;

export const Sidebar = styled.aside`
    width: 260px;
    background: ${props => props.theme.colors.sidebar};
    color: #fff;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    overflow-y: auto;
    z-index: 100;
    transition: transform 0.3s ease;

    @media (max-width: 768px) {
        transform: translateX(${props => props.$open ? '0' : '-100%'});
        width: 280px;
    }
`;

export const SidebarBrand = styled.div`
    padding: 0 8px 24px 8px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    margin-bottom: 24px;

    h1 {
        font-size: 20px;
        font-weight: 800;
        margin: 0;
        color: #fff;
        
        span {
            color: ${props => props.theme.colors.primary};
        }
    }

    p {
        font-size: 12px;
        color: rgba(255,255,255,0.5);
        margin: 4px 0 0 0;
    }
`;

export const NavItem = styled.button`
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-radius: 8px;
    background: ${props => props.$active ? 'rgba(230, 126, 34, 0.2)' : 'transparent'};
    color: ${props => props.$active ? '#fff' : 'rgba(255,255,255,0.6)'};
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    font-weight: 500;

    &:hover {
        background: rgba(255,255,255,0.08);
        color: #fff;
    }

    .icon {
        font-size: 18px;
        width: 24px;
        text-align: center;
    }
`;

export const MainContent = styled.main`
    flex: 1;
    margin-left: 260px;
    padding: 24px;
    min-height: 100vh;
    max-width: calc(100vw - 260px);
    overflow-x: hidden;

    @media (max-width: 768px) {
        margin-left: 0;
        padding: 16px;
        max-width: 100vw;
    }
`;

export const PageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;

    h2 {
        font-size: 24px;
        font-weight: 700;
        margin: 0;
        color: ${props => props.theme.colors.text};
    }
`;

export const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
    width: 100%;

    @media (max-width: 480px) {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
`;

export const StatCard = styled.div`
    background: ${props => props.theme.colors.card};
    padding: 16px;
    border-radius: 12px;
    box-shadow: ${props => props.theme.shadows.sm};
    border: 1px solid ${props => props.theme.colors.border};
    min-width: 0;

    .number {
        font-size: 24px;
        font-weight: 700;
        color: ${props => props.theme.colors.primary};
        margin-bottom: 4px;
        word-break: break-word;
    }

    .label {
        font-size: 13px;
        color: ${props => props.theme.colors.textLight};
        word-break: break-word;
    }
`;

// ============================================================
//  TABLE RESPONSIVA
// ============================================================
export const TableWrapper = styled.div`
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-bottom: 16px;
    border-radius: 12px;
    box-shadow: ${props => props.theme.shadows.sm};
    background: ${props => props.theme.colors.card};

    @media (max-width: 768px) {
        border-radius: 8px;
    }
`;

export const Table = styled.table`
    width: 100%;
    min-width: 600px;
    border-collapse: collapse;
    background: ${props => props.theme.colors.card};
    font-size: 14px;

    thead {
        background: ${props => props.theme.colors.background};
        border-bottom: 1px solid ${props => props.theme.colors.border};

        th {
            padding: 10px 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: ${props => props.theme.colors.textLight};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }
    }

    tbody {
        tr {
            border-bottom: 1px solid ${props => props.theme.colors.border};
            transition: background 0.2s;

            &:hover {
                background: ${props => props.theme.colors.background};
            }

            td {
                padding: 10px 12px;
                font-size: 13px;
                vertical-align: middle;
                word-break: break-word;
                max-width: 200px;
            }
        }
    }

    @media (max-width: 480px) {
        font-size: 12px;
        min-width: 500px;

        thead th,
        tbody td {
            padding: 8px 10px;
        }
    }
`;

export const Badge = styled.span`
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;

    ${props => props.$status === 'active' && `
        background: #eafaf1;
        color: #27ae60;
    `}
    
    ${props => props.$status === 'inactive' && `
        background: #fdedec;
        color: #e74c3c;
    `}
    
    ${props => props.$status === 'pending' && `
        background: #fef9e7;
        color: #f39c12;
    `}
    
    ${props => props.$status === 'confirmed' && `
        background: #eafaf1;
        color: #27ae60;
    `}
    
    ${props => props.$status === 'delivered' && `
        background: #d5f5e3;
        color: #1a7a3a;
    `}
    
    ${props => props.$status === 'cancelled' && `
        background: #fdedec;
        color: #e74c3c;
    `}
`;

export const ActionButton = styled.button`
    padding: 4px 10px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    ${props => props.$variant === 'edit' && `
        background: #eaf2f8;
        color: #2e86c1;
        &:hover { background: #d4e6f1; }
    `}

    ${props => props.$variant === 'delete' && `
        background: #fdedec;
        color: #e74c3c;
        &:hover { background: #fadbd8; }
    `}

    ${props => props.$variant === 'confirm' && `
        background: #27ae60;
        color: #fff;
        &:hover { background: #1e8449; }
    `}

    ${props => props.$variant === 'deliver' && `
        background: #2e86c1;
        color: #fff;
        &:hover { background: #1a5276; }
    `}

    ${props => props.$variant === 'cancel' && `
        background: #e74c3c;
        color: #fff;
        &:hover { background: #b03a2e; }
    `}

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

export const MobileToggle = styled.button`
    display: none;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: ${props => props.theme.colors.text};
    padding: 8px;

    @media (max-width: 768px) {
        display: block;
    }
`;

export const Overlay = styled.div`
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 99;

    @media (max-width: 768px) {
        display: ${props => props.$open ? 'block' : 'none'};
    }
`;

// ============================================================
//  COMPONENTES ADICIONAIS PARA RESPONSIVIDADE
// ============================================================
export const ProductsContainer = styled.div`
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
`;

export const OrdersContainer = styled.div`
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;

    .desktop-table {
        display: block;

        @media (max-width: 768px) {
            display: none;
        }
    }

    .mobile-cards {
        display: none;

        @media (max-width: 768px) {
            display: block;
        }
    }
`;

export const ActionContainer = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;

    @media (max-width: 480px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }
`;

// ============================================================
//  PEDIDOS - VERSÃO MOBILE (CARDS)
// ============================================================
export const MobileOrderCard = styled.div`
    background: ${props => props.theme.colors.card};
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: ${props => props.theme.shadows.sm};
    border: 1px solid ${props => props.theme.colors.border};
    display: none;

    @media (max-width: 768px) {
        display: block;
    }
`;

export const MobileOrderRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid #f5f5f5;

    &:last-child {
        border-bottom: none;
    }

    .label {
        font-weight: 600;
        font-size: 13px;
        color: ${props => props.theme.colors.textLight};
    }

    .value {
        font-size: 14px;
        color: ${props => props.theme.colors.text};
        text-align: right;
        max-width: 60%;
        word-break: break-word;
    }

    .value strong {
        color: ${props => props.theme.colors.primary};
    }
`;

export const MobileItemsList = styled.div`
    padding: 8px 0;

    .item {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 13px;
        color: ${props => props.theme.colors.textLight};
        border-bottom: 1px dashed #f0f0f0;

        &:last-child {
            border-bottom: none;
        }

        .item-name {
            flex: 1;
            color: ${props => props.theme.colors.text};
        }

        .item-qty {
            margin: 0 12px;
            color: ${props => props.theme.colors.textMuted};
        }

        .item-price {
            font-weight: 500;
            color: ${props => props.theme.colors.primary};
        }
    }
`;

export const MobileActions = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;

    button {
        flex: 1;
        min-width: 80px;
        justify-content: center;
    }
`;