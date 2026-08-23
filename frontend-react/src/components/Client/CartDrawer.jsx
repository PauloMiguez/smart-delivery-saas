import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useCart } from '../../contexts/CartContext';
import { useTenant } from '../../contexts/TenantContext';
import { tokens } from '../../styles/tokens';
import AddonModal from './AddonModal';

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

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${tokens.colors.border};
    border-radius: ${tokens.radius.sm};
  }
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
  align-items: flex-start;

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
  min-width: 0;
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

// ✅ ESTILOS PARA ACOMPANHAMENTOS
const AddonsList = styled.div`
  margin-top: 4px;
  padding-left: 8px;
  border-left: 2px solid ${tokens.colors.accent};
`;

const AddonItem = styled.div`
  font-size: ${tokens.typography.fontSize.xs};
  color: ${tokens.colors.textMuted};
  display: flex;
  justify-content: space-between;
  padding: 1px 0;
`;

// ✅ BOTÃO DE ACOMPANHAMENTOS
const AddonButton = styled.button`
  background: none;
  border: 1px dashed ${tokens.colors.border};
  color: ${tokens.colors.accent};
  font-size: ${tokens.typography.fontSize.xs};
  padding: 2px 10px;
  border-radius: ${tokens.radius.sm};
  cursor: pointer;
  margin-top: 4px;
  transition: all 0.2s ease-in-out;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: ${tokens.typography.fontFamily};

  &:hover {
    border-color: ${tokens.colors.accent};
    background: ${tokens.colors.accentLight};
  }

  &:focus-visible {
    outline: 2px solid ${tokens.colors.accent};
    outline-offset: 2px;
  }
`;

const ItemControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacing.sm};
  margin-top: ${tokens.spacing.xs};
  flex-wrap: wrap;
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

const ItemTotal = styled.div`
  font-size: ${tokens.typography.fontSize.sm};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.accent};
  align-self: flex-start;
  margin-top: ${tokens.spacing.xs};
  flex-shrink: 0;
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
  font-size: ${tokens.typography.fontSize.lg};
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.text};
  padding: ${tokens.spacing.sm} 0;
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
  const { 
    cart, 
    subtotal, 
    updateQty, 
    removeItem,
    getItemTotal,
    hasAddons 
  } = useCart();

  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [showAddonModal, setShowAddonModal] = useState(false);

  const handleCheckout = () => {
    onClose();
    navigate(`/checkout?tenant=${tenant}`);
  };

  // ✅ Abrir modal de acompanhamentos
  const handleOpenAddons = (index) => {
    setSelectedItemIndex(index);
    setShowAddonModal(true);
  };

  // ✅ Fechar modal de acompanhamentos
  const handleCloseAddons = () => {
    setShowAddonModal(false);
    setSelectedItemIndex(null);
  };

  const safeSubtotal = parseFloat(subtotal) || 0;

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
            cart.map((item, index) => {
              const itemTotal = getItemTotal(item);
              const hasAddonsSelected = hasAddons(item);

              return (
                <CartItem key={item.id || index}>
                  {item.image_url ? (
                    <ItemImage>
                      <img src={item.image_url} alt={item.name} />
                    </ItemImage>
                  ) : (
                    <ItemImagePlaceholder>🍔</ItemImagePlaceholder>
                  )}

                  <ItemInfo>
                    <ItemName>{item.name}</ItemName>
                    <ItemPrice>R$ {formatPrice(item.price)}</ItemPrice>

                    {/* ✅ EXIBIR ACOMPANHAMENTOS SELECIONADOS */}
                    {hasAddonsSelected && item.addons && item.addons.length > 0 && (
                      <AddonsList>
                        {item.addons.map((addon, idx) => (
                          <AddonItem key={idx}>
                            <span>+ {addon.name}</span>
                            <span>{addon.quantity}x R$ {formatPrice(addon.price)}</span>
                          </AddonItem>
                        ))}
                      </AddonsList>
                    )}

                    {/* ✅ BOTÃO PARA ADICIONAR/EDITAR ACOMPANHAMENTOS */}
                    <AddonButton onClick={() => handleOpenAddons(index)}>
                      {hasAddonsSelected ? '✏️ Editar acompanhamentos' : '➕ Adicionar acompanhamentos'}
                    </AddonButton>

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
                        onClick={() => removeItem(index)}
                        aria-label="Remover item"
                      >
                        ✕
                      </RemoveButton>
                    </ItemControls>
                  </ItemInfo>

                  <ItemTotal>
                    R$ {formatPrice(itemTotal)}
                  </ItemTotal>
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

            <div style={{
              fontSize: tokens.typography.fontSize.xs,
              color: tokens.colors.textMuted,
              textAlign: 'center',
              marginTop: tokens.spacing.xs
            }}>
              Taxa de entrega calculada no checkout
            </div>

            <CheckoutButton onClick={handleCheckout}>
              Finalizar Pedido
            </CheckoutButton>
          </Footer>
        )}
      </Drawer>

      {/* ✅ MODAL DE ACOMPANHAMENTOS */}
      {showAddonModal && selectedItemIndex !== null && cart[selectedItemIndex] && (
        <AddonModal
          isOpen={showAddonModal}
          onClose={handleCloseAddons}
          item={cart[selectedItemIndex]}
          itemIndex={selectedItemIndex}
        />
      )}
    </>
  );
};

export default CartDrawer;