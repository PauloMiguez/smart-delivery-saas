import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const [modals, setModals] = useState([]);

    const openModal = useCallback((Component, props = {}) => {
        const id = Date.now();
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

    return (
        <ModalContext.Provider value={{ openModal, closeModal, closeTopModal, closeAllModals }}>
            {children}
            {modals.map(({ id, Component, props }) => (
                <Component key={id} {...props} onClose={() => closeModal(id)} />
            ))}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal deve ser usado dentro de ModalProvider');
    }
    return context;
};