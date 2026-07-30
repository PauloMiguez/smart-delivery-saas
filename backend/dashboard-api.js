// ============================================================
//  ROTA DE DASHBOARD - ESTATÍSTICAS AVANÇADAS
// ============================================================
app.get('/api/stats/dashboard', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(404).json({ 
                success: false, 
                error: 'Tenant não encontrado' 
            });
        }

        const { period = 'today' } = req.query;
        
        // Calcular datas
        let startDate = new Date();
        switch (period) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate = startOfWeek(startDate);
                break;
            case 'month':
                startDate = startOfMonth(startDate);
                break;
            case 'all':
                startDate = new Date(0);
                break;
        }

        const startDateStr = startDate.toISOString().split('T')[0];

        // Buscar pedidos do período
        const [orders] = await pool.query(
            `SELECT * FROM orders 
             WHERE tenant_id = ? 
               AND DATE(created_at) >= ? 
             ORDER BY created_at DESC`,
            [tenantId, startDateStr]
        );

        // ============================================================
        //  1. DADOS PARA GRÁFICO DE VENDAS
        // ============================================================
        const salesMap = {};
        orders.forEach(order => {
            const date = new Date(order.created_at).toISOString().split('T')[0];
            if (!salesMap[date]) {
                salesMap[date] = { date, total: 0, orders: 0 };
            }
            salesMap[date].total += parseFloat(order.total || 0);
            salesMap[date].orders += 1;
        });

        const salesData = Object.values(salesMap).sort((a, b) => 
            a.date.localeCompare(b.date)
        );

        // ============================================================
        //  2. DADOS PARA GRÁFICO DE STATUS
        // ============================================================
        const statusCount = {};
        orders.forEach(order => {
            const status = order.status || 'pending';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });

        const statusMap = {
            'pending': '🟡 Pendente',
            'confirmado': '🟢 Confirmado',
            'entregue': '✅ Entregue',
            'cancelado': '❌ Cancelado'
        };

        const statusData = Object.entries(statusCount).map(([key, value]) => ({
            name: statusMap[key] || key,
            value
        }));

        // ============================================================
        //  3. TOP PRODUTOS MAIS VENDIDOS
        // ============================================================
        const productSales = {};
        orders.forEach(order => {
            let items = order.items;
            if (typeof items === 'string') {
                try { items = JSON.parse(items); } catch (e) { items = []; }
            }
            if (Array.isArray(items)) {
                items.forEach(item => {
                    const name = item.name || 'Produto';
                    if (!productSales[name]) {
                        productSales[name] = { name, quantity: 0 };
                    }
                    productSales[name].quantity += item.qty || 1;
                });
            }
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                salesData,
                statusData,
                topProducts
            }
        });
    } catch (error) {
        console.error('❌ Erro no dashboard:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao carregar dados do dashboard: ' + error.message 
        });
    }
});
