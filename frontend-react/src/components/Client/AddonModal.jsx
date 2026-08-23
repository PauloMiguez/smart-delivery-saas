import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

// ============================================================
//  FUNÇÃO PARA FORMATAR PREÇO
// ============================================================
const formatPrice = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
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
  color: #1a1a1a;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
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
  background: #f8f9fa;
  border-radius: 16px;
  margin-bottom: 20px;
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
  color: #1a1a1a;
`;

const ProductPrice = styled.span`
  font-size: 14px;
  color: #e74c3c;
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

const AddonGroup = styled.div`
  margin-bottom: 20px;
`;

const GroupHeader = styled.div`
  margin-bottom: 12px;
`;

const GroupTitle = styled.h4`
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1a1a1a;
`;

const GroupDescription = styled.p`
  font-size: 13px;
  color: #888;
  margin: 0;
`;

const AddonItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px;
  border-radius: 12px;
  margin-bottom: 4px;
  transition: background 0.2s;

  &:hover {
    background: #f8f9fa;
  }
`;

const AddonInfo = styled.div`
  flex: 1;
`;

const AddonName = styled.span`
  font-size: 14px;
  font-weight: 500;
  display: block;
  color: #1a1a1a;
`;

const AddonPrice = styled.span`
  font-size: 13px;
  color: #888;
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
    border-color: ${props => props.disabled ? '#e0e0e0' : '#e74c3c'};
    color: ${props => props.disabled ? '#ccc' : '#e74c3c'};
  }
`;

const Quantity = styled.span`
  font-size: 16px;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
  color: #1a1a1a;
`;

const Footer = styled.div`
  border-top: 1px solid #f0f0f0;
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
  color: #666;
`;

const TotalPrice = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: #e74c3c;
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
  background: #e74c3c;
  color: white;

  &:hover {
    background: #c0392b;
  }
`;

const AddonBadge = styled.span`
  font-size: 11px;
  color: #fff;
  background: #e74c3c;
  padding: 2px 10px;
  border-radius: 12px;
  margin-left: 8px;
  font-weight: 600;
`;

const Loading = styled.div`
  text-align: center;
  padding: 20px;
  color: #888;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: #888;
`;

// ============================================================
//  COMPONENTE PRINCIPAL - VERSÃO CORRIGIDA
// ============================================================
const AddonModal = ({ isOpen, onClose, item, itemIndex }) => {
    const { tenant } = useTenant();
    const { addAddonToItem, removeAddonFromItem, updateAddonQuantity } = useCart();
    const { showToast } = useToast();
    const [selectedAddons, setSelectedAddons] = useState({});
    const [totalPrice, setTotalPrice] = useState(0);
    const [availableAddons, setAvailableAddons] = useState([]);
    const [categories, setCategories] = useState([]); // ✅ PARA DESCRIÇÕES
    const [loading, setLoading] = useState(false);

    // ✅ Carregar addons E CATEGORIAS quando o modal abrir
    useEffect(() => {
        if (isOpen && item) {
            console.log('🔍 [ADDON] Modal aberto para:', item.name);
            loadData();
        }
    }, [isOpen, item]);

    // ✅ Carregar addons e categorias
    const loadData = async () => {
        setLoading(true);
        try {
            const tenantId = tenant || 'fireburger';
            console.log('📤 [ADDON] Buscando dados para tenant:', tenantId);

            // Buscar addons
            const addonsRes = await api.get(`/products/addons?tenant=${tenantId}`);
            const addons = addonsRes.data.data || [];
            console.log(`✅ [ADDON] ${addons.length} addons encontrados`);

            // Filtrar para não mostrar o próprio item
            const filtered = addons.filter(a => a.id !== item.id);
            setAvailableAddons(filtered);

            // ✅ Buscar categorias para descrições
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

    // ✅ Inicializar com os addons já selecionados
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

    // ✅ Calcular total (preço base + addons)
    useEffect(() => {
        if (!item) return;

        let total = parseFloat(item.price) || 0;
        total = total * (item.qty || 1);

        Object.keys(selectedAddons).forEach(addonId => {
            const qty = selectedAddons[addonId] || 0;
            const addon = availableAddons?.find(a => a.id === parseInt(addonId));
            if (addon) {
                const addonPrice = parseFloat(addon.price) || 0;
                total += addonPrice * qty;
            }
        });
        setTotalPrice(total);
    }, [selectedAddons, item, availableAddons]);

    if (!isOpen || !item) return null;

    // ✅ Função para obter descrição da categoria (dinâmica)
    const getCategoryDescription = (categoryName) => {
        // Buscar no backend primeiro
        const category = categories.find(c => c.name === categoryName);
        if (category?.description) {
            return category.description;
        }
        // Fallback para descrições padrão
        return DEFAULT_DESCRIPTIONS[categoryName] || '';
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

    return (
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
                                <AddonBadge>
                                    {getTotalAddonsCount()} acompanhamentos
                                </AddonBadge>
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
                                        <GroupTitle>{category}</GroupTitle>
                                        {/* ✅ DESCRIÇÃO DINÂMICA */}
                                        <GroupDescription>
                                            {getCategoryDescription(category)}
                                        </GroupDescription>
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
                                {getTotalAddonsCount() > 0
                                    ? `${getTotalAddonsCount()} acompanhamento(s) selecionado(s)`
                                    : 'Nenhum acompanhamento selecionado'}
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
    );
};

export default AddonModal;