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
`;

const ChartTitle = styled.h3`
    margin: 0 0 16px 0;
    color: #2d3436;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const ChartWrapper = styled.div`
    height: ${props => props.height || 280}px;
    width: 100%;
`;

const COLORS = ['#e67e22', '#27ae60', '#e74c3c', '#3498db', '#f39c12', '#9b59b6'];

// ============================================================
//  GRÁFICO DE VENDAS DIÁRIAS (LINHA)
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

    return (
        <ChartContainer>
            <ChartTitle>{title}</ChartTitle>
            <ChartWrapper>
                <ResponsiveContainer>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#888" fontSize={12} />
                        <YAxis stroke="#888" fontSize={12} />
                        <Tooltip
                            formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                            contentStyle={{
                                background: '#fff',
                                border: '1px solid #f0f0f0',
                                borderRadius: '8px',
                                padding: '12px'
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#e67e22"
                            strokeWidth={2}
                            dot={{ fill: '#e67e22', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="orders"
                            stroke="#3498db"
                            strokeWidth={2}
                            dot={{ fill: '#3498db', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartWrapper>
        </ChartContainer>
    );
};

// ============================================================
//  GRÁFICO DE STATUS DOS PEDIDOS (PIZZA)
// ============================================================
export const OrderStatusPieChart = ({ data, title = '📊 Status dos Pedidos' }) => {
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

    return (
        <ChartContainer>
            <ChartTitle>{title}</ChartTitle>
            <ChartWrapper height={260}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            fill="#8884d8"
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </ChartWrapper>
        </ChartContainer>
    );
};

// ============================================================
//  GRÁFICO DE PRODUTOS MAIS VENDIDOS (BARRAS)
// ============================================================
export const TopProductsChart = ({ data, title = '🥇 Produtos Mais Vendidos' }) => {
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

    return (
        <ChartContainer>
            <ChartTitle>{title}</ChartTitle>
            <ChartWrapper>
                <ResponsiveContainer>
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" stroke="#888" fontSize={12} />
                        <YAxis
                            type="category"
                            dataKey="name"
                            stroke="#888"
                            fontSize={12}
                            width={100}
                        />
                        <Tooltip
                            formatter={(value) => [`${value} unidades`, 'Quantidade']}
                            contentStyle={{
                                background: '#fff',
                                border: '1px solid #f0f0f0',
                                borderRadius: '8px',
                                padding: '12px'
                            }}
                        />
                        <Bar dataKey="quantity" fill="#e67e22" radius={[0, 4, 4, 0]} />
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
