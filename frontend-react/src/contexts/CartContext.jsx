import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [subtotal, setSubtotal] = useState(0);

    // ✅ totalPrice é um alias para subtotal (mantém compatibilidade)
    const totalPrice = subtotal;

    // Carregar carrinho do localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.warn('Erro ao carregar carrinho:', e);
            }
        }
    }, []);

    // Salvar carrinho no localStorage e atualizar totais
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateTotals();
    }, [cart]);

    const updateTotals = () => {
        const items = cart.reduce((acc, item) => acc + item.qty, 0);
        const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
        setTotalItems(items);
        setSubtotal(total);
    };

    const addToCart = (product, qty = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, qty: item.qty + qty }
                        : item
                );
            }
            return [...prev, { ...product, qty }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQty = (productId, qty) => {
        if (qty <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(prev =>
            prev.map(item =>
                item.id === productId ? { ...item, qty } : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const getItemQuantity = (productId) => {
        const item = cart.find(item => item.id === productId);
        return item ? item.qty : 0;
    };

    return (
        <CartContext.Provider value={{
            cart,
            totalItems,
            subtotal,
            totalPrice,        // ✅ Adicionado para compatibilidade
            addToCart,
            removeFromCart,
            updateQty,
            clearCart,
            getItemQuantity    // ✅ Adicionado para uso no ProductCard
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart deve ser usado dentro de CartProvider');
    }
    return context;
};