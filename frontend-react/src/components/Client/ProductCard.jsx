import React, { useState } from 'react';
import styled from 'styled-components';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { tokens } from '../../styles/tokens';

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
    color: ${tokens.colors.text}; /* ✅ TEXTO ESCURO PARA VISIBILIDADE */
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
  const { addToCart, getItemQuantity } = useCart();
  const { showToast } = useToast();
  const [qty, setQty] = useState(1);

  const handleAdd = () => {
    addToCart(product, qty);
    setQty(1);
    showToast(`${product.name} adicionado ao carrinho!`, 'success');
  };

  const increment = () => setQty(prev => prev + 1);
  const decrement = () => setQty(prev => Math.max(1, prev - 1));

  return (
    <Card>
      <ProductImage>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <ImagePlaceholder>🍔</ImagePlaceholder>
        )}
      </ProductImage>
      
      <Content>
        <ProductName>{product.name}</ProductName>
        {product.description && (
          <ProductDesc>{product.description}</ProductDesc>
        )}
        <ProductPrice>R$ {parseFloat(product.price).toFixed(2)}</ProductPrice>
        
        <Footer>
          <QtyControl>
            <button 
              onClick={decrement}
              aria-label="Diminuir quantidade"
              type="button"
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
  );
};

export default ProductCard;
