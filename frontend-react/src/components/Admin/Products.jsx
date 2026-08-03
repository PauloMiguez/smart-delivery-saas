import React from 'react';
import styled from 'styled-components';
import {
    ProductsContainer,
    TableWrapper,
    Table,
    Badge,
    ActionButton,
    ActionContainer,
    MobileOrderCard,
    MobileOrderRow,
    MobileActions
} from './AdminLayout.styled';
import ProductFilters from './ProductFilters';
import Pagination from '../Shared/Pagination';

const Products = ({
    products,
    filteredProducts,
    categories,
    currentItems,
    currentPage,
    totalPages,
    onPageChange,
    onFilter,
    onAddProduct,
    onEditProduct,
    onDeleteProduct
}) => {
    return (
        <ProductsContainer>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '16px', 
                flexWrap: 'wrap', 
                gap: '8px' 
            }}>
                <h3 style={{ margin: 0 }}>Gerenciar Produtos</h3>
                <ActionButton onClick={onAddProduct}>
                    + Adicionar Produto
                </ActionButton>
            </div>
            
            <ProductFilters 
                categories={categories}
                onFilter={onFilter}
            />
            
            {filteredProducts.length === 0 ? (
                <p style={{ color: '#888', padding: '20px 0' }}>
                    {products.length === 0 ? 'Nenhum produto cadastrado.' : 'Nenhum produto encontrado com os filtros aplicados.'}
                </p>
            ) : (
                <>
                    <TableWrapper className="desktop-table">
                        <Table>
                            <thead>
                                <tr>
                                    <th>Imagem</th>
                                    <th>Nome</th>
                                    <th>Preço</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            {p.image_url ? (
                                                <img 
                                                    src={p.image_url} 
                                                    alt={p.name} 
                                                    style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }}
                                                />
                                            ) : (
                                                <span style={{ color: '#ccc', fontSize: 18 }}>📦</span>
                                            )}
                                        </td>
                                        <td><strong>{p.name}</strong></td>
                                        <td>R$ {parseFloat(p.price).toFixed(2)}</td>
                                        <td>
                                            <Badge $status={p.active ? 'active' : 'inactive'}>
                                                {p.active ? '🟢 Ativo' : '🔴 Inativo'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <ActionContainer>
                                                <ActionButton 
                                                    $variant="edit" 
                                                    onClick={() => onEditProduct(p)}
                                                >
                                                    ✏️
                                                </ActionButton>
                                                <ActionButton 
                                                    $variant="delete" 
                                                    onClick={() => onDeleteProduct(p.id)}
                                                >
                                                    🗑️
                                                </ActionButton>
                                            </ActionContainer>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </TableWrapper>

                    <div className="mobile-cards">
                        {currentItems.map(p => (
                            <MobileOrderCard key={p.id}>
                                <MobileOrderRow>
                                    <span className="label">Produto</span>
                                    <span className="value"><strong>{p.name}</strong></span>
                                </MobileOrderRow>
                                <MobileOrderRow>
                                    <span className="label">Preço</span>
                                    <span className="value">R$ {parseFloat(p.price).toFixed(2)}</span>
                                </MobileOrderRow>
                                {p.image_url && (
                                    <MobileOrderRow>
                                        <span className="label">Imagem</span>
                                        <span className="value">
                                            <img 
                                                src={p.image_url} 
                                                alt={p.name} 
                                                style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                                            />
                                        </span>
                                    </MobileOrderRow>
                                )}
                                <MobileOrderRow>
                                    <span className="label">Status</span>
                                    <span className="value">
                                        <Badge $status={p.active ? 'active' : 'inactive'}>
                                            {p.active ? '🟢 Ativo' : '🔴 Inativo'}
                                        </Badge>
                                    </span>
                                </MobileOrderRow>
                                <MobileActions>
                                    <ActionButton 
                                        $variant="edit" 
                                        onClick={() => onEditProduct(p)}
                                        style={{ flex: 1 }}
                                    >
                                        ✏️ Editar
                                    </ActionButton>
                                    <ActionButton 
                                        $variant="delete" 
                                        onClick={() => onDeleteProduct(p.id)}
                                        style={{ flex: 1 }}
                                    >
                                        🗑️ Remover
                                    </ActionButton>
                                </MobileActions>
                            </MobileOrderCard>
                        ))}
                    </div>
                    
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                    />
                </>
            )}
        </ProductsContainer>
    );
};

export default Products;