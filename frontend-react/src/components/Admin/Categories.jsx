import React from 'react';
import styled from 'styled-components';
import { tokens } from '../../styles/tokens';
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

const OrderBadge = styled.span`
  display: inline-block;
  padding: 2px 10px;
  border-radius: ${tokens.radius.full};
  background: ${tokens.colors.background};
  color: ${tokens.colors.textSecondary};
  font-size: ${tokens.typography.fontSize.xs};
  font-weight: ${tokens.typography.fontWeight.medium};
  border: 1px solid ${tokens.colors.border};
`;

const Categories = ({
    categories,
    onAddCategory,
    onEditCategory,
    onDeleteCategory
}) => {
    return (
        <ProductsContainer>
            <Header>
                <h3>🏷️ Gerenciar Categorias</h3>
                <AddButton onClick={onAddCategory}>
                    + Nova Categoria
                </AddButton>
            </Header>

            {categories.length === 0 ? (
                <EmptyState>
                    Nenhuma categoria cadastrada. Clique em "Nova Categoria" para começar.
                </EmptyState>
            ) : (
                <>
                    {/* TABELA DESKTOP */}
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
                                        <td>
                                            <OrderBadge>
                                                {c.display_order || 1}
                                            </OrderBadge>
                                        </td>
                                        <td>
                                            <ActionContainer>
                                                <ActionButton
                                                    $variant="edit"
                                                    onClick={() => onEditCategory(c)}
                                                    aria-label="Editar categoria"
                                                >
                                                    ✏️
                                                </ActionButton>
                                                <ActionButton
                                                    $variant="delete"
                                                    onClick={() => onDeleteCategory(c.id)}
                                                    aria-label="Remover categoria"
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
                        {categories.map(c => (
                            <MobileOrderCard key={c.id}>
                                <MobileOrderRow>
                                    <span className="label">Categoria</span>
                                    <span className="value"><strong>{c.name}</strong></span>
                                </MobileOrderRow>
                                <MobileOrderRow>
                                    <span className="label">Ordem</span>
                                    <span className="value">
                                        <OrderBadge>{c.display_order || 1}</OrderBadge>
                                    </span>
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