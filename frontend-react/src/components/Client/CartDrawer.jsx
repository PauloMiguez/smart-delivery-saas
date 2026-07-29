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
    background: rgba(0, 0, 0, 0.5);
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
        color: #2d3436;
    }
    
    .price {
        color: #e67e22;
        font-weight: 600;
        font-size: 14px;
    }
`;

// ============================================================
//  BOTÕES DE QUANTIDADE CORRIGIDOS PARA O CARRINHO
// ============================================================
const ItemActions = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    
    button {
        width: 32px;
        height: 32px;
        border: 1.5px solid #ddd;
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
        font-size: 18px;
        font-weight: 700;
        color: #2d3436;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        touch-action: manipulation;
        line-height: 1;
        padding: 0;
        
        &:hover {
            background: #e67e22;
            color: #fff;
            border-color: #e67e22;
        }
        
        &:active {
            transform: scale(0.92);
        }
    }
    
    .qty {
        min-width: 24px;
        text-align: center;
        font-weight: 600;
        font-size: 16px;
        color: #2d3436;
    }
    
    .btn-remove {
        background: none;
        border: none;
        color: #e74c3c;
        cursor: pointer;
        font-size: 18px;
        padding: 4px;
        -webkit-tap-highlight-color: transparent;
        
        &:hover {
            color: #c0392b;
        }
    }
`;

const TotalRow = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 700;
    padding: 8px 0;
    color: #2d3436;
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
                    <h3 style={{ margin: 0, color: '#2d3436' }}>🛒 Sacola</h3>
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
                                    <button 
                                        onClick={() => updateQty(item.id, item.qty - 1)}
                                        aria-label="Diminuir quantidade"
                                    >
                                        −
                                    </button>
                                    <span className="qty">{item.qty}</span>
                                    <button 
                                        onClick={() => updateQty(item.id, item.qty + 1)}
                                        aria-label="Aumentar quantidade"
                                    >
                                        +
                                    </button>
                                    <button 
                                        className="btn-remove" 
                                        onClick={() => removeFromCart(item.id)}
                                        aria-label="Remover item"
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