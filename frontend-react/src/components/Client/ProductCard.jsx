import React, { useState } from 'react';
import styled from 'styled-components';
import { useCart } from '../../contexts/CartContext';
import { Card, Flex } from '../Shared/Container';

const ProductImage = styled.div`
    width: 100%;
    height: 180px;
    background: ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
    overflow: hidden;
    margin-bottom: ${props => props.theme.spacing.md};
    
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
    }
    
    &:hover img {
        transform: scale(1.05);
    }
`;

const ProductName = styled.h3`
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 4px;
`;

const ProductDesc = styled.p`
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

const ProductPrice = styled.div`
    font-size: 20px;
    font-weight: 700;
    color: ${props => props.theme.colors.primary};
    margin-bottom: ${props => props.theme.spacing.md};
`;

const QtyControl = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    
    button {
        width: 36px;
        height: 36px;
        border: 1.5px solid ${props => props.theme.colors.border};
        border-radius: ${props => props.theme.borderRadius.round};
        background: #fff;
        cursor: pointer;
        font-size: 20px;
        font-weight: 700;
        color: ${props => props.theme.colors.text};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        touch-action: manipulation;
        line-height: 1;
        
        &:hover {
            background: ${props => props.theme.colors.primary};
            color: #fff;
            border-color: ${props => props.theme.colors.primary};
        }
        
        &:active {
            transform: scale(0.92);
        }
        
        /* Garantir que o símbolo seja visível em todos os dispositivos */
        &::before {
            display: block;
        }
    }
    
    span {
        min-width: 28px;
        text-align: center;
        font-weight: 600;
        font-size: 18px;
        color: ${props => props.theme.colors.text};
    }
`;

const AddButton = styled.button`
    padding: 8px 20px;
    background: ${props => props.theme.colors.primary};
    color: #fff;
    border: none;
    border-radius: ${props => props.theme.borderRadius.md};
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
    
    &:hover {
        background: ${props => props.theme.colors.primaryDark};
    }
    
    &:active {
        transform: scale(0.95);
    }
`;

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();
    const [qty, setQty] = useState(1);

    const handleAdd = () => {
        addToCart(product, qty);
        setQty(1);
    };

    return (
        <Card>
            {product.image_url && (
                <ProductImage>
                    <img src={product.image_url} alt={product.name} loading="lazy" />
                </ProductImage>
            )}
            
            <ProductName>{product.name}</ProductName>
            {product.description && (
                <ProductDesc>{product.description}</ProductDesc>
            )}
            <ProductPrice>R$ {parseFloat(product.price).toFixed(2)}</ProductPrice>
            
            <Flex between gap={8}>
                <QtyControl>
                    <button 
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        aria-label="Diminuir quantidade"
                    >
                        −
                    </button>
                    <span>{qty}</span>
                    <button 
                        onClick={() => setQty(qty + 1)}
                        aria-label="Aumentar quantidade"
                    >
                        +
                    </button>
                </QtyControl>
                <AddButton onClick={handleAdd}>
                    Adicionar
                </AddButton>
            </Flex>
        </Card>
    );
};

export default ProductCard;