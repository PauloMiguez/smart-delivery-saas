import React, { useState } from 'react';
import styled from 'styled-components';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { tokens } from '../../styles/tokens';
import ImageModal from './ImageModal';

// ============================================================
//  STYLED COMPONENTS - USANDO TOKENS ATUALIZADOS
// ============================================================
const Card = styled.div`
  background: ${tokens.colors.surface};
  border-radius: ${tokens.radius.md};
  border: 1px solid ${tokens.colors.border};
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  box-shadow: ${tokens.shadows.sm};
  
  &:hover {
    box-shadow: ${tokens.shadows.md};
    transform: translateY(-2px);
  }
`;

const ProductImage = styled.div`
  width: 100%;
  height: 180px;
  background: ${tokens.colors.background};
  border-radius: ${tokens.radius.md} ${tokens.radius.md} 0 0;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease-in-out;
  }
  
  ${Card}:hover & img {
    transform: scale(1.03);
  }
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  background: ${tokens.colors.accentLight};
  color: ${tokens.colors.accent};
  cursor: default;
`;

// ✅ BOTÃO DE ZOOM SOBRE A IMAGEM
const ZoomButton = styled.button`
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.8);
  backdrop-filter: blur(4px);
  
  ${ProductImage}:hover & {
    opacity: 1;
    transform: scale(1);
  }
  
  &:hover {
    background: rgba(0, 0, 0, 0.85);
    transform: scale(1.1);
  }
`;

// ✅ HINT DE ZOOM
const ZoomHint = styled.div`
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.3s ease;
  white-space: nowrap;
  pointer-events: none;
  
  ${ProductImage}:hover & {
    opacity: 1;
  }
  
  span {
    margin-right: 4px;
  }
`;

const Content = styled.div`
  padding: ${tokens.spacing.md};
`;

const ProductName = styled.h3`
  font-size: ${tokens.typography.fontSize.base};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.text};
  margin: 0 0 ${tokens.spacing.xs} 0;
  line-height: ${tokens.typography.lineHeight.tight};
`;

const ProductDesc = styled.p`
  font-size: ${tokens.typography.fontSize.sm};
  color: ${tokens.colors.textSecondary};
  margin: 0 0 ${tokens.spacing.md} 0;
  line-height: ${tokens.typography.lineHeight.normal};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProductPrice = styled.div`
  font-size: ${tokens.typography.fontSize.lg};
  font-weight: ${tokens.typography.fontWeight.bold};
  color: ${tokens.colors.accent};
  margin-bottom: ${tokens.spacing.md};
`;

// ============================================================
//  ✅ CONTROLE DE QUANTIDADE - CORRIGIDO
//  BOTÕES COM TEXTO ESCURO PARA VISIBILIDADE
// ============================================================
const QtyControl = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacing.sm};
  background: ${tokens.colors.background};
  padding: 2px;
  border-radius: ${tokens.radius.md};
  border: 1.5px solid ${tokens.colors.border};
  
  button {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: ${tokens.radius.sm};
    background: ${tokens.colors.surface};
    cursor: pointer;
    font-size: ${tokens.typography.fontSize.lg};
    font-weight: ${tokens.typography.fontWeight.medium};
    color: ${tokens.colors.text};
    transition: all 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    font-family: ${tokens.typography.fontFamily};
    
    &:hover:not(:disabled) {
      background: ${tokens.colors.accentLight};
      color: ${tokens.colors.accent};
    }
    
    &:active:not(:disabled) {
      transform: scale(0.92);
    }
    
    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    
    &:focus-visible {
      outline: 2px solid ${tokens.colors.accent};
      outline-offset: 2px;
    }
  }
  
  span {
    min-width: 24px;
    text-align: center;
    font-weight: ${tokens.typography.fontWeight.semibold};
    font-size: ${tokens.typography.fontSize.base};
    color: ${tokens.colors.text};
  }
`;

const AddButton = styled.button`
  padding: ${tokens.spacing.sm} ${tokens.spacing.md};
  background: ${tokens.colors.accent};
  color: ${tokens.colors.surface};
  border: none;
  border-radius: ${tokens.radius.md};
  font-weight: ${tokens.typography.fontWeight.semibold};
  font-size: ${tokens.typography.fontSize.sm};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;
  font-family: ${tokens.typography.fontFamily};
  
  &:hover:not(:disabled) {
    background: ${tokens.colors.accentHover};
    transform: translateY(-1px);
    box-shadow: ${tokens.shadows.md};
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:focus-visible {
    outline: 2px solid ${tokens.colors.accent};
    outline-offset: 2px;
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${tokens.spacing.sm};
  flex-wrap: wrap;
`;

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [qty, setQty] = useState(1);
  const [showImageModal, setShowImageModal] = useState(false);

  const hasImage = product.image_url && product.image_url.trim() !== '';

  // ============================================================
  //  ABRIR MODAL DA IMAGEM
  // ============================================================
  const openImageModal = (e) => {
    e.stopPropagation();
    if (hasImage) {
      setShowImageModal(true);
    }
  };

  // ============================================================
  //  FECHAR MODAL DA IMAGEM
  // ============================================================
  const closeImageModal = () => {
    setShowImageModal(false);
  };

  // ============================================================
  //  INCREMENTAR QUANTIDADE
  // ============================================================
  const increment = () => {
    setQty(prev => prev + 1);
  };

  // ============================================================
  //  DECREMENTAR QUANTIDADE
  // ============================================================
  const decrement = () => {
    setQty(prev => Math.max(1, prev - 1));
  };

  // ============================================================
  //  ADICIONAR AO CARRINHO
  // ============================================================
  const handleAdd = () => {
    addToCart(product, qty);
    setQty(1);
    showToast(`${product.name} adicionado ao carrinho!`, 'success');
  };

  // ============================================================
  //  FORMATAR PREÇO
  // ============================================================
  const formatPrice = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
  };

  return (
    <>
      <Card>
        <ProductImage onClick={openImageModal}>
          {hasImage ? (
            <>
              <img src={product.image_url} alt={product.name} loading="lazy" />
              <ZoomHint>
                <span>🔍</span> Clique para ampliar
              </ZoomHint>
              <ZoomButton onClick={openImageModal} aria-label="Ampliar imagem">
                🔍
              </ZoomButton>
            </>
          ) : (
            <ImagePlaceholder>🍔</ImagePlaceholder>
          )}
        </ProductImage>
        
        <Content>
          <ProductName>{product.name}</ProductName>
          {product.description && (
            <ProductDesc>{product.description}</ProductDesc>
          )}
          <ProductPrice>R$ {formatPrice(product.price)}</ProductPrice>
          
          <Footer>
            <QtyControl>
              <button 
                onClick={decrement}
                aria-label="Diminuir quantidade"
                type="button"
                disabled={qty <= 1}
              >
                −
              </button>
              <span>{qty}</span>
              <button 
                onClick={increment}
                aria-label="Aumentar quantidade"
                type="button"
              >
                +
              </button>
            </QtyControl>
            <AddButton onClick={handleAdd} type="button">
              Adicionar
            </AddButton>
          </Footer>
        </Content>
      </Card>

      {/* ✅ MODAL DE IMAGEM EM TELA CHEIA */}
      {showImageModal && hasImage && (
        <ImageModal
          src={product.image_url}
          alt={product.name}
          onClose={closeImageModal}
        />
      )}
    </>
  );
};

export default ProductCard;