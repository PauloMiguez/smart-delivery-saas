import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import styled from 'styled-components';

const ChartContainer = styled.div`
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid #f0f0f0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    width: 100%;
    overflow: hidden;
    box-sizing: border-box;

    @media (max-width: 768px) {
        padding: 12px;
        border-radius: 12px;
        margin-bottom: 12px;
    }

    @media (max-width: 480px) {
        padding: 8px;
        border-radius: 8px;
    }
`;

const ChartTitle = styled.h3`
    margin: 0 0 16px 0;
    color: #2d3436;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 8px;

    @media (max-width: 768px) {
        font-size: 16px;
        margin-bottom: 12px;
    }

    @media (max-width: 480px) {
        font-size: 14px;
        margin-bottom: 8px;
    }
`;

const ChartWrapper = styled.div`
    height: ${props => props.height || 280}px;
    width: 100%;
    min-height: 200px;

    @media (max-width: 768px) {
        height: ${props => props.mobileHeight || 220}px;
        min-height: 180px;
    }

    @media (max-width: 480px) {
        height: ${props => props.smallHeight || 180}px;
        min-height: 150px;
    }
`;

const ChartGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 20px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 12px;
        margin-top: 12px;
    }
`;

const COLORS = ['#e67e22', '#27ae60', '#e74c3c', '#3498db', '#f39c12', '#9b59b6'];

// ============================================================
//  GRÁFICO DE VENDAS DIÁRIAS (LINHA) - RESPONSIVO
// ============================================================
export const SalesLineChart = ({ data, title = '📈 Vendas Diárias' }) => {
    if (!data || data.length === 0) {
        return (
            <ChartContainer>
                <ChartTitle>{title}</ChartTitle>
                <div style={{ textAlign: 'center', padding: '40px', color: '#b2bec3' }}>
                    Sem dados para exibir
                </div>
            </ChartContainer>
        );
    }

    // Formatar data para exibição
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}`;
    };

    // Detectar se é mobile para ajustar o tooltip
    const isMobile = window.innerWidth < 768;

    return (
        <ChartContainer>
            <ChartTitle>{title}</ChartTitle>
            <ChartWrapper height={280} mobileHeight={220} smallHeight={180}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ 
                        top: 5, 
                        right: isMobile ? 5 : 20, 
                        left: isMobile ? 0 : 10, 
                        bottom: 5 
                    }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={formatDate}
                            stroke="#888" 
                            fontSize={isMobile ? 9 : 12}
                            interval={isMobile ? 2 : 0}
                            tick={{ fontSize: isMobile ? 9 : 12 }}
                            height={isMobile ? 30 : 40}
                        />
                        <YAxis 
                            yAxisId="left"
                            stroke="#888" 
                            fontSize={isMobile ? 9 : 12}
                            tickFormatter={(value) => isMobile ? `R$ ${value.toFixed(0)}` : `R$ ${value.toFixed(0)}`}
                            width={isMobile ? 35 : 50}
                        />
                        <YAxis 
                            yAxisId="right"
                            orientation="right"
                            stroke="#3498db" 
                            fontSize={isMobile ? 9 : 12}
                            tickFormatter={(value) => `${value}`}
                            width={isMobile ? 25 : 40}
                        />
                        <Tooltip
                            formatter={(value, name) => {
                                if (name === 'Quantidade') {
                                    return [`${value} pedido${value !== 1 ? 's' : ''}`, 'Quantidade de Pedidos'];
                                }
                                if (name === 'Faturamento') {
                                    return [`R$ ${value.toFixed(2)}`, 'Faturamento Total'];
                                }
                                return [value, name];
                            }}
                            labelFormatter={(label) => `📅 ${formatDate(label)}`}
                            contentStyle={{
                                background: '#fff',
                                border: '1px solid #f0f0f0',
                                borderRadius: '8px',
                                padding: isMobile ? '8px 10px' : '12px',
                                minWidth: isMobile ? '120px' : '180px',
                                fontSize: isMobile ? '12px' : '14px'
                            }}
                            wrapperStyle={{
                                zIndex: 100
                            }}
                        />
                        <Legend 
                            verticalAlign="top" 
                            height={isMobile ? 30 : 36}
                            wrapperStyle={{
                                fontSize: isMobile ? '11px' : '14px',
                                paddingBottom: isMobile ? '4px' : '8px'
                            }}
                            formatter={(value) => {
                                const labels = {
                                    'Quantidade': isMobile ? '📦 Pedidos' : '📦 Quantidade de Pedidos',
                                    'Faturamento': isMobile ? '💰 Faturamento' : '💰 Faturamento Total'
                                };
                                return labels[value] || value;
                            }}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="orders"
                            name="Quantidade"
                            stroke="#3498db"
                            strokeWidth={isMobile ? 2 : 2}
                            dot={{ fill: '#3498db', r: isMobile ? 3 : 4 }}
                            activeDot={{ r: isMobile ? 4 : 6 }}
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="total"
                            name="Faturamento"
                            stroke="#e67e22"
                            strokeWidth={isMobile ? 2 : 2}
                            dot={{ fill: '#e67e22', r: isMobile ? 3 : 4 }}
                            activeDot={{ r: isMobile ? 4 : 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartWrapper>
        </ChartContainer>
    );
};

// ============================================================
//  GRÁFICO DE STATUS DOS PEDIDOS (PIZZA) - RESPONSIVO
// ============================================================
export const OrderStatusPieChart = ({ data, title = '📊 Status dos Pedidos' }) => {
    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return (
            <ChartContainer>
                <ChartTitle>{title}</ChartTitle>
                <div style={{ textAlign: 'center', padding: '40px', color: '#b2bec3' }}>
                    Sem dados para exibir
                </div>
            </ChartContainer>
        );
    }

    const filteredData = data.filter(d => d.value > 0);
    const isMobile = window.innerWidth < 768;
    const isSmallMobile = window.innerWidth < 480;

    if (filteredData.length === 0) {
        return (
            <ChartContainer>
                <ChartTitle>{title}</ChartTitle>
                <div style={{ textAlign: 'center', padding: '40px', color: '#b2bec3' }}>
                    Sem dados para exibir
                </div>
            </ChartContainer>
        );
    }

    const pieSize = isSmallMobile ? 180 : (isMobile ? 200 : 260);

    return (
        <ChartContainer>
            <ChartTitle>{title}</ChartTitle>
            <ChartWrapper height={pieSize} mobileHeight={pieSize} smallHeight={pieSize}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={filteredData}
                            cx="50%"
                            cy="50%"
                            innerRadius={isSmallMobile ? 30 : (isMobile ? 40 : 60)}
                            outerRadius={isSmallMobile ? 55 : (isMobile ? 70 : 90)}
                            fill="#8884d8"
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => 
                                percent > 0.1 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                            }
                            labelLine={false}
                            label={{ fontSize: isMobile ? 10 : 12 }}
                        >
                            {filteredData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => [`${value} pedido${value !== 1 ? 's' : ''}`, 'Quantidade']}
                            contentStyle={{
                                background: '#fff',
                                border: '1px solid #f0f0f0',
                                borderRadius: '8px',
                                padding: isMobile ? '8px 10px' : '12px',
                                fontSize: isMobile ? '12px' : '14px'
                            }}
                        />
                        <Legend 
                            wrapperStyle={{
                                fontSize: isMobile ? '11px' : '14px',
                                paddingTop: isMobile ? '8px' : '12px'
                            }}
                            layout={isMobile ? "horizontal" : "vertical"}
                            verticalAlign={isMobile ? "bottom" : "middle"}
                            align={isMobile ? "center" : "right"}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </ChartWrapper>
        </ChartContainer>
    );
};

// ============================================================
//  GRÁFICO DE PRODUTOS MAIS VENDIDOS (BARRAS) - RESPONSIVO
// ============================================================
export const TopProductsChart = ({ data, title = '🥇 Produtos Mais Vendidos' }) => {
    if (!data || data.length === 0 || data.every(d => d.quantity === 0)) {
        return (
            <ChartContainer>
                <ChartTitle>{title}</ChartTitle>
                <div style={{ textAlign: 'center', padding: '40px', color: '#b2bec3' }}>
                    Sem dados para exibir
                </div>
            </ChartContainer>
        );
    }

    const filteredData = data.filter(d => d.quantity > 0);
    const isMobile = window.innerWidth < 768;

    if (filteredData.length === 0) {
        return (
            <ChartContainer>
                <ChartTitle>{title}</ChartTitle>
                <div style={{ textAlign: 'center', padding: '40px', color: '#b2bec3' }}>
                    Sem dados para exibir
                </div>
            </ChartContainer>
        );
    }

    return (
        <ChartContainer>
            <ChartTitle>{title}</ChartTitle>
            <ChartWrapper height={isMobile ? 200 : 280} mobileHeight={200} smallHeight={180}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredData} layout={isMobile ? "horizontal" : "vertical"} margin={{
                        top: 5,
                        right: isMobile ? 10 : 20,
                        left: isMobile ? 0 : 5,
                        bottom: isMobile ? 20 : 5
                    }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        {isMobile ? (
                            <>
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#888" 
                                    fontSize={10}
                                    interval={0}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis 
                                    type="number" 
                                    stroke="#888" 
                                    fontSize={10}
                                    tickFormatter={(value) => `${value}`}
                                    width={25}
                                />
                            </>
                        ) : (
                            <>
                                <XAxis 
                                    type="number" 
                                    stroke="#888" 
                                    fontSize={12} 
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    stroke="#888"
                                    fontSize={12}
                                    width={120}
                                />
                            </>
                        )}
                        <Tooltip
                            formatter={(value) => [`${value} unidade${value !== 1 ? 's' : ''}`, 'Quantidade']}
                            contentStyle={{
                                background: '#fff',
                                border: '1px solid #f0f0f0',
                                borderRadius: '8px',
                                padding: isMobile ? '8px 10px' : '12px',
                                fontSize: isMobile ? '12px' : '14px'
                            }}
                        />
                        <Bar 
                            dataKey="quantity" 
                            fill="#e67e22" 
                            radius={isMobile ? [4, 4, 0, 0] : [0, 4, 4, 0]}
                            barSize={isMobile ? 20 : 30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartWrapper>
        </ChartContainer>
    );
};

// ============================================================
//  CARD DE MÉTRICA COM TENDÊNCIA
// ============================================================
export const MetricCard = ({ icon, title, value, trend, trendValue }) => {
    const isPositive = trend === 'up';

    return (
        <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'transform 0.2s ease',
            cursor: 'default'
        }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '24px' }}>{icon}</span>
                {trend && (
                    <span style={{
                        fontSize: '13px',
                        color: isPositive ? '#27ae60' : '#e74c3c',
                        background: isPositive ? '#d5f5e3' : '#fdedec',
                        padding: '2px 10px',
                        borderRadius: '30px',
                        fontWeight: '600'
                    }}>
                        {isPositive ? '↑' : '↓'} {trendValue || '0%'}
                    </span>
                )}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#2d3436', marginTop: '12px' }}>
                {value || '0'}
            </div>
            <div style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>
                {title}
            </div>
        </div>
    );
};
