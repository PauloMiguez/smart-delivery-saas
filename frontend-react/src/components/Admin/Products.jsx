import React from 'react';
import styled from 'styled-components';
import { tokens } from '../../styles/tokens';
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

// ============================================================
//  STYLED COMPONENTS
// ============================================================
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${tokens.spacing.md};
  flex-wrap: wrap;
  gap: ${tokens.spacing.sm};

  h3 {
    margin: 0;
    font-size: ${tokens.typography.fontSize.lg};
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.text};
    letter-spacing: -0.02em;
  }

  @media (max-width: ${tokens.breakpoints.sm}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const AddButton = styled(ActionButton)`
  padding: ${tokens.spacing.sm} ${tokens.spacing.lg};
  background: ${tokens.colors.accent};
  color: ${tokens.colors.surface};
  border: none;
  border-radius: ${tokens.radius.md};
  font-weight: ${tokens.typography.fontWeight.medium};
  font-size: ${tokens.typography.fontSize.sm};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-family: ${tokens.typography.fontFamily};

  &:hover {
    background: ${tokens.colors.accentHover};
    transform: translateY(-1px);
    box-shadow: ${tokens.shadows.md};
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: ${tokens.breakpoints.sm}) {
    width: 100%;
    justify-content: center;
  }
`;

const EmptyState = styled.p`
  color: ${tokens.colors.textMuted};
  padding: ${tokens.spacing.xl} 0;
  text-align: center;
  font-size: ${tokens.typography.fontSize.sm};
`;

const ImageThumbnail = styled.img`
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: ${tokens.radius.sm};
  border: 1px solid ${tokens.colors.border};
  background: ${tokens.colors.background};
`;

const ImagePlaceholder = styled.span`
  color: ${tokens.colors.textMuted};
  font-size: ${tokens.typography.fontSize.lg};
`;

const PriceText = styled.span`
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.text};
`;

const StatusBadge = styled(Badge)`
  ${props => props.$status === 'active' ? `
    background: ${tokens.colors.successLight};
    color: ${tokens.colors.success};
  ` : `
    background: ${tokens.colors.errorLight};
    color: ${tokens.colors.error};
  `}
  font-weight: ${tokens.typography.fontWeight.medium};
  padding: 4px 12px;
  border-radius: ${tokens.radius.full};
  font-size: ${tokens.typography.fontSize.xs};
`;

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
    // Formatar preço
    const formatPrice = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
    };

    return (
        <ProductsContainer>
            <Header>
                <h3>📦 Gerenciar Produtos</h3>
                <AddButton onClick={onAddProduct}>
                    + Adicionar Produto
                </AddButton>
            </Header>

            <ProductFilters
                categories={categories}
                onFilter={onFilter}
            />

            {filteredProducts.length === 0 ? (
                <EmptyState>
                    {products.length === 0
                        ? 'Nenhum produto cadastrado. Clique em "Adicionar Produto" para começar.'
                        : 'Nenhum produto encontrado com os filtros aplicados.'}
                </EmptyState>
            ) : (
                <>
                    {/* TABELA DESKTOP */}
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
                                                <ImageThumbnail
                                                    src={p.image_url}
                                                    alt={p.name}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <ImagePlaceholder>📦</ImagePlaceholder>
                                            )}
                                        </td>
                                        <td><strong>{p.name}</strong></td>
                                        <td><PriceText>R$ {formatPrice(p.price)}</PriceText></td>
                                        <td>
                                            <StatusBadge $status={p.active ? 'active' : 'inactive'}>
                                                {p.active ? '🟢 Ativo' : '🔴 Inativo'}
                                            </StatusBadge>
                                        </td>
                                        <td>
                                            <ActionContainer>
                                                <ActionButton
                                                    $variant="edit"
                                                    onClick={() => onEditProduct(p)}
                                                    aria-label="Editar produto"
                                                >
                                                    ✏️
                                                </ActionButton>
                                                <ActionButton
                                                    $variant="delete"
                                                    onClick={() => onDeleteProduct(p.id)}
                                                    aria-label="Remover produto"
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

                    {/* CARDS MOBILE */}
                    <div className="mobile-cards">
                        {currentItems.map(p => (
                            <MobileOrderCard key={p.id}>
                                <MobileOrderRow>
                                    <span className="label">Produto</span>
                                    <span className="value"><strong>{p.name}</strong></span>
                                </MobileOrderRow>
                                <MobileOrderRow>
                                    <span className="label">Preço</span>
                                    <span className="value">R$ {formatPrice(p.price)}</span>
                                </MobileOrderRow>
                                {p.image_url && (
                                    <MobileOrderRow>
                                        <span className="label">Imagem</span>
                                        <span className="value">
                                            <ImageThumbnail
                                                src={p.image_url}
                                                alt={p.name}
                                                loading="lazy"
                                                style={{ width: 50, height: 50 }}
                                            />
                                        </span>
                                    </MobileOrderRow>
                                )}
                                <MobileOrderRow>
                                    <span className="label">Status</span>
                                    <span className="value">
                                        <StatusBadge $status={p.active ? 'active' : 'inactive'}>
                                            {p.active ? '🟢 Ativo' : '🔴 Inativo'}
                                        </StatusBadge>
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