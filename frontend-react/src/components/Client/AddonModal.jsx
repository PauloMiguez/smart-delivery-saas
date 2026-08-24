import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { X, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

// ============================================================
//  TEMA DO MODAL
// ============================================================
const modalTheme = {
  colors: {
    primary: '#e74c3c',
    primaryLight: '#fef0ee',
    background: '#fafafa',
    surface: '#ffffff',
    border: '#f0f0f0',
    borderDark: '#e0e0e0',
    textMain: '#1a1a1a',
    textMuted: '#888',
    textSubtle: '#aaa',
  }
};

// ============================================================
//  FUNÇÃO PARA FORMATAR PREÇO
// ============================================================
const formatPrice = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
};

// ============================================================
//  PLURALIZAÇÃO
// ============================================================
const getAddonLabel = (count) => {
  return count === 1 ? 'acompanhamento' : 'acompanhamentos';
};

// ============================================================
//  DESCRIÇÕES PADRÃO
// ============================================================
const DEFAULT_DESCRIPTIONS = {
  'Bebidas': 'Refrigerantes, sucos, águas e mais',
  'Acompanhamentos': 'Batatas, nuggets, anéis de cebola e mais',
  'Adicionais': 'Bacon, queijo, ovos e carnes extras',
  'Sobremesas': 'Doces e sobremesas para finalizar'
};

// ============================================================
//  ÍCONES POR CATEGORIA
// ============================================================
const CATEGORY_ICONS = {
  'Bebidas': '🥤',
  'Acompanhamentos': '🍟',
  'Adicionais': '🧀',
  'Sobremesas': '🍰'
};

// ============================================================
//  STYLED COMPONENTS - COMPACTOS
// ============================================================

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.3s ease;
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Modal = styled.div`
  background: white;
  width: 100%;
  max-width: 500px;
  max-height: 92vh;
  border-radius: 24px 24px 0 0;
  padding: 0;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`;

const ModalContent = styled.div`
  padding: 16px 16px 12px 16px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

// ============================================================
//  HEADER COMPACTO
// ============================================================
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  padding: 0 4px;
`;

const TitleSection = styled.div`
  flex: 1;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 2px 0;
  color: ${props => props.theme.colors.textMain};
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: ${props => props.theme.colors.textMuted};
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  color: #999;
  font-size: 20px;
  &:hover {
    background: #f0f0f0;
    color: #333;
  }
`;

// ============================================================
//  PRODUCT INFO - COMPACTO E SEM IMAGEM (TEXTO APENAS)
// ============================================================
const ProductInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: ${props => props.theme.colors.background};
  border-radius: 12px;
  margin-bottom: 12px;
  border: 1px solid ${props => props.theme.colors.border};
  flex-shrink: 0;
`;

const ProductDetails = styled.div`
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  min-width: 0;
`;

const ProductName = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.textMain};
  word-break: break-word;
`;

const AddonBadge = styled.span`
  font-size: 12px;
  color: #fff;
  background: ${props => props.theme.colors.primary};
  padding: 2px 12px;
  border-radius: 20px;
  font-weight: 600;
  display: inline-block;
  white-space: nowrap;
`;

const ProductPrice = styled.span`
  font-size: 14px;
  color: ${props => props.theme.colors.primary};
  font-weight: 700;
  margin-left: auto;
  white-space: nowrap;
`;

// ============================================================
//  LISTAGEM DE ACOMPANHAMENTOS - PRIORIDADE MÁXIMA
// ============================================================
const AddonsSection = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 10px;
  padding-right: 4px;
  min-height: 100px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 4px;
  }
`;

const AddonGroup = styled.div`
  margin-bottom: 16px;
  background: ${props => props.theme.colors.background};
  border-radius: 10px;
  padding: 6px 4px 8px 4px;
  border: 1px solid ${props => props.theme.colors.border};
  &:last-child {
    margin-bottom: 0;
  }
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 14px;
  margin-bottom: 4px;
  border-left: 3px solid ${props => props.theme.colors.primary};
  background: transparent;
`;

const GroupTitle = styled.h4`
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: ${props => props.theme.colors.textMain};
`;

const GroupDescription = styled.p`
  font-size: 12px;
  color: ${props => props.theme.colors.textMuted};
  margin: 0;
  font-weight: 400;
`;

const CategoryIcon = styled.span`
  font-size: 16px;
  margin-right: 4px;
`;

const AddonItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 8px 8px 16px;
  border-radius: 6px;
  margin-bottom: 1px;
  transition: background 0.15s ease;
  border-left: 2px solid transparent;

  &:hover {
    background: ${props => props.theme.colors.primaryLight};
    border-left-color: ${props => props.theme.colors.primary};
  }
  &:last-child {
    margin-bottom: 0;
  }
`;

const AddonInfo = styled.div`
  flex: 1;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const AddonName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.textMain};
`;

const AddonPrice = styled.span`
  font-size: 12px;
  color: ${props => props.theme.colors.textMuted};
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const QtyButton = styled.button`
  width: 28px;
  height: 28px;
  border: 1px solid ${props => props.disabled ? '#e0e0e0' : '#ddd'};
  border-radius: 6px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  color: ${props => props.disabled ? '#ccc' : '#333'};
  &:hover {
    border-color: ${props => props.disabled ? '#e0e0e0' : props.theme.colors.primary};
    color: ${props => props.disabled ? '#ccc' : props.theme.colors.primary};
  }
`;

const Quantity = styled.span`
  font-size: 15px;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
  color: ${props => props.theme.colors.textMain};
`;

// ============================================================
//  FOOTER COMPACTO
// ============================================================
const Footer = styled.div`
  border-top: 1px solid ${props => props.theme.colors.border};
  padding-top: 10px;
  margin-top: 4px;
  flex-shrink: 0;
`;

const TotalSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 0 4px;
`;

const TotalLabel = styled.span`
  font-size: 14px;
  color: ${props => props.theme.colors.textMuted};
`;

const TotalPrice = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  &:active {
    transform: scale(0.96);
  }
`;

const CancelBtn = styled(ActionButton)`
  background: #f0f0f0;
  color: #666;
  &:hover {
    background: #e5e5e5;
  }
`;

const ConfirmBtn = styled(ActionButton)`
  background: ${props => props.theme.colors.primary};
  color: white;
  &:hover {
    background: #c0392b;
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 30px 0;
  color: ${props => props.theme.colors.textMuted};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 30px 0;
  color: ${props => props.theme.colors.textMuted};
`;

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
const AddonModal = ({ isOpen, onClose, item, itemIndex }) => {
  const { tenant } = useTenant();
  const { addAddonToItem, removeAddonFromItem, updateAddonQuantity } = useCart();
  const { showToast } = useToast();
  const [selectedAddons, setSelectedAddons] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && item) loadData();
  }, [isOpen, item]);

  const loadData = async () => {
    setLoading(true);
    try {
      const tenantId = tenant || 'fireburger';
      const addonsRes = await api.get(`/products/addons?tenant=${tenantId}`);
      const addons = addonsRes.data.data || [];
      const filtered = addons.filter(a => a.id !== item.id);
      setAvailableAddons(filtered);

      const categoriesRes = await api.get(`/categories?tenant=${tenantId}`);
      setCategories(categoriesRes.data.data || []);

      if (filtered.length === 0) {
        showToast('Nenhum acompanhamento disponível para este produto', 'info');
      }
    } catch (error) {
      console.error('❌ [ADDON] Erro:', error);
      showToast('Erro ao carregar acompanhamentos', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (item && item.addons) {
      const initial = {};
      item.addons.forEach(addon => {
        initial[addon.id] = addon.quantity || 1;
      });
      setSelectedAddons(initial);
    } else {
      setSelectedAddons({});
    }
  }, [item]);

  useEffect(() => {
    if (!item) return;
    let total = parseFloat(item.price) || 0;
    total = total * (item.qty || 1);
    Object.keys(selectedAddons).forEach(addonId => {
      const qty = selectedAddons[addonId] || 0;
      const addon = availableAddons?.find(a => a.id === parseInt(addonId));
      if (addon) {
        total += addon.price * qty;
      }
    });
    setTotalPrice(total);
  }, [selectedAddons, item, availableAddons]);

  if (!isOpen || !item) return null;

  const getCategoryDescription = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.description || DEFAULT_DESCRIPTIONS[categoryName] || '';
  };

  const getCategoryIcon = (categoryName) => {
    return CATEGORY_ICONS[categoryName] || '📌';
  };

  const handleQuantityChange = (addonId, delta) => {
    const currentQty = selectedAddons[addonId] || 0;
    const newQty = Math.max(0, currentQty + delta);
    setSelectedAddons(prev => ({ ...prev, [addonId]: newQty }));

    if (newQty === 0) {
      removeAddonFromItem(itemIndex, addonId);
    } else {
      const addon = availableAddons?.find(a => a.id === parseInt(addonId));
      if (addon) {
        if (currentQty === 0) {
          addAddonToItem(itemIndex, addon);
        } else {
          updateAddonQuantity(itemIndex, addonId, newQty);
        }
      }
    }
  };

  const getTotalAddonsCount = () => {
    return Object.values(selectedAddons).reduce((sum, qty) => sum + qty, 0);
  };

  const groupedAddons = availableAddons?.reduce((groups, addon) => {
    const category = addon.category || 'Adicionais';
    if (!groups[category]) groups[category] = [];
    groups[category].push(addon);
    return groups;
  }, {});

  const totalAddonsCount = getTotalAddonsCount();

  return (
    <ThemeProvider theme={modalTheme}>
      <Overlay onClick={onClose}>
        <Modal onClick={e => e.stopPropagation()}>
          <ModalContent>

            {/* HEADER COMPACTO */}
            <Header>
              <TitleSection>
                <Title>🍔 Acompanhamentos</Title>
                <Subtitle>Personalize seu pedido</Subtitle>
              </TitleSection>
              <CloseButton onClick={onClose}>✕</CloseButton>
            </Header>

            {/* INFO DO PRODUTO - COMPACTO (SEM IMAGEM) */}
            <ProductInfo>
              <ProductDetails>
                <ProductName>{item.name}</ProductName>
                {totalAddonsCount > 0 && (
                  <AddonBadge>{totalAddonsCount} {getAddonLabel(totalAddonsCount)}</AddonBadge>
                )}
                <ProductPrice>R$ {formatPrice(item.price)}</ProductPrice>
              </ProductDetails>
            </ProductInfo>

            {/* LISTAGEM DE ACOMPANHAMENTOS - PRIORIDADE */}
            <AddonsSection>
              {loading ? (
                <Loading>Carregando acompanhamentos...</Loading>
              ) : groupedAddons && Object.keys(groupedAddons).length > 0 ? (
                Object.keys(groupedAddons).map(category => (
                  <AddonGroup key={category}>
                    <GroupHeader>
                      <CategoryIcon>{getCategoryIcon(category)}</CategoryIcon>
                      <div>
                        <GroupTitle>{category}</GroupTitle>
                        <GroupDescription>{getCategoryDescription(category)}</GroupDescription>
                      </div>
                    </GroupHeader>
                    {groupedAddons[category].map(addon => {
                      const qty = selectedAddons[addon.id] || 0;
                      return (
                        <AddonItem key={addon.id}>
                          <AddonInfo>
                            <AddonName>{addon.name}</AddonName>
                            <AddonPrice>R$ {formatPrice(addon.price)}</AddonPrice>
                          </AddonInfo>
                          <QuantityControls>
                            <QtyButton onClick={() => handleQuantityChange(addon.id, -1)} disabled={qty === 0}>
                              <Minus size={14} />
                            </QtyButton>
                            <Quantity>{qty}</Quantity>
                            <QtyButton onClick={() => handleQuantityChange(addon.id, 1)}>
                              <Plus size={14} />
                            </QtyButton>
                          </QuantityControls>
                        </AddonItem>
                      );
                    })}
                  </AddonGroup>
                ))
              ) : (
                <EmptyState>
                  {loading ? 'Carregando...' : 'Nenhum acompanhamento disponível para este produto'}
                </EmptyState>
              )}
            </AddonsSection>

            {/* FOOTER COMPACTO */}
            <Footer>
              <TotalSection>
                <TotalLabel>
                  {totalAddonsCount === 0
                    ? 'Nenhum acompanhamento selecionado'
                    : `${totalAddonsCount} ${totalAddonsCount === 1 ? 'acompanhamento selecionado' : 'acompanhamentos selecionados'}`
                  }
                </TotalLabel>
                <TotalPrice>R$ {formatPrice(totalPrice)}</TotalPrice>
              </TotalSection>
              <Actions>
                <CancelBtn onClick={onClose}>Fechar</CancelBtn>
                <ConfirmBtn onClick={onClose}><Check size={18} /> Concluir</ConfirmBtn>
              </Actions>
            </Footer>

          </ModalContent>
        </Modal>
      </Overlay>
    </ThemeProvider>
  );
};

export default AddonModal;