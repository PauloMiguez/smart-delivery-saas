import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [subtotal, setSubtotal] = useState(0);

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

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateTotals();
    }, [cart]);

    const updateTotals = () => {
        const items = cart.reduce((acc, item) => acc + item.qty, 0);
        const total = cart.reduce((acc, item) => {
            let itemTotal = item.price * item.qty;
            
            if (item.addons && item.addons.length > 0) {
                const addonsTotal = item.addons.reduce(
                    (sum, addon) => sum + (addon.price * addon.quantity),
                    0
                );
                itemTotal += addonsTotal;
            }
            
            return acc + itemTotal;
        }, 0);
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
            return [...prev, { 
                ...product, 
                qty,
                addons: [],
                hasAddons: false 
            }];
        });
    };

    const addAddonToItem = (itemIndex, addon) => {
        setCart(prev => {
            const newCart = [...prev];
            const item = newCart[itemIndex];
            
            if (!item.addons) {
                item.addons = [];
            }

            const existing = item.addons.find(a => a.id === addon.id);
            if (existing) {
                existing.quantity += 1;
            } else {
                item.addons.push({ ...addon, quantity: 1 });
            }
            
            item.hasAddons = true;
            return newCart;
        });
    };

    const removeAddonFromItem = (itemIndex, addonId) => {
        setCart(prev => {
            const newCart = [...prev];
            const item = newCart[itemIndex];
            
            if (item.addons) {
                item.addons = item.addons.filter(a => a.id !== addonId);
                if (item.addons.length === 0) {
                    item.hasAddons = false;
                }
            }
            
            return newCart;
        });
    };

    const updateAddonQuantity = (itemIndex, addonId, quantity) => {
        if (quantity <= 0) {
            removeAddonFromItem(itemIndex, addonId);
            return;
        }

        setCart(prev => {
            const newCart = [...prev];
            const item = newCart[itemIndex];
            
            if (item.addons) {
                const addon = item.addons.find(a => a.id === addonId);
                if (addon) {
                    addon.quantity = quantity;
                }
            }
            
            return newCart;
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const removeItem = (index) => {
        setCart(prev => prev.filter((_, i) => i !== index));
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

    const getItemTotal = (item) => {
        let total = item.price * item.qty;
        if (item.addons && item.addons.length > 0) {
            const addonsTotal = item.addons.reduce(
                (sum, addon) => sum + (addon.price * addon.quantity),
                0
            );
            total += addonsTotal;
        }
        return total;
    };

    const hasAddons = (item) => {
        return item.addons && item.addons.length > 0;
    };

    return (
        <CartContext.Provider value={{
            cart,
            totalItems,
            subtotal,
            totalPrice: subtotal,
            addToCart,
            addAddonToItem,
            removeAddonFromItem,
            updateAddonQuantity,
            removeFromCart,
            removeItem,
            updateQty,
            clearCart,
            getItemQuantity,
            getItemTotal,
            hasAddons
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
