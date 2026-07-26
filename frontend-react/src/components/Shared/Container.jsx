import styled from 'styled-components';

export const Container = styled.div`
    max-width: 600px;
    margin: 0 auto;
    padding: 16px;
`;

export const PageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 2px solid ${props => props.theme.colors.border};
    margin-bottom: ${props => props.theme.spacing.lg};
`;

export const SectionTitle = styled.h2`
    font-size: 20px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: ${props => props.theme.spacing.md};
`;

export const Card = styled.div`
    background: ${props => props.theme.colors.card};
    border-radius: ${props => props.theme.borderRadius.lg};
    padding: ${props => props.theme.spacing.md};
    box-shadow: ${props => props.theme.shadows.md};
    margin-bottom: ${props => props.theme.spacing.md};
    transition: all 0.3s ease;
    
    &:hover {
        box-shadow: ${props => props.theme.shadows.lg};
    }
`;

export const Button = styled.button`
    padding: 10px 20px;
    border: none;
    border-radius: ${props => props.theme.borderRadius.md};
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    ${props => props.primary && `
        background: ${props.theme.colors.primary};
        color: #fff;
        &:hover { background: ${props.theme.colors.primaryDark}; }
    `}
    
    ${props => props.secondary && `
        background: ${props.theme.colors.border};
        color: ${props.theme.colors.text};
        &:hover { background: #d0d0d0; }
    `}
    
    ${props => props.danger && `
        background: ${props.theme.colors.danger};
        color: #fff;
        &:hover { background: #c0392b; }
    `}
    
    ${props => props.success && `
        background: ${props.theme.colors.success};
        color: #fff;
        &:hover { background: #1e8449; }
    `}
    
    ${props => props.outline && `
        background: transparent;
        color: ${props.theme.colors.primary};
        border: 2px solid ${props.theme.colors.primary};
        &:hover { 
            background: ${props.theme.colors.primary};
            color: #fff;
        }
    `}
    
    ${props => props.small && `
        padding: 6px 12px;
        font-size: 12px;
    `}
    
    ${props => props.large && `
        padding: 14px 28px;
        font-size: 16px;
    `}
    
    ${props => props.full && `
        width: 100%;
    `}
    
    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

export const Badge = styled.span`
    display: inline-block;
    padding: 2px 10px;
    border-radius: ${props => props.theme.borderRadius.md};
    font-size: 12px;
    font-weight: 600;
    
    ${props => props.status === 'open' && `
        background: #eafaf1;
        color: ${props.theme.colors.success};
    `}
    
    ${props => props.status === 'closed' && `
        background: #fdedec;
        color: ${props.theme.colors.danger};
    `}
    
    ${props => props.status === 'pending' && `
        background: #fef9e7;
        color: ${props.theme.colors.warning};
    `}
    
    ${props => props.status === 'confirmed' && `
        background: #eafaf1;
        color: ${props.theme.colors.success};
    `}
`;

export const Input = styled.input`
    width: 100%;
    padding: 10px 12px;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
    font-size: 14px;
    transition: all 0.3s ease;
    
    &:focus {
        outline: none;
        border-color: ${props => props.theme.colors.primary};
        box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.1);
    }
`;

export const Flex = styled.div`
    display: flex;
    ${props => props.column && 'flex-direction: column;'}
    ${props => props.center && 'align-items: center; justify-content: center;'}
    ${props => props.between && 'justify-content: space-between; align-items: center;'}
    ${props => props.gap && `gap: ${props.gap}px;`}
    ${props => props.wrap && 'flex-wrap: wrap;'}
`;