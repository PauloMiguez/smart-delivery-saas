import React, { useState } from 'react';
import styled from 'styled-components';
import { Input } from '../Shared/Container';

const FilterContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 12px;
    align-items: center;
`;

const SearchInput = styled(Input)`
    flex: 1;
    min-width: 200px;
    padding: 8px 12px;
    font-size: 14px;
`;

const Select = styled.select`
    padding: 8px 12px;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
    font-size: 14px;
    background: #fff;
    color: ${props => props.theme.colors.text};
    min-width: 140px;
    cursor: pointer;
    
    &:focus {
        outline: none;
        border-color: ${props => props.theme.colors.primary};
    }
`;

const FilterLabel = styled.span`
    font-size: 13px;
    font-weight: 600;
    color: ${props => props.theme.colors.textLight};
    margin-right: 4px;
`;

const ClearButton = styled.button`
    background: none;
    border: none;
    color: ${props => props.theme.colors.danger};
    font-size: 13px;
    cursor: pointer;
    padding: 4px 8px;
    
    &:hover {
        text-decoration: underline;
    }
`;

const ProductFilters = ({ onFilter, categories }) => {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        onFilter({ search: value, category: categoryFilter, status: statusFilter });
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setCategoryFilter(value);
        onFilter({ search, category: value, status: statusFilter });
    };

    const handleStatusChange = (e) => {
        const value = e.target.value;
        setStatusFilter(value);
        onFilter({ search, category: categoryFilter, status: value });
    };

    const clearFilters = () => {
        setSearch('');
        setCategoryFilter('');
        setStatusFilter('');
        onFilter({ search: '', category: '', status: '' });
    };

    const hasFilters = search || categoryFilter || statusFilter;

    return (
        <FilterContainer>
            <SearchInput
                type="text"
                placeholder="🔍 Buscar produto..."
                value={search}
                onChange={handleSearchChange}
            />
            
            <Select value={categoryFilter} onChange={handleCategoryChange}>
                <option value="">Todas categorias</option>
                {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
            </Select>
            
            <Select value={statusFilter} onChange={handleStatusChange}>
                <option value="">Todos status</option>
                <option value="active">🟢 Ativos</option>
                <option value="inactive">🔴 Inativos</option>
            </Select>
            
            {hasFilters && (
                <ClearButton onClick={clearFilters}>✕ Limpar filtros</ClearButton>
            )}
        </FilterContainer>
    );
};

export default ProductFilters;