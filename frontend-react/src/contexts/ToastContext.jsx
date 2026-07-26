import React, { createContext, useContext, useState, useCallback } from 'react';
import styled from 'styled-components';

const ToastContainer = styled.div`
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 400px;
    width: 100%;
`;

const ToastItem = styled.div`
    padding: 12px 16px;
    border-radius: ${props => props.theme.borderRadius.md};
    background: ${props => props.theme.colors.card};
    box-shadow: ${props => props.theme.shadows.lg};
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideIn 0.3s ease;
    border-left: 4px solid ${props => {
        switch (props.type) {
            case 'success': return props.theme.colors.success;
            case 'error': return props.theme.colors.danger;
            case 'warning': return props.theme.colors.warning;
            default: return props.theme.colors.primary;
        }
    }};

    ${props => props.removing && `
        animation: slideOut 0.3s ease forwards;
    `}

    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    .icon {
        font-size: 20px;
    }

    .message {
        flex: 1;
    }

    .close {
        background: none;
        border: none;
        color: ${props => props.theme.colors.textMuted};
        font-size: 18px;
        cursor: pointer;
        padding: 0 4px;

        &:hover {
            color: ${props => props.theme.colors.text};
        }
    }
`;

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3500) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => 
                prev.map(t => t.id === id ? { ...t, removing: true } : t)
            );
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 300);
        }, duration);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}
            <ToastContainer>
                {toasts.map(toast => (
                    <ToastItem 
                        key={toast.id} 
                        type={toast.type}
                        removing={toast.removing}
                    >
                        <span className="icon">{icons[toast.type] || '📢'}</span>
                        <span className="message">{toast.message}</span>
                        <button className="close" onClick={() => removeToast(toast.id)}>
                            ✕
                        </button>
                    </ToastItem>
                ))}
            </ToastContainer>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast deve ser usado dentro de ToastProvider');
    }
    return context;
};