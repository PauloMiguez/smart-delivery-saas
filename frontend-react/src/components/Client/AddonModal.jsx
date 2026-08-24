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
//  FUNÇÕES AUXILIARES
// ============================================================
const formatPrice = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
};

const getAddonLabel = (count) => {
  return count === 1 ? 'acompanhamento' : 'acompanhamentos';
};

const DEFAULT_DESCRIPTIONS = {
  'Bebidas': 'Refrigerantes, sucos, águas e mais',
  'Acompanhamentos': 'Batatas, nuggets, anéis de cebola e mais',
  'Adicionais': 'Bacon, queijo, ovos e carnes extras',
  'Sobremesas': 'Doces e sobremesas para finalizar'
};

const CATEGORY_ICONS = {
  'Bebidas': '🥤',
  'Acompanhamentos': '🍟',
  'Adicionais': '🧀',
  'Sobremesas': '🍰'
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

  @media (max-width: 768px) {
    max-width: 100%;
    max-height: 100vh;
    height: 100vh;
    border-radius: 0;
    animation: none;
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  background: white;
`;

// ============================================================
//  SCROLL CONTAINER - TUDO DENTRO DELE (imagem + conteúdo)
// ============================================================
const ScrollContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px 16px;

  @media (max-width: 768px) {
    padding: 0 16px 16px 16px;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 4px;
  }
`;

// ============================================================
//  IMAGEM DO PRODUTO - PRIMEIRO ELEMENTO DO SCROLL
// ============================================================
const ProductImage = styled.div`
  width: 100%;
  height: 240px;
  background: #f0f0f0;
  flex-shrink: 0;
  overflow: hidden;
  margin-bottom: 16px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    height: 45vh;
    min-height: 200px;
    max-height: 400px;
    border-radius: 0;
  }

  @media (min-width: 769px) {
    border-radius: 24px 24px 0 0;
  }
`;

const ProductImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #ccc;
  background: #f5f5f5;
`;

// ============================================================
//  INFORMAÇÕES DO PRODUTO (nome, preço, descrição)
// ============================================================
const ProductInfo = styled.div`
  margin-bottom: 20px;
`;

const ProductName = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: ${props => props.theme.colors.textMain};
`;

const ProductPrice = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  display: inline-block;
  margin-bottom: 6px;
`;

const ProductDescription = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.textMuted};
  margin: 0;
  line-height: 1.5;
`;

// ============================================================
//  GRUPOS DE ACOMPANHAMENTOS (com sticky nos títulos)
// ============================================================
const AddonGroup = styled.div`
  margin-bottom: 24px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 6px 0;
  border-bottom: 2px solid ${props => props.theme.colors.border};
  background: white;
  position: sticky;
  top: 0;
  z-index: 3;
`;

const CategoryIcon = styled.span`
  font-size: 18px;
`;

const GroupTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: ${props => props.theme.colors.textMain};
`;

const GroupDescription = styled.span`
  font-size: 13px;
  color: ${props => props.theme.colors.textMuted};
  font-weight: 400;
  margin-left: 4px;
`;

const AddonItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px 10px 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const AddonInfo = styled.div`
  flex: 1;
  min-width: 100px;
`;

const AddonName = styled.span`
  font-size: 14px;
  font-weight: 500;
  display: block;
  color: ${props => props.theme.colors.textMain};
`;

const AddonPrice = styled.span`
  font-size: 13px;
  color: ${props => props.theme.colors.textMuted};
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const QtyButton = styled.button`
  width: 30px;
  height: 30px;
  border: 1px solid ${props => props.disabled ? '#e0e0e0' : '#ddd'};
  border-radius: 6px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  color: ${props => props.disabled ? '#ccc' : '#333'};
  font-size: 16px;
  &:hover {
    border-color: ${props => props.disabled ? '#e0e0e0' : props.theme.colors.primary};
    color: ${props => props.disabled ? '#ccc' : props.theme.colors.primary};
  }
`;

const Quantity = styled.span`
  font-size: 15px;
  font-weight: 600;
  min-width: 28px;
  text-align: center;
  color: ${props => props.theme.colors.textMain};
`;

// ============================================================
//  FOOTER FIXO (com botões "Fechar" e "Concluir")
// ============================================================
const Footer = styled.div`
  border-top: 1px solid ${props => props.theme.colors.border};
  padding: 14px 16px 16px 16px;
  flex-shrink: 0;
  background: white;

  @media (min-width: 769px) {
    padding: 14px 0 0 0;
  }
`;

const TotalSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const TotalLabel = styled.span`
  font-size: 15px;
  color: ${props => props.theme.colors.textMuted};
`;

const TotalPrice = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
            {/* ✅ SCROLL CONTAINER – TUDO DENTRO (imagem, info, addons) */}
            <ScrollContainer>
              {/* IMAGEM – PRIMEIRO ELEMENTO, ROLA COM O CONTEÚDO */}
              {item.image_url ? (
                <ProductImage>
                  <img src={item.image_url} alt={item.name} loading="lazy" />
                </ProductImage>
              ) : (
                <ProductImagePlaceholder>🍽️</ProductImagePlaceholder>
              )}

              <ProductInfo>
                <ProductName>{item.name}</ProductName>
                <ProductPrice>R$ {formatPrice(item.price)}</ProductPrice>
                {item.description && (
                  <ProductDescription>{item.description}</ProductDescription>
                )}
              </ProductInfo>

              {loading ? (
                <Loading>Carregando acompanhamentos...</Loading>
              ) : groupedAddons && Object.keys(groupedAddons).length > 0 ? (
                Object.keys(groupedAddons).map(category => (
                  <AddonGroup key={category}>
                    <GroupHeader>
                      <CategoryIcon>{getCategoryIcon(category)}</CategoryIcon>
                      <GroupTitle>{category}</GroupTitle>
                      <GroupDescription>{getCategoryDescription(category)}</GroupDescription>
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
                            <QtyButton
                              onClick={() => handleQuantityChange(addon.id, -1)}
                              disabled={qty === 0}
                            >
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
            </ScrollContainer>

            {/* ✅ RODAPÉ FIXO */}
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
                <ConfirmBtn onClick={onClose}>
                  <Check size={18} /> Concluir
                </ConfirmBtn>
              </Actions>
            </Footer>
          </ModalContent>
        </Modal>
      </Overlay>
    </ThemeProvider>
  );
};

export default AddonModal;