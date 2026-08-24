import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { X, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

// ============================================================
//  TEMA DO MODAL (para consistência visual)
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
//  FUNÇÕES DE PLURALIZAÇÃO
// ============================================================
const getAddonLabel = (count) => {
  return count === 1 ? 'acompanhamento' : 'acompanhamentos';
};

const getAddonLabelSelected = (count) => {
  if (count === 0) return 'Nenhum acompanhamento selecionado';
  return count === 1 
    ? '1 acompanhamento selecionado' 
    : `${count} acompanhamentos selecionados`;
};

// ============================================================
//  DESCRIÇÕES PADRÃO (FALLBACK)
// ============================================================
const DEFAULT_DESCRIPTIONS = {
  'Bebidas': 'Refrigerantes, sucos, águas e mais',
  'Acompanhamentos': 'Batatas, nuggets, anéis de cebola e mais',
  'Adicionais': 'Bacon, queijo, ovos e carnes extras',
  'Sobremesas': 'Doces e sobremesas para finalizar'
};

// ============================================================
//  ÍCONES POR CATEGORIA (opcional, para enriquecer visual)
// ============================================================
const CATEGORY_ICONS = {
  'Bebidas': '🥤',
  'Acompanhamentos': '🍟',
  'Adicionais': '🧀',
  'Sobremesas': '🍰'
};

// ============================================================
//  STYLED COMPONENTS - COM DESTAQUE PARA CATEGORIAS
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
  max-height: 85vh;
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
  padding: 24px 20px 20px 20px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const TitleSection = styled.div`
  flex: 1;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: ${props => props.theme.colors.textMain};
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.textMuted};
  margin: 0;
`;

const CloseButton = styled.button`
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: #ebebeb;
  }
`;

const ProductInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: ${props => props.theme.colors.background};
  border-radius: 16px;
  margin-bottom: 20px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const ProductImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  object-fit: cover;
`;

const ProductDetails = styled.div`
  flex: 1;
`;

const ProductName = styled.h3`
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: ${props => props.theme.colors.textMain};
`;

const ProductPrice = styled.span`
  font-size: 14px;
  color: ${props => props.theme.colors.primary};
  font-weight: 600;
`;

const AddonsSection = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 4px;
  }
`;

// ✅ GRUPO DE CADA CATEGORIA - COM SEPARADOR E FUNDO SUAVE
const AddonGroup = styled.div`
  margin-bottom: 24px;
  background: ${props => props.theme.colors.background};
  border-radius: 12px;
  padding: 8px 4px 12px 4px;
  border: 1px solid ${props => props.theme.colors.border};
  transition: all 0.2s ease;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

// ✅ CABEÇALHO DA CATEGORIA - COM MARCAÇÃO VISUAL
const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px 8px 16px;
  margin-bottom: 8px;
  border-left: 4px solid ${props => props.theme.colors.primary};
  background: ${props => props.theme.colors.surface};
  border-radius: 8px;
  position: relative;
`;

// ✅ TÍTULO DA CATEGORIA - DESTACADO
const GroupTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: ${props => props.theme.colors.textMain};
  letter-spacing: -0.01em;
`;

// ✅ DESCRIÇÃO DA CATEGORIA - COM COR MAIS SUAVE
const GroupDescription = styled.p`
  font-size: 13px;
  color: ${props => props.theme.colors.textMuted};
  margin: 2px 0 0 0;
  font-weight: 400;
`;

// ✅ ÍCONE DA CATEGORIA
const CategoryIcon = styled.span`
  font-size: 18px;
  margin-right: 4px;
  opacity: 0.8;
`;

// ✅ ITEM DE ACOMPANHAMENTO - COM INDENTAÇÃO E HOVER
const AddonItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 10px 20px;
  border-radius: 8px;
  margin-bottom: 2px;
  transition: background 0.2s ease;
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
  gap: 8px;
`;

const QuantityButton = styled.button`
  width: 32px;
  height: 32px;
  border: 1px solid ${props => props.disabled ? '#e0e0e0' : '#ddd'};
  border-radius: 8px;
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
  font-size: 16px;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
  color: ${props => props.theme.colors.textMain};
`;

const Footer = styled.div`
  border-top: 1px solid ${props => props.theme.colors.border};
  padding-top: 16px;
  margin-top: 4px;
`;

const TotalSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
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

const Button = styled.button`
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const CancelButton = styled(Button)`
  background: #f5f5f5;
  color: #666;

  &:hover {
    background: #ebebeb;
  }
`;

const ConfirmButton = styled(Button)`
  background: ${props => props.theme.colors.primary};
  color: white;

  &:hover {
    background: #c0392b;
  }
`;

const AddonBadge = styled.span`
  font-size: 11px;
  color: #fff;
  background: ${props => props.theme.colors.primary};
  padding: 2px 10px;
  border-radius: 12px;
  margin-left: 8px;
  font-weight: 600;
`;

const Loading = styled.div`
  text-align: center;
  padding: 20px;
  color: ${props => props.theme.colors.textMuted};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
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

  // Carregar addons e categorias quando o modal abrir
  useEffect(() => {
    if (isOpen && item) {
      console.log('🔍 [ADDON] Modal aberto para:', item.name);
      loadData();
    }
  }, [isOpen, item]);

  const loadData = async () => {
    setLoading(true);
    try {
      const tenantId = tenant || 'fireburger';
      console.log('📤 [ADDON] Buscando dados para tenant:', tenantId);

      const addonsRes = await api.get(`/products/addons?tenant=${tenantId}`);
      const addons = addonsRes.data.data || [];
      console.log(`✅ [ADDON] ${addons.length} addons encontrados`);

      const filtered = addons.filter(a => a.id !== item.id);
      setAvailableAddons(filtered);

      const categoriesRes = await api.get(`/categories?tenant=${tenantId}`);
      const categoriesData = categoriesRes.data.data || [];
      setCategories(categoriesData);
      console.log(`✅ [CATEGORIAS] ${categoriesData.length} categorias carregadas`);

      if (filtered.length === 0) {
        showToast('Nenhum acompanhamento disponível para este produto', 'info');
      }
    } catch (error) {
      console.error('❌ [ADDON] Erro ao buscar dados:', error);
      showToast('Erro ao carregar acompanhamentos', 'error');
    }
    setLoading(false);
  };

  // Inicializar com addons já selecionados
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

  // Calcular total (preço base + addons)
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

  // Obter descrição da categoria (dinâmica)
  const getCategoryDescription = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    if (category?.description) {
      return category.description;
    }
    return DEFAULT_DESCRIPTIONS[categoryName] || '';
  };

  // Obter ícone da categoria (se disponível)
  const getCategoryIcon = (categoryName) => {
    return CATEGORY_ICONS[categoryName] || '📌';
  };

  const handleQuantityChange = (addonId, delta) => {
    const currentQty = selectedAddons[addonId] || 0;
    const newQty = Math.max(0, currentQty + delta);

    setSelectedAddons(prev => ({
      ...prev,
      [addonId]: newQty
    }));

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
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(addon);
    return groups;
  }, {});

  const totalAddonsCount = getTotalAddonsCount();

  return (
    <ThemeProvider theme={modalTheme}>
      <Overlay onClick={onClose}>
        <Modal onClick={e => e.stopPropagation()}>
          <ModalContent>
            <Header>
              <TitleSection>
                <Title>🍔 Acompanhamentos</Title>
                <Subtitle>Personalize seu pedido</Subtitle>
              </TitleSection>
              <CloseButton onClick={onClose}>
                <X size={20} />
              </CloseButton>
            </Header>

            <ProductInfo>
              {item.image_url && (
                <ProductImage src={item.image_url} alt={item.name} />
              )}
              <ProductDetails>
                <ProductName>
                  {item.name}
                  {totalAddonsCount > 0 && (
                    <AddonBadge>
                      {totalAddonsCount} {getAddonLabel(totalAddonsCount)}
                    </AddonBadge>
                  )}
                </ProductName>
                <ProductPrice>R$ {formatPrice(item.price)}</ProductPrice>
              </ProductDetails>
            </ProductInfo>

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
                        <GroupDescription>
                          {getCategoryDescription(category)}
                        </GroupDescription>
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
                            <QuantityButton
                              onClick={() => handleQuantityChange(addon.id, -1)}
                              disabled={qty === 0}
                            >
                              <Minus size={16} />
                            </QuantityButton>
                            <Quantity>{qty}</Quantity>
                            <QuantityButton onClick={() => handleQuantityChange(addon.id, 1)}>
                              <Plus size={16} />
                            </QuantityButton>
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
                <CancelButton onClick={onClose}>
                  Fechar
                </CancelButton>
                <ConfirmButton onClick={onClose}>
                  <Check size={18} />
                  Concluir
                </ConfirmButton>
              </Actions>
            </Footer>
          </ModalContent>
        </Modal>
      </Overlay>
    </ThemeProvider>
  );
};

export default AddonModal;