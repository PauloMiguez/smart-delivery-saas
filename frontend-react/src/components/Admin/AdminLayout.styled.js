import styled from 'styled-components';

export const AdminContainer = styled.div`
    display: flex;
    min-height: 100vh;
    background: ${props => props.theme.colors.background};
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

    @media (max-width: 768px) {
        margin-left: 0;
        padding: 16px;
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
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
`;

export const StatCard = styled.div`
    background: ${props => props.theme.colors.card};
    padding: 20px;
    border-radius: 12px;
    box-shadow: ${props => props.theme.shadows.sm};
    border: 1px solid ${props => props.theme.colors.border};

    .number {
        font-size: 28px;
        font-weight: 700;
        color: ${props => props.theme.colors.primary};
        margin-bottom: 4px;
    }

    .label {
        font-size: 14px;
        color: ${props => props.theme.colors.textLight};
    }
`;

export const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    background: ${props => props.theme.colors.card};
    border-radius: 12px;
    overflow: hidden;
    box-shadow: ${props => props.theme.shadows.sm};

    thead {
        background: ${props => props.theme.colors.background};
        border-bottom: 1px solid ${props => props.theme.colors.border};

        th {
            padding: 12px 16px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: ${props => props.theme.colors.textLight};
            text-transform: uppercase;
            letter-spacing: 0.5px;
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
                padding: 12px 16px;
                font-size: 14px;
            }
        }
    }
`;

export const Badge = styled.span`
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;

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
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

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