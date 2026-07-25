import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import './CartDrawer.css';

const CartDrawer = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { cart, totalItems, subtotal, removeFromCart, updateQty, clearCart } = useCart();

    if (!isOpen) return null;

    const handleCheckout = () => {
        onClose();
        navigate('/checkout');
    };

    return (
        <div className="cart-overlay" onClick={onClose}>
            <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="cart-header">
                    <h2>🛒 Sacola</h2>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>
                
                {cart.length === 0 ? (
                    <div className="cart-empty">
                        <p>Sua sacola está vazia</p>
                    </div>
                ) : (
                    <>
                        <div className="cart-items">
                            {cart.map(item => (
                                <div key={item.id} className="cart-item">
                                    <div className="cart-item-info">
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-price">R$ {parseFloat(item.price).toFixed(2)}</span>
                                    </div>
                                    <div className="cart-item-actions">
                                        <div className="qty-control">
                                            <button onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                                            <span>{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                                        </div>
                                        <button 
                                            className="btn-remove" 
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="cart-footer">
                            <div className="cart-total">
                                <span>Total ({totalItems} itens)</span>
                                <span>R$ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="cart-actions">
                                <button className="btn-clear" onClick={clearCart}>Limpar</button>
                                <button className="btn-checkout" onClick={handleCheckout}>
                                    Finalizar Pedido →
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;