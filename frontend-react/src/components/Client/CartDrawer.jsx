import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useCart } from '../../contexts/CartContext';
import { Button, Flex } from '../Shared/Container';

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 1000;
    display: ${props => props.isOpen ? 'block' : 'none'};
`;

const Drawer = styled.div`
    position: fixed;
    top: 0;
    right: 0;
    width: 100%;
    max-width: 420px;
    height: 100%;
    background: #fff;
    z-index: 1001;
    transform: translateX(${props => props.isOpen ? '0' : '100%'});
    transition: transform 0.3s ease;
    display: flex;
    flex-direction: column;
`;

const DrawerHeader = styled.div`
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #888;
`;

const DrawerBody = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
`;

const DrawerFooter = styled.div`
    padding: 16px 20px;
    border-top: 1px solid #eee;
    background: #fafafa;
`;

const CartItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
`;

const ItemInfo = styled.div`
    flex: 1;
    
    .name {
        font-weight: 500;
        font-size: 14px;
    }
    
    .price {
        color: #e67e22;
        font-weight: 600;
        font-size: 14px;
    }
`;

const ItemActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    
    button {
        width: 28px;
        height: 28px;
        border: 1px solid #ddd;
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
        font-size: 14px;
        
        &:hover {
            background: #f5f5f5;
        }
    }
    
    .qty {
        min-width: 20px;
        text-align: center;
        font-weight: 600;
    }
`;

const TotalRow = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 700;
    padding: 8px 0;
`;

const EmptyCart = styled.div`
    text-align: center;
    padding: 40px 0;
    color: #888;
    
    .icon {
        font-size: 48px;
        margin-bottom: 16px;
    }
`;

const CartDrawer = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { cart, totalItems, subtotal, removeFromCart, updateQty, clearCart } = useCart();

    const handleCheckout = () => {
        onClose();
        navigate('/checkout');
    };

    return (
        <>
            <Overlay isOpen={isOpen} onClick={onClose} />
            <Drawer isOpen={isOpen}>
                <DrawerHeader>
                    <h3 style={{ margin: 0 }}>🛒 Sacola</h3>
                    <CloseButton onClick={onClose}>✕</CloseButton>
                </DrawerHeader>

                <DrawerBody>
                    {cart.length === 0 ? (
                        <EmptyCart>
                            <div className="icon">🛒</div>
                            <p>Sua sacola está vazia</p>
                        </EmptyCart>
                    ) : (
                        cart.map(item => (
                            <CartItem key={item.id}>
                                <ItemInfo>
                                    <div className="name">{item.name}</div>
                                    <div className="price">R$ {parseFloat(item.price).toFixed(2)}</div>
                                </ItemInfo>
                                <ItemActions>
                                    <button onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                                    <span className="qty">{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                                    <button 
                                        style={{ color: '#e74c3c', border: 'none', background: 'none', fontSize: '16px' }}
                                        onClick={() => removeFromCart(item.id)}
                                    >
                                        ✕
                                    </button>
                                </ItemActions>
                            </CartItem>
                        ))
                    )}
                </DrawerBody>

                {cart.length > 0 && (
                    <DrawerFooter>
                        <TotalRow>
                            <span>Total ({totalItems} itens)</span>
                            <span>R$ {subtotal.toFixed(2)}</span>
                        </TotalRow>
                        <Flex gap={8}>
                            <Button secondary onClick={clearCart}>Limpar</Button>
                            <Button primary onClick={handleCheckout} full>
                                Finalizar Pedido →
                            </Button>
                        </Flex>
                    </DrawerFooter>
                )}
            </Drawer>
        </>
    );
};

export default CartDrawer;