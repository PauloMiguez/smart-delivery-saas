import React, { createContext, useContext, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { tokens } from '../styles/tokens';

// ============================================================
//  ANIMAÇÕES
// ============================================================
const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

// ============================================================
//  STYLED COMPONENTS
// ============================================================
const ToastContainer = styled.div`
  position: fixed;
  top: ${tokens.spacing.lg};
  right: ${tokens.spacing.lg};
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing.sm};
  max-width: 400px;
  width: 100%;
  font-family: ${tokens.typography.fontFamily};

  @media (max-width: ${tokens.breakpoints.sm}) {
    top: ${tokens.spacing.sm};
    right: ${tokens.spacing.sm};
    left: ${tokens.spacing.sm};
    max-width: 100%;
  }
`;

const ToastItem = styled.div`
  padding: ${tokens.spacing.md} ${tokens.spacing.lg};
  border-radius: ${tokens.radius.md};
  background: ${tokens.colors.surface};
  box-shadow: ${tokens.shadows.lg};
  font-size: ${tokens.typography.fontSize.sm};
  font-weight: ${tokens.typography.fontWeight.medium};
  display: flex;
  align-items: center;
  gap: ${tokens.spacing.sm};
  animation: ${slideIn} 0.3s ease;
  border: 1px solid ${tokens.colors.border};
  border-left: 4px solid ${props => {
    switch (props.$type) {
      case 'success': return tokens.colors.success;
      case 'error': return tokens.colors.error;
      case 'warning': return tokens.colors.warning;
      default: return tokens.colors.accent;
    }
  }};

  ${props => props.$removing && `
    animation: ${slideOut} 0.3s ease forwards;
  `}

  .icon {
    font-size: ${tokens.typography.fontSize.lg};
    flex-shrink: 0;
  }

  .message {
    flex: 1;
    color: ${tokens.colors.text};
    line-height: ${tokens.typography.lineHeight.normal};
  }

  .close {
    background: none;
    border: none;
    color: ${tokens.colors.textMuted};
    font-size: ${tokens.typography.fontSize.lg};
    cursor: pointer;
    padding: ${tokens.spacing.xs};
    transition: all 0.2s ease-in-out;
    line-height: 1;
    border-radius: ${tokens.radius.sm};

    &:hover {
      color: ${tokens.colors.text};
      background: ${tokens.colors.background};
    }

    &:focus-visible {
      outline: 2px solid ${tokens.colors.accent};
      outline-offset: 2px;
    }
  }
`;

// ============================================================
//  CONTEXT
// ============================================================
const ToastContext = createContext();

// ============================================================
//  PROVIDER
// ============================================================
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3500) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => 
                prev.map(t => t.id === id ? { ...t, $removing: true } : t)
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
                        $type={toast.type}
                        $removing={toast.$removing}
                    >
                        <span className="icon">{icons[toast.type] || '📢'}</span>
                        <span className="message">{toast.message}</span>
                        <button 
                            className="close" 
                            onClick={() => removeToast(toast.id)}
                            aria-label="Fechar notificação"
                        >
                            ✕
                        </button>
                    </ToastItem>
                ))}
            </ToastContainer>
        </ToastContext.Provider>
    );
};

// ============================================================
//  HOOK
// ============================================================
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast deve ser usado dentro de ToastProvider');
    }
    return context;
};
