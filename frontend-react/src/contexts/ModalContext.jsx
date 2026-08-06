import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { tokens } from '../styles/tokens';

// ============================================================
//  ANIMAÇÕES
// ============================================================
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

// ============================================================
//  STYLED COMPONENTS PARA MODAL BASE
// ============================================================
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${tokens.spacing.md};
  animation: ${fadeIn} 0.25s ease-in-out;

  @media (max-width: ${tokens.breakpoints.sm}) {
    padding: ${tokens.spacing.sm};
    align-items: flex-end;
  }
`;

export const ModalContent = styled.div`
  background: ${tokens.colors.surface};
  border-radius: ${tokens.radius.lg};
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${slideUp} 0.25s ease-in-out;
  box-shadow: ${tokens.shadows.lg};
  border: 1px solid ${tokens.colors.border};
  position: relative;

  @media (max-width: ${tokens.breakpoints.sm}) {
    max-height: 85vh;
    border-radius: ${tokens.radius.lg} ${tokens.radius.lg} 0 0;
    max-width: 100%;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${tokens.colors.background};
    border-radius: ${tokens.radius.sm};
  }

  &::-webkit-scrollbar-thumb {
    background: ${tokens.colors.border};
    border-radius: ${tokens.radius.sm};
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${tokens.colors.borderHover};
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${tokens.spacing.lg} ${tokens.spacing.lg} ${tokens.spacing.md};
  border-bottom: 1px solid ${tokens.colors.border};
  position: sticky;
  top: 0;
  background: ${tokens.colors.surface};
  z-index: 1;
  border-radius: ${tokens.radius.lg} ${tokens.radius.lg} 0 0;

  @media (max-width: ${tokens.breakpoints.sm}) {
    padding: ${tokens.spacing.md} ${tokens.spacing.md} ${tokens.spacing.sm};
  }
`;

export const ModalTitle = styled.h3`
  margin: 0;
  font-size: ${tokens.typography.fontSize.lg};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.text};
  letter-spacing: -0.02em;
  font-family: ${tokens.typography.fontFamily};
`;

export const ModalCloseButton = styled.button`
  background: none;
  border: none;
  font-size: ${tokens.typography.fontSize['2xl']};
  cursor: pointer;
  color: ${tokens.colors.textMuted};
  padding: ${tokens.spacing.xs};
  transition: all 0.2s ease-in-out;
  line-height: 1;
  border-radius: ${tokens.radius.sm};

  &:hover {
    color: ${tokens.colors.text};
    background: ${tokens.colors.background};
    transform: rotate(90deg);
  }

  &:focus-visible {
    outline: 2px solid ${tokens.colors.accent};
    outline-offset: 2px;
  }

  @media (max-width: ${tokens.breakpoints.sm}) {
    font-size: ${tokens.typography.fontSize.xl};
  }
`;

export const ModalBody = styled.div`
  padding: ${tokens.spacing.lg};

  @media (max-width: ${tokens.breakpoints.sm}) {
    padding: ${tokens.spacing.md};
  }
`;

export const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${tokens.spacing.sm};
  padding: ${tokens.spacing.md} ${tokens.spacing.lg} ${tokens.spacing.lg};
  border-top: 1px solid ${tokens.colors.border};
  position: sticky;
  bottom: 0;
  background: ${tokens.colors.surface};
  border-radius: 0 0 ${tokens.radius.lg} ${tokens.radius.lg};

  @media (max-width: ${tokens.breakpoints.sm}) {
    flex-direction: column;
    padding: ${tokens.spacing.sm} ${tokens.spacing.md} ${tokens.spacing.md};
  }
`;

// ============================================================
//  CONTEXT
// ============================================================
const ModalContext = createContext();

// ============================================================
//  PROVIDER
// ============================================================
export const ModalProvider = ({ children }) => {
    const [modals, setModals] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    // Bloquear scroll quando modal estiver aberto
    useEffect(() => {
        if (modals.length > 0) {
            document.body.style.overflow = 'hidden';
            setIsOpen(true);
        } else {
            document.body.style.overflow = '';
            setIsOpen(false);
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [modals.length]);

    const openModal = useCallback((Component, props = {}) => {
        const id = Date.now() + Math.random();
        setModals(prev => [...prev, { id, Component, props }]);
        return id;
    }, []);

    const closeModal = useCallback((id) => {
        setModals(prev => prev.filter(m => m.id !== id));
    }, []);

    const closeTopModal = useCallback(() => {
        setModals(prev => prev.slice(0, -1));
    }, []);

    const closeAllModals = useCallback(() => {
        setModals([]);
    }, []);

    const value = {
        modals,
        isOpen,
        openModal,
        closeModal,
        closeTopModal,
        closeAllModals
    };

    return (
        <ModalContext.Provider value={value}>
            {children}
            {modals.map(({ id, Component, props }) => (
                <Component 
                    key={id} 
                    {...props} 
                    onClose={() => closeModal(id)}
                    isOpen={true}
                />
            ))}
        </ModalContext.Provider>
    );
};

// ============================================================
//  HOOK
// ============================================================
export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal deve ser usado dentro de ModalProvider');
    }
    return context;
};

// ============================================================
//  UTILITÁRIO PARA CRIAR MODAIS RÁPIDOS
// ============================================================
export const createModal = (Component) => {
    return (props) => {
        const { openModal } = useModal();
        return openModal(Component, props);
    };
};