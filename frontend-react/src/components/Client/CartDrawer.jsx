import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useCart } from '../../contexts/CartContext';
import { useTenant } from '../../contexts/TenantContext';
import { tokens } from '../../styles/tokens';

// ============================================================
//  FUNÇÃO PARA FORMATAR PREÇO
// ============================================================
const formatPrice = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
};

// ============================================================
//  STYLED COMPONENTS
// ============================================================
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: all 0.25s ease-in-out;
  backdrop-filter: blur(4px);
`;

const Drawer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  max-width: 420px;
  height: 100%;
  background: ${tokens.colors.surface};
  z-index: 1000;
  transform: translateX(${props => props.$isOpen ? '0' : '100%'});
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: ${tokens.shadows.lg};
  display: flex;
  flex-direction: column;
  font-family: ${tokens.typography.fontFamily};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${tokens.spacing.md} ${tokens.spacing.lg};
  border-bottom: 1px solid ${tokens.colors.border};
  flex-shrink: 0;
`;

const HeaderTitle = styled.h2`
  font-size: ${tokens.typography.fontSize.lg};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.text};
  margin: 0;
  letter-spacing: -0.02em;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: ${tokens.typography.fontSize['2xl']};
  cursor: pointer;
  color: ${tokens.colors.textMuted};
  padding: ${tokens.spacing.xs};
  transition: all 0.2s ease-in-out;
  line-height: 1;
  
  &:hover {
    color: ${tokens.colors.text};
    transform: rotate(90deg);
  }
  
  &:focus-visible {
    outline: 2px solid ${tokens.colors.accent};
    outline-offset: 2px;
    border-radius: ${tokens.radius.sm};
  }
`;

const CartItems = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${tokens.spacing.md} ${tokens.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing.md};
`;

const EmptyCart = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${tokens.colors.textMuted};
  padding: ${tokens.spacing.xl};
  
  .icon {
    font-size: 56px;
    margin-bottom: ${tokens.spacing.md};
  }
  
  h3 {
    font-size: ${tokens.typography.fontSize.lg};
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.text};
    margin: 0 0 ${tokens.spacing.xs} 0;
  }
  
  p {
    font-size: ${tokens.typography.fontSize.sm};
    margin: 0;
    color: ${tokens.colors.textMuted};
  }
`;

const CartItem = styled.div`
  display: flex;
  gap: ${tokens.spacing.md};
  padding: ${tokens.spacing.sm} 0;
  border-bottom: 1px solid ${tokens.colors.border};
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemImage = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${tokens.radius.sm};
  background: ${tokens.colors.background};
  overflow: hidden;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ItemImagePlaceholder = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${tokens.radius.sm};
  background: ${tokens.colors.accentLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: ${tokens.colors.accent};
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemName = styled.p`
  font-size: ${tokens.typography.fontSize.sm};
  font-weight: ${tokens.typography.fontWeight.medium};
  color: ${tokens.colors.text};
  margin: 0 0 2px 0;
`;

const ItemPrice = styled.p`
  font-size: ${tokens.typography.fontSize.sm};
  color: ${tokens.colors.accent};
  font-weight: ${tokens.typography.fontWeight.semibold};
  margin: 0;
`;

const ItemControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacing.sm};
  margin-top: ${tokens.spacing.xs};
`;

const QtyButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: ${tokens.radius.sm};
  border: 1.5px solid ${tokens.colors.border};
  background: ${tokens.colors.surface};
  color: ${tokens.colors.text};
  font-size: ${tokens.typography.fontSize.base};
  font-weight: ${tokens.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${tokens.typography.fontFamily};
  
  &:hover {
    background: ${tokens.colors.accentLight};
    border-color: ${tokens.colors.accent};
    color: ${tokens.colors.accent};
  }
  
  &:active {
    transform: scale(0.92);
  }
  
  &:focus-visible {
    outline: 2px solid ${tokens.colors.accent};
    outline-offset: 2px;
  }
`;

const QtyDisplay = styled.span`
  font-size: ${tokens.typography.fontSize.sm};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.text};
  min-width: 24px;
  text-align: center;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${tokens.colors.textMuted};
  cursor: pointer;
  font-size: ${tokens.typography.fontSize.sm};
  padding: ${tokens.spacing.xs};
  transition: all 0.2s ease-in-out;
  
  &:hover {
    color: ${tokens.colors.error};
  }
  
  &:focus-visible {
    outline: 2px solid ${tokens.colors.accent};
    outline-offset: 2px;
    border-radius: ${tokens.radius.sm};
  }
`;

const Footer = styled.div`
  padding: ${tokens.spacing.md} ${tokens.spacing.lg};
  border-top: 1px solid ${tokens.colors.border};
  flex-shrink: 0;
  background: ${tokens.colors.surface};
`;

const SubtotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${tokens.typography.fontSize.base};
  color: ${tokens.colors.text};
  margin-bottom: ${tokens.spacing.sm};
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${tokens.typography.fontSize.lg};
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.text};
  padding-top: ${tokens.spacing.sm};
  border-top: 2px solid ${tokens.colors.border};
`;

const CheckoutButton = styled.button`
  width: 100%;
  padding: ${tokens.spacing.md};
  background: ${tokens.colors.accent};
  color: ${tokens.colors.surface};
  border: none;
  border-radius: ${tokens.radius.md};
  font-size: ${tokens.typography.fontSize.base};
  font-weight: ${tokens.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  margin-top: ${tokens.spacing.md};
  font-family: ${tokens.typography.fontFamily};
  
  &:hover:not(:disabled) {
    background: ${tokens.colors.accentHover};
    transform: translateY(-2px);
    box-shadow: ${tokens.shadows.md};
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:focus-visible {
    outline: 2px solid ${tokens.colors.accent};
    outline-offset: 2px;
  }
`;

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
const CartDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { cart, totalItems, subtotal, updateQty, removeFromCart } = useCart();

  const handleCheckout = () => {
    onClose();
    navigate(`/checkout?tenant=${tenant}`);
  };

  // Garantir que o subtotal seja um número
  const safeSubtotal = parseFloat(subtotal) || 0;
  const safeTotal = safeSubtotal;

  return (
    <>
      <Overlay $isOpen={isOpen} onClick={onClose} />
      
      <Drawer $isOpen={isOpen}>
        <Header>
          <HeaderTitle>🛒 Seu Carrinho</HeaderTitle>
          <CloseButton onClick={onClose} aria-label="Fechar carrinho">
            ✕
          </CloseButton>
        </Header>

        <CartItems>
          {cart.length === 0 ? (
            <EmptyCart>
              <div className="icon">🛒</div>
              <h3>Carrinho vazio</h3>
              <p>Adicione itens do cardápio para começar.</p>
            </EmptyCart>
          ) : (
            cart.map(item => {
              // ✅ Garantir que price seja um número
              const price = parseFloat(item.price) || 0;
              const itemTotal = price * (item.qty || 1);
              
              return (
                <CartItem key={item.id}>
                  {item.image_url ? (
                    <ItemImage>
                      <img src={item.image_url} alt={item.name} />
                    </ItemImage>
                  ) : (
                    <ItemImagePlaceholder>🍔</ItemImagePlaceholder>
                  )}
                  
                  <ItemInfo>
                    <ItemName>{item.name}</ItemName>
                    <ItemPrice>R$ {formatPrice(price)}</ItemPrice>
                    
                    <ItemControls>
                      <QtyButton 
                        onClick={() => updateQty(item.id, (item.qty || 1) - 1)}
                        aria-label="Diminuir quantidade"
                      >
                        −
                      </QtyButton>
                      <QtyDisplay>{item.qty || 1}</QtyDisplay>
                      <QtyButton 
                        onClick={() => updateQty(item.id, (item.qty || 1) + 1)}
                        aria-label="Aumentar quantidade"
                      >
                        +
                      </QtyButton>
                      <RemoveButton 
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remover item"
                      >
                        ✕
                      </RemoveButton>
                    </ItemControls>
                  </ItemInfo>
                  
                  <div style={{ 
                    fontSize: tokens.typography.fontSize.sm, 
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.accent,
                    alignSelf: 'flex-start',
                    marginTop: tokens.spacing.xs
                  }}>
                    R$ {formatPrice(itemTotal)}
                  </div>
                </CartItem>
              );
            })
          )}
        </CartItems>

        {cart.length > 0 && (
          <Footer>
            <SubtotalRow>
              <span>Subtotal</span>
              <span>R$ {formatPrice(safeSubtotal)}</span>
            </SubtotalRow>
            <TotalRow>
              <span>Total</span>
              <span>R$ {formatPrice(safeTotal)}</span>
            </TotalRow>
            
            <CheckoutButton onClick={handleCheckout}>
              Finalizar Pedido
            </CheckoutButton>
          </Footer>
        )}
      </Drawer>
    </>
  );
};

export default CartDrawer;
