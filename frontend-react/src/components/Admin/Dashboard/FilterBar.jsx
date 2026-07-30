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
        gap: 10px;
        padding: 12px;
    }

    @media (max-width: 480px) {
        padding: 10px;
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
        justify-content: center;
        gap: 6px;
    }

    @media (max-width: 480px) {
        gap: 4px;
        justify-content: space-between;
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
        padding: 6px 12px;
        font-size: 12px;
        flex: 1;
        text-align: center;
        min-width: 60px;
    }

    @media (max-width: 480px) {
        padding: 5px 8px;
        font-size: 11px;
        min-width: 50px;
    }
`;

const RightGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    min-width: auto;
    justify-content: flex-end;

    @media (max-width: 768px) {
        width: 100%;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
    }

    @media (max-width: 480px) {
        flex-direction: column;
        gap: 6px;
        align-items: stretch;
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

    @media (max-width: 768px) {
        padding: 8px 16px;
        font-size: 12px;
        flex: 1;
        justify-content: center;
    }

    @media (max-width: 480px) {
        padding: 10px;
        font-size: 13px;
        width: 100%;
        justify-content: center;
    }
`;

const LastUpdate = styled.span`
    font-size: 12px;
    color: #888;
    white-space: nowrap;
    flex-shrink: 0;
    text-align: right;

    @media (max-width: 768px) {
        font-size: 11px;
        text-align: center;
        flex: 1;
    }

    @media (max-width: 480px) {
        font-size: 10px;
        width: 100%;
        text-align: center;
    }
`;

const FilterBar = ({ period, onPeriodChange, onRefresh, lastUpdate, loading }) => {
    const periods = [
        { value: 'today', label: '📅 Hoje' },
        { value: 'week', label: '📅 Semana' },
        { value: 'month', label: '📅 Mês' },
        { value: 'all', label: '📅 Todo' }
    ];

    // Versão mobile com labels mais curtas
    const isMobile = window.innerWidth < 480;
    const mobilePeriods = [
        { value: 'today', label: '📅 Hoje' },
        { value: 'week', label: '📅 Semana' },
        { value: 'month', label: '📅 Mês' },
        { value: 'all', label: '📅 Todo' }
    ];

    const displayPeriods = isMobile ? mobilePeriods : periods;

    return (
        <Container>
            <FilterGroup>
                {displayPeriods.map(p => (
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
