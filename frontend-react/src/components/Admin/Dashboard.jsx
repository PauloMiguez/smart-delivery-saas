import React from 'react';
import styled from 'styled-components';
import { tokens } from '../../styles/tokens';
import { StatsGrid, StatCard } from './AdminLayout.styled';
import FilterBar from './Dashboard/FilterBar';
import { SalesLineChart, OrderStatusPieChart, TopProductsChart } from './Dashboard/SalesChart';
import DashboardChartsGrid from './Dashboard/DashboardGrid';
import RecentOrders from './Dashboard/RecentOrders';

// ============================================================
//  STYLED COMPONENTS
// ============================================================
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing.lg};
  padding: ${tokens.spacing.sm} 0;
`;

const StatsGridStyled = styled(StatsGrid)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${tokens.spacing.md};
  margin-bottom: ${tokens.spacing.lg};

  @media (max-width: ${tokens.breakpoints.sm}) {
    grid-template-columns: 1fr 1fr;
    gap: ${tokens.spacing.sm};
  }
`;

const StatCardStyled = styled(StatCard)`
  background: ${tokens.colors.surface};
  border-radius: ${tokens.radius.md};
  padding: ${tokens.spacing.md};
  border: 1px solid ${tokens.colors.border};
  box-shadow: ${tokens.shadows.sm};
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  gap: ${tokens.spacing.md};

  &:hover {
    box-shadow: ${tokens.shadows.md};
    transform: translateY(-2px);
  }

  .stat-icon {
    font-size: ${tokens.typography.fontSize['2xl']};
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${tokens.colors.accentLight};
    border-radius: ${tokens.radius.md};
    color: ${tokens.colors.accent};
    flex-shrink: 0;
  }

  .stat-value {
    font-size: ${tokens.typography.fontSize['2xl']};
    font-weight: ${tokens.typography.fontWeight.bold};
    color: ${tokens.colors.text};
    line-height: ${tokens.typography.lineHeight.tight};
    letter-spacing: -0.02em;
  }

  .stat-label {
    font-size: ${tokens.typography.fontSize.sm};
    color: ${tokens.colors.textSecondary};
    font-weight: ${tokens.typography.fontWeight.medium};
    margin-top: ${tokens.spacing.xs};
  }

  @media (max-width: ${tokens.breakpoints.sm}) {
    padding: ${tokens.spacing.sm};
    flex-direction: column;
    text-align: center;
    gap: ${tokens.spacing.xs};

    .stat-icon {
      width: 36px;
      height: 36px;
      font-size: ${tokens.typography.fontSize.lg};
    }

    .stat-value {
      font-size: ${tokens.typography.fontSize.lg};
    }

    .stat-label {
      font-size: ${tokens.typography.fontSize.xs};
    }
  }
`;

const ChartsGrid = styled(DashboardChartsGrid)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${tokens.spacing.lg};
  margin: ${tokens.spacing.md} 0;

  @media (max-width: ${tokens.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: ${tokens.spacing.md};
  }
`;

const SectionTitle = styled.h3`
  font-size: ${tokens.typography.fontSize.lg};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.text};
  margin: ${tokens.spacing.lg} 0 ${tokens.spacing.md} 0;
  letter-spacing: -0.02em;
`;

const Dashboard = ({
    period,
    onPeriodChange,
    onRefresh,
    lastUpdate,
    loading,
    stats,
    salesData,
    statusData,
    topProducts,
    orders
}) => {
    // Formatar valores monetários
    const formatMoney = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
    };

    return (
        <DashboardContainer>
            {/* Filtros */}
            <FilterBar
                period={period}
                onPeriodChange={onPeriodChange}
                onRefresh={onRefresh}
                lastUpdate={lastUpdate}
                loading={loading}
            />

            {/* Cards de métricas */}
            <StatsGridStyled>
                <StatCardStyled>
                    <div className="stat-icon">📦</div>
                    <div>
                        <div className="stat-value">{stats?.total || 0}</div>
                        <div className="stat-label">Total de Pedidos</div>
                    </div>
                </StatCardStyled>
                <StatCardStyled>
                    <div className="stat-icon">💰</div>
                    <div>
                        <div className="stat-value">R$ {formatMoney(stats?.todayRevenue)}</div>
                        <div className="stat-label">Faturamento Hoje</div>
                    </div>
                </StatCardStyled>
                <StatCardStyled>
                    <div className="stat-icon">🎫</div>
                    <div>
                        <div className="stat-value">R$ {formatMoney(stats?.avgTicket)}</div>
                        <div className="stat-label">Ticket Médio</div>
                    </div>
                </StatCardStyled>
                <StatCardStyled>
                    <div className="stat-icon">⏳</div>
                    <div>
                        <div className="stat-value">{stats?.pending || 0}</div>
                        <div className="stat-label">Pedidos Pendentes</div>
                    </div>
                </StatCardStyled>
            </StatsGridStyled>

            {/* Gráfico de vendas */}
            <SalesLineChart data={salesData} />

            {/* Grid de gráficos */}
            <ChartsGrid>
                <OrderStatusPieChart data={statusData} />
                <TopProductsChart data={topProducts} />
            </ChartsGrid>

            {/* Pedidos recentes */}
            <SectionTitle>📋 Pedidos Recentes</SectionTitle>
            <RecentOrders orders={orders} />
        </DashboardContainer>
    );
};

export default Dashboard;