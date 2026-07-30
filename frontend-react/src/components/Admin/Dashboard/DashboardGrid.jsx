import React from 'react';
import styled from 'styled-components';

const ChartsGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 20px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 16px;
        margin-top: 16px;
    }

    @media (max-width: 480px) {
        gap: 12px;
        margin-top: 12px;
    }
`;

const ChartWrapper = styled.div`
    width: 100%;
    min-height: 280px;

    @media (max-width: 768px) {
        min-height: 240px;
    }

    @media (max-width: 480px) {
        min-height: 200px;
    }
`;

export const DashboardChartsGrid = ({ children }) => {
    return (
        <ChartsGrid>
            {React.Children.map(children, (child) => (
                <ChartWrapper>{child}</ChartWrapper>
            ))}
        </ChartsGrid>
    );
};

export default DashboardChartsGrid;
