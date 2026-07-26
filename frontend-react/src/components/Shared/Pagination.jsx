import React from 'react';
import styled from 'styled-components';

const PaginationContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    flex-wrap: wrap;
`;

const PageButton = styled.button`
    padding: 6px 14px;
    border: 1px solid ${props => props.active ? props.theme.colors.primary : props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
    background: ${props => props.active ? props.theme.colors.primary : '#fff'};
    color: ${props => props.active ? '#fff' : props.theme.colors.text};
    cursor: pointer;
    font-size: 14px;
    font-weight: ${props => props.active ? '600' : '400'};
    transition: all 0.2s;
    
    &:hover {
        border-color: ${props => props.theme.colors.primary};
        background: ${props => props.active ? props.theme.colors.primaryDark : '#f8f9fa'};
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const PageInfo = styled.span`
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    margin: 0 8px;
`;

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <PaginationContainer>
            <PageButton 
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                ←
            </PageButton>
            
            {startPage > 1 && (
                <>
                    <PageButton onClick={() => onPageChange(1)}>1</PageButton>
                    {startPage > 2 && <span style={{ color: '#888' }}>…</span>}
                </>
            )}
            
            {pages.map(page => (
                <PageButton
                    key={page}
                    active={page === currentPage}
                    onClick={() => onPageChange(page)}
                >
                    {page}
                </PageButton>
            ))}
            
            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span style={{ color: '#888' }}>…</span>}
                    <PageButton onClick={() => onPageChange(totalPages)}>{totalPages}</PageButton>
                </>
            )}
            
            <PageButton 
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                →
            </PageButton>
            
            <PageInfo>
                Página {currentPage} de {totalPages}
            </PageInfo>
        </PaginationContainer>
    );
};

export default Pagination;