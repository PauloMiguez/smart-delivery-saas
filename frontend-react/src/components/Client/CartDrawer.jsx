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
//  STYLED COMPONENTS (LAYOUT REESTRUTURADO ESTILO IFOOD)
// ============================================================
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
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
  max-width: 440px;
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
  background: ${tokens.colors.surface};
  flex-shrink: 0;
`;

const HeaderTitle = styled.h2`
  font-size: ${tokens.typography.fontSize.lg};
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.text};
  margin: 0;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: ${tokens.spacing.xs};
`;

const CloseButton = styled.button`
  background: ${tokens.colors.background || '#f3f4f6'};
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: ${tokens.typography.fontSize.base};
  cursor: pointer;
  color: ${tokens.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: ${tokens.colors.border};
    color: ${tokens.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${tokens.colors.accent};
    outline-offset: 2px;
  }
`;

const CartItems = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${tokens.spacing.md} ${tokens.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing.md};
  background: ${tokens.colors.background || '#f8f9fa'};

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
  background: ${tokens.colors.surface};

  .icon {
    font-size: 64px;
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
    text-align: center;
  }
`;

const CartItem = styled.div`
  background: ${tokens.colors.surface};
  border-radius: ${tokens.radius.md};
  border: 1px solid ${tokens.colors.border};
  padding: ${tokens.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing.sm};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  transition: border-color 0.2s;

  &:hover {
    border-color: ${tokens.colors.accent};
  }
`;

const ItemMainRow = styled.div`
  display: flex;
  gap: ${tokens.spacing.md};
  align-items: flex-start;
`;

const ItemImage = styled.div`
  width: 60px;
  height: 60px;
  border-radius: ${tokens.radius.md};
  background: ${tokens.colors.background};
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid ${tokens.colors.border};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ItemImagePlaceholder = styled.div`
  width: 60px;
  height: 60px;
  border-radius: ${tokens.radius.md};
  background: ${tokens.colors.accentLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: ${tokens.colors.accent};
  flex-shrink: 0;
`;

const ItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.h4`
  font-size: ${tokens.typography.fontSize.sm};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.text};
  margin: 0 0 4px 0;
  line-height: 1.3;
`;

const ItemPriceBase = styled.span`
  font-size: ${tokens.typography.fontSize.xs};
  color: ${tokens.colors.textMuted};
`;

const ItemTotal = styled.div`
  font-size: ${tokens.typography.fontSize.sm};
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.text};
  text-align: right;
  flex-shrink: 0;
`;

const AddonsList = styled.div`
  margin-top: ${tokens.spacing.xs};
  padding: ${tokens.spacing.xs} ${tokens.spacing.sm};
  background: ${tokens.colors.background || '#f9fafb'};
  border-radius: ${tokens.radius.sm};
  border-left: 3px solid ${tokens.colors.accent};
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const AddonItem = styled.div`
  font-size: ${tokens.typography.fontSize.xs};
  color: ${tokens.colors.textMuted};
  display: flex;
  justify-content: space-between;
`;

const AddonButton = styled.button`
  background: none;
  border: 1px dashed ${tokens.colors.accent};
  color: ${tokens.colors.accent};
  font-size: ${tokens.typography.fontSize.xs};
  padding: 4px 10px;
  border-radius: ${tokens.radius.sm};
  cursor: pointer;
  margin-top: ${tokens.spacing.xs};
  transition: all 0.2s ease-in-out;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: ${tokens.typography.fontFamily};
  font-weight: 500;

  &:hover {
    background: ${tokens.colors.accentLight};
  }

  &:focus-visible {
    outline: 2px solid ${tokens.colors.accent};
    outline-offset: 2px;
  }
`;

const ItemFooterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid ${tokens.colors.border};
  padding-top: ${tokens.spacing.xs};
  margin-top: 2px;
`;

const ItemControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacing.sm};
`;

const QtyButton = styled.button`
  width: 26px;
  height: 26px;
  border-radius: ${tokens.radius.sm};
  border: 1px solid ${tokens.colors.border};
  background: ${tokens.colors.surface};
  color: ${tokens.colors.text};
  font-size: ${tokens.typography.fontSize.sm};
  font-weight: bold;
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
`;

const QtyDisplay = styled.span`
  font-size: ${tokens.typography.fontSize.sm};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.text};
  min-width: 20px;
  text-align: center;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${tokens.colors.textMuted};
  cursor: pointer;
  font-size: ${tokens.typography.fontSize.xs};
  padding: ${tokens.spacing.xs};
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease-in-out;
  font-weight: 500;

  &:hover {
    color: ${tokens.colors.error || '#ef4444'};
  }
`;

const Footer = styled.div`
  padding: ${tokens.spacing.md} ${tokens.spacing.lg};
  border-top: 1px solid ${tokens.colors.border};
  flex-shrink: 0;
  background: ${tokens.colors.surface};
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.03);
`;

const SubtotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${tokens.typography.fontSize.base};
  color: ${tokens.colors.textMuted};
  margin-bottom: 4px;

  span:last-child {
    font-weight: ${tokens.typography.fontWeight.bold};
    color: ${tokens.colors.text};
    font-size: ${tokens.typography.fontSize.lg};
  }
`;

const CheckoutButton = styled.button`
  width: 100%;
  padding: 14px;
  background: ${tokens.colors.accent};
  color: ${tokens.colors.surface};
  border: none;
  border-radius: ${tokens.radius.md};
  font-size: ${tokens.typography.fontSize.base};
  font-weight: ${tokens.typography.fontWeight.bold};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  margin-top: ${tokens.spacing.sm};
  font-family: ${tokens.typography.fontFamily};
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${tokens.spacing.xs};

  &:hover:not(:disabled) {
    background: ${tokens.colors.accentHover};
    transform: translateY(-1px);
    box-shadow: ${tokens.shadows.md};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
const CartDrawer = ({ isOpen, onClose, categories = [] }) => {
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

  const handleOpenAddons = (index) => {
    setSelectedItemIndex(index);
    setShowAddonModal(true);
  };

  const handleCloseAddons = () => {
    setShowAddonModal(false);
    setSelectedItemIndex(null);
  };

  const isPrincipalProduct = (item) => {
    if (!item || !item.category) return false;
    const category = categories.find(c => c.name === item.category);
    return category && category.category_type === 'principal';
  };

  const safeSubtotal = parseFloat(subtotal) || 0;

  return (
    <>
      <Overlay $isOpen={isOpen} onClick={onClose} />

      <Drawer $isOpen={isOpen}>
        <Header>
          <HeaderTitle>🛒 Sacola de Compras</HeaderTitle>
          <CloseButton onClick={onClose} aria-label="Fechar carrinho">
            ✕
          </CloseButton>
        </Header>

        <CartItems>
          {cart.length === 0 ? (
            <EmptyCart>
              <div className="icon">🛍️</div>
              <h3>Sua sacola está vazia</h3>
              <p>Explore o cardápio e adicione itens deliciosos para realizar o seu pedido.</p>
            </EmptyCart>
          ) : (
            cart.map((item, index) => {
              const itemTotal = getItemTotal(item);
              const hasAddonsSelected = hasAddons(item);
              const isPrincipal = isPrincipalProduct(item);

              return (
                <CartItem key={item.id || index}>
                  <ItemMainRow>
                    {item.image_url ? (
                      <ItemImage>
                        <img src={item.image_url} alt={item.name} />
                      </ItemImage>
                    ) : (
                      <ItemImagePlaceholder>🍔</ItemImagePlaceholder>
                    )}

                    <ItemInfo>
                      <ItemName>{item.name}</ItemName>
                      <ItemPriceBase>R$ {formatPrice(item.price)} un</ItemPriceBase>
                    </ItemInfo>

                    <ItemTotal>
                      R$ {formatPrice(itemTotal)}
                    </ItemTotal>
                  </ItemMainRow>

                  {/* ACOMPANHAMENTOS SELECIONADOS */}
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

                  {/* BOTÃO DE ADICIONAR/EDITAR ACOMPANHAMENTOS */}
                  {isPrincipal && (
                    <div>
                      <AddonButton onClick={() => handleOpenAddons(index)}>
                        {hasAddonsSelected ? '✏️ Editar acompanhamentos' : '➕ Adicionar acompanhamentos'}
                      </AddonButton>
                    </div>
                  )}

                  {/* CONTROLES DE QUANTIDADE E REMOÇÃO */}
                  <ItemFooterRow>
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
                    </ItemControls>

                    <RemoveButton
                      onClick={() => removeItem(index)}
                      aria-label="Remover item"
                    >
                      🗑️ Remover
                    </RemoveButton>
                  </ItemFooterRow>
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
              marginBottom: tokens.spacing.sm
            }}>
              Taxa de entrega calculada na etapa final
            </div>

            <CheckoutButton onClick={handleCheckout}>
              <span>Avançar para o Checkout</span>
              <span>→</span>
            </CheckoutButton>
          </Footer>
        )}
      </Drawer>

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