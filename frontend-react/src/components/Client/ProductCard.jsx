import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();
    const [qty, setQty] = useState(1);

    const handleAdd = () => {
        addToCart(product, qty);
        setQty(1);
    };

    return (
        <div className="product-card">
            {product.image_url && (
                <div className="product-image">
                    <img 
                        src={product.image_url} 
                        alt={product.name} 
                        loading="lazy"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                </div>
            )}
            <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-desc">{product.description}</p>
                <p className="product-price">R$ {parseFloat(product.price).toFixed(2)}</p>
            </div>
            <div className="product-actions">
                <div className="qty-control">
                    <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                    <span>{qty}</span>
                    <button onClick={() => setQty(qty + 1)}>+</button>
                </div>
                <button className="btn-add" onClick={handleAdd}>Adicionar</button>
            </div>
        </div>
    );
};

export default ProductCard;