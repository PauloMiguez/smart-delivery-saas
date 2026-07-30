import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 12px;
    align-items: center;
    justify-content: space-between;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
    }
`;

const FilterGroup = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;

    @media (max-width: 768px) {
        width: 100%;
        justify-content: stretch;
    }
`;

const FilterButton = styled.button`
    padding: 8px 16px;
    border: 2px solid ${props => props.active ? '#e67e22' : '#e0e0e0'};
    border-radius: 8px;
    background: ${props => props.active ? '#e67e22' : '#fff'};
    color: ${props => props.active ? '#fff' : '#2d3436'};
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;

    &:hover {
        border-color: #e67e22;
        background: ${props => props.active ? '#d35400' : '#fdf0e8'};
    }

    @media (max-width: 768px) {
        flex: 1;
        text-align: center;
    }
`;

const RightGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    min-width: 120px;
    justify-content: flex-end;

    @media (max-width: 768px) {
        width: 100%;
        justify-content: stretch;
    }
`;

const RefreshButton = styled.button`
    padding: 8px 20px;
    border: none;
    border-radius: 8px;
    background: #e67e22;
    color: #fff;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    flex-shrink: 0;

    &:hover {
        background: #d35400;
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const LastUpdate = styled.span`
    font-size: 12px;
    color: #888;
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 80px;
    text-align: right;

    @media (max-width: 768px) {
        text-align: center;
        min-width: unset;
        width: 100%;
    }
`;

const FilterBar = ({ period, onPeriodChange, onRefresh, lastUpdate, loading }) => {
    const periods = [
        { value: 'today', label: '📅 Hoje' },
        { value: 'week', label: '📅 Esta Semana' },
        { value: 'month', label: '📅 Este Mês' },
        { value: 'all', label: '📅 Todo Período' }
    ];

    return (
        <Container>
            <FilterGroup>
                {periods.map(p => (
                    <FilterButton
                        key={p.value}
                        active={period === p.value}
                        onClick={() => onPeriodChange(p.value)}
                    >
                        {p.label}
                    </FilterButton>
                ))}
            </FilterGroup>
            <RightGroup>
                {lastUpdate && (
                    <LastUpdate>🔄 {lastUpdate}</LastUpdate>
                )}
                <RefreshButton onClick={onRefresh} disabled={loading}>
                    {loading ? '⏳' : '🔄'} Atualizar
                </RefreshButton>
            </RightGroup>
        </Container>
    );
};

export default FilterBar;
