import React from 'react';
import {
    ProductsContainer,
    TableWrapper,
    Table,
    ActionButton,
    ActionContainer,
    MobileOrderCard,
    MobileOrderRow,
    MobileActions
} from './AdminLayout.styled';

const Categories = ({
    categories,
    onAddCategory,
    onEditCategory,
    onDeleteCategory
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
                <h3 style={{ margin: 0 }}>Gerenciar Categorias</h3>
                <ActionButton onClick={onAddCategory}>
                    + Nova Categoria
                </ActionButton>
            </div>
            
            {categories.length === 0 ? (
                <p style={{ color: '#888', padding: '20px 0' }}>Nenhuma categoria cadastrada.</p>
            ) : (
                <>
                    <TableWrapper className="desktop-table">
                        <Table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Ordem</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(c => (
                                    <tr key={c.id}>
                                        <td><strong>{c.name}</strong></td>
                                        <td>{c.display_order || 1}</td>
                                        <td>
                                            <ActionContainer>
                                                <ActionButton 
                                                    $variant="edit" 
                                                    onClick={() => onEditCategory(c)}
                                                >
                                                    ✏️
                                                </ActionButton>
                                                <ActionButton 
                                                    $variant="delete" 
                                                    onClick={() => onDeleteCategory(c.id)}
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
                        {categories.map(c => (
                            <MobileOrderCard key={c.id}>
                                <MobileOrderRow>
                                    <span className="label">Categoria</span>
                                    <span className="value"><strong>{c.name}</strong></span>
                                </MobileOrderRow>
                                <MobileOrderRow>
                                    <span className="label">Ordem</span>
                                    <span className="value">{c.display_order || 1}</span>
                                </MobileOrderRow>
                                <MobileActions>
                                    <ActionButton 
                                        $variant="edit" 
                                        onClick={() => onEditCategory(c)}
                                        style={{ flex: 1 }}
                                    >
                                        ✏️ Editar
                                    </ActionButton>
                                    <ActionButton 
                                        $variant="delete" 
                                        onClick={() => onDeleteCategory(c.id)}
                                        style={{ flex: 1 }}
                                    >
                                        🗑️ Remover
                                    </ActionButton>
                                </MobileActions>
                            </MobileOrderCard>
                        ))}
                    </div>
                </>
            )}
        </ProductsContainer>
    );
};

export default Categories;