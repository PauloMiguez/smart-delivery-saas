import React from 'react';
import { StatsGrid, StatCard } from './AdminLayout.styled';
import FilterBar from './Dashboard/FilterBar';
import { SalesLineChart, OrderStatusPieChart, TopProductsChart } from './Dashboard/SalesChart';
import DashboardChartsGrid from './Dashboard/DashboardGrid';
import RecentOrders from './Dashboard/RecentOrders';

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
    return (
        <>
            <FilterBar
                period={period}
                onPeriodChange={onPeriodChange}
                onRefresh={onRefresh}
                lastUpdate={lastUpdate}
                loading={loading}
            />

            <StatsGrid>
                <StatCard>
                    <div className="stat-icon">📦</div>
                    <div>
                        <div className="stat-value">{stats?.total || 0}</div>
                        <div className="stat-label">Total de Pedidos</div>
                    </div>
                </StatCard>
                <StatCard>
                    <div className="stat-icon">💰</div>
                    <div>
                        <div className="stat-value">R$ {stats?.todayRevenue?.toFixed(2) || '0,00'}</div>
                        <div className="stat-label">Faturamento Hoje</div>
                    </div>
                </StatCard>
                <StatCard>
                    <div className="stat-icon">🎫</div>
                    <div>
                        <div className="stat-value">R$ {stats?.avgTicket?.toFixed(2) || '0,00'}</div>
                        <div className="stat-label">Ticket Médio</div>
                    </div>
                </StatCard>
                <StatCard>
                    <div className="stat-icon">⏳</div>
                    <div>
                        <div className="stat-value">{stats?.pending || 0}</div>
                        <div className="stat-label">Pedidos Pendentes</div>
                    </div>
                </StatCard>
            </StatsGrid>

            <SalesLineChart data={salesData} />

            <DashboardChartsGrid>
                <OrderStatusPieChart data={statusData} />
                <TopProductsChart data={topProducts} />
            </DashboardChartsGrid>

            <RecentOrders orders={orders} />
        </>
    );
};

export default Dashboard;