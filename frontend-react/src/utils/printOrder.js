// ============================================================
//  FUNÇÃO PARA IMPRIMIR PEDIDO EM PDF
// ============================================================

export const printOrderPDF = (order, storeName = 'Smart Delivery') => {
    // ============================================================
    //  ✅ CORREÇÃO: formatDate com ajuste correto para created_at
    // ============================================================
    const formatDate = (dateString, isScheduled = false) => {
        if (!dateString) return '-';
        try {
            // Se for uma data agendada, manter o horário de parede
            if (isScheduled && typeof dateString === 'string') {
                const isLocalFormat = dateString.includes('T') && 
                                     !dateString.includes('Z') && 
                                     !dateString.includes('+') &&
                                     !dateString.includes('-', 10);
                
                if (isLocalFormat) {
                    const parts = dateString.split('T');
                    if (parts.length === 2) {
                        const [datePart, timePart] = parts;
                        const [y, m, d] = datePart.split('-');
                        const [h, min] = timePart.split(':');
                        if (y && m && d && h && min) {
                            return `${d}/${m}/${y}, ${h}:${min}`;
                        }
                    }
                }
            }

            // ✅ CORREÇÃO: Para created_at, subtrair 3 horas (UTC-3)
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            
            const localDate = new Date(date.getTime() - (3 * 60 * 60 * 1000));
            
            return localDate.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error("Erro ao formatar data:", error);
            return '-';
        }
    };

    // Formatar valor
    const formatMoney = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? 'R$ 0,00' : `R$ ${num.toFixed(2).replace('.', ',')}`;
    };

    // Função para exibir taxa de entrega corretamente
    const getDeliveryFeeDisplay = () => {
        const fee = parseFloat(order.delivery_fee) || 0;
        const status = order.delivery_status || 'calculated';
        const type = order.delivery_type || 'fixa';

        if (status === 'pending' || type === 'manual') {
            return 'Informada após o pedido';
        }
        return formatMoney(fee);
    };

    // Cor da taxa de entrega
    const getDeliveryFeeColor = () => {
        const status = order.delivery_status || 'calculated';
        const type = order.delivery_type || 'fixa';
        
        if (status === 'pending' || type === 'manual') {
            return '#f59e0b';
        }
        return '#d9531e';
    };

    // Status labels
    const statusLabels = {
        'pending': '🟡 Pendente',
        'confirmado': '🟢 Confirmado',
        'preparando': '🟠 Em preparo',
        'despachado': '🏍️ Despachado',
        'entregue': '✅ Entregue',
        'cancelado': '❌ Cancelado',
        'scheduled': '📅 Agendado'
    };

    // Parse items
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    // Obter display da taxa
    const deliveryFeeDisplay = getDeliveryFeeDisplay();
    const deliveryFeeColor = getDeliveryFeeColor();

    // Obter data agendada
    const getScheduledDisplay = () => {
        if (!order.is_scheduled || !order.scheduled_time) return '';
        return `📅 Agendado: ${formatDate(order.scheduled_time, true)}`;
    };

    // ✅ Calcular totais com acompanhamentos
    const subtotalWithAddons = items.reduce((sum, item) => {
        const itemTotal = (item.price * item.qty) + (item.addons || []).reduce((s, a) => s + (a.price * a.quantity), 0);
        return sum + itemTotal;
    }, 0);

    // ✅ Verificar se tem desconto
    const hasDiscount = order.discount > 0 || order.discount_percentage > 0;
    const discountText = order.discount_reason || `${order.discount_percentage || 0}% de desconto`;

    // Construir HTML
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Pedido #${order.order_number}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Helvetica Neue', Arial, sans-serif;
                    background: #fff;
                    padding: 40px;
                    color: #1f2421;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #d9531e;
                    padding-bottom: 16px;
                    margin-bottom: 24px;
                }
                .header h1 {
                    font-size: 24px;
                    color: #1f2421;
                }
                .header h1 span {
                    color: #d9531e;
                }
                .header .order-number {
                    font-size: 20px;
                    font-weight: 700;
                    color: #d9531e;
                }
                .status-badge {
                    display: inline-block;
                    padding: 4px 16px;
                    border-radius: 30px;
                    font-weight: 600;
                    font-size: 14px;
                    background: #f5f5f5;
                    color: #1f2421;
                }
                .section {
                    margin: 20px 0;
                }
                .section-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #1f2421;
                    border-bottom: 1px solid #e8ebeb;
                    padding-bottom: 8px;
                    margin-bottom: 12px;
                }
                .row {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
                    font-size: 14px;
                    border-bottom: 1px solid #f5f5f5;
                }
                .row .label {
                    color: #60696b;
                }
                .row .value {
                    font-weight: 500;
                    color: #1f2421;
                    text-align: right;
                }
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 12px 0;
                }
                .items-table th {
                    text-align: left;
                    padding: 8px 12px;
                    background: #f8f9fa;
                    font-weight: 600;
                    font-size: 13px;
                    color: #60696b;
                    border-bottom: 2px solid #e8ebeb;
                }
                .items-table td {
                    padding: 8px 12px;
                    font-size: 14px;
                    border-bottom: 1px solid #f0f0f0;
                }
                .items-table .item-name {
                    font-weight: 500;
                }
                .items-table .item-qty {
                    text-align: center;
                    color: #60696b;
                }
                .items-table .item-price {
                    text-align: right;
                    font-weight: 500;
                }
                .items-table .addon-row td {
                    padding: 2px 12px 2px 24px;
                    font-size: 12px;
                    color: #888;
                    border-bottom: none;
                    border-left: 3px solid #d9531e;
                }
                .items-table .addon-row .addon-name {
                    padding-left: 8px;
                }
                .items-table .addon-row .addon-price {
                    text-align: right;
                    color: #888;
                }
                .items-table .item-total-row td {
                    padding: 4px 12px;
                    font-size: 13px;
                    font-weight: 600;
                    border-top: 1px dashed #ddd;
                    border-bottom: 1px solid #f0f0f0;
                }
                .items-table .item-total-row .total-label {
                    text-align: right;
                    color: #1f2421;
                }
                .items-table .item-total-row .total-value {
                    text-align: right;
                    color: #d9531e;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    margin-top: 8px;
                    border-top: 2px solid #1f2421;
                    font-size: 18px;
                    font-weight: 700;
                }
                .total-row .total-label {
                    color: #1f2421;
                }
                .total-row .total-value {
                    color: #d9531e;
                }
                .discount-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 4px 0;
                    font-size: 14px;
                    color: #2e7d32;
                    font-weight: 600;
                }
                .delivery-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 4px 0;
                    font-size: 14px;
                    color: #60696b;
                    border-top: 1px solid #e8ebeb;
                    margin-top: 4px;
                }
                .delivery-row .delivery-label {
                    color: #60696b;
                }
                .delivery-row .delivery-value {
                    font-weight: 600;
                    color: ${deliveryFeeColor};
                }
                .subtotal-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 4px 0;
                    font-size: 14px;
                    color: #60696b;
                    border-bottom: 1px solid #e8ebeb;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 16px;
                    border-top: 1px solid #e8ebeb;
                    text-align: center;
                    font-size: 12px;
                    color: #8c9699;
                }
                .scheduled-badge {
                    background: #fdf3ef;
                    color: #d9531e;
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-weight: 600;
                    font-size: 13px;
                }
                @media print {
                    body { padding: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <!-- HEADER -->
            <div class="header">
                <div>
                    <h1>🚀 <span>Smart</span>Delivery</h1>
                    <div style="font-size: 13px; color: #60696b; margin-top: 4px;">
                        ${storeName}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div class="order-number">#${order.order_number}</div>
                    <div style="font-size: 13px; color: #60696b; margin-top: 4px;">
                        ${formatDate(order.created_at)}
                    </div>
                </div>
            </div>

            <!-- STATUS -->
            <div style="margin-bottom: 20px;">
                <span class="status-badge" style="
                    background: ${order.status === 'scheduled' ? '#fdf3ef' : 
                               order.status === 'confirmado' ? '#e8f5e9' :
                               order.status === 'preparando' ? '#fff3e0' :
                               order.status === 'despachado' ? '#e3f2fd' :
                               order.status === 'entregue' ? '#e8f5e9' :
                               order.status === 'cancelado' ? '#ffebee' : '#f5f5f5'};
                    color: ${order.status === 'scheduled' ? '#d9531e' :
                            order.status === 'confirmado' ? '#2e7d32' :
                            order.status === 'preparando' ? '#e65100' :
                            order.status === 'despachado' ? '#0d47a1' :
                            order.status === 'entregue' ? '#2e7d32' :
                            order.status === 'cancelado' ? '#c62828' : '#1f2421'};
                ">
                    ${statusLabels[order.status] || order.status}
                </span>
                ${order.is_scheduled && order.scheduled_time ? `
                    <span class="scheduled-badge" style="margin-left: 8px;">
                        ${getScheduledDisplay()}
                    </span>
                ` : ''}
            </div>

            <!-- DADOS DO CLIENTE -->
            <div class="section">
                <div class="section-title">👤 Dados do Cliente</div>
                <div class="row">
                    <span class="label">Cliente</span>
                    <span class="value">${order.customer_name || 'N/A'}</span>
                </div>
                <div class="row">
                    <span class="label">Telefone</span>
                    <span class="value">${order.customer_phone || 'N/A'}</span>
                </div>
                <div class="row">
                    <span class="label">Endereço</span>
                    <span class="value">${order.customer_address || 'N/A'}</span>
                </div>
                <div class="row">
                    <span class="label">Pagamento</span>
                    <span class="value">${order.payment_method || 'N/A'}</span>
                </div>
            </div>

            <!-- ITENS COM ACOMPANHAMENTOS -->
            <div class="section">
                <div class="section-title">🛒 Itens do Pedido</div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 50%;">Item</th>
                            <th style="width: 15%; text-align: center;">Qtd</th>
                            <th style="width: 20%; text-align: right;">Preço</th>
                            <th style="width: 15%; text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => {
                            const hasAddons = item.addons && item.addons.length > 0;
                            const itemTotal = (item.price * item.qty) + (item.addons || []).reduce((sum, a) => sum + (a.price * a.quantity), 0);
                            
                            return `
                                <tr>
                                    <td class="item-name">${item.name}</td>
                                    <td class="item-qty">${item.qty}</td>
                                    <td class="item-price">R$ ${(item.price || 0).toFixed(2).replace('.', ',')}</td>
                                    <td class="item-price">R$ ${((item.price || 0) * (item.qty || 1)).toFixed(2).replace('.', ',')}</td>
                                </tr>
                                ${hasAddons ? item.addons.map(addon => `
                                    <tr class="addon-row">
                                        <td colspan="1">
                                            <span style="padding-left: 16px;">+ ${addon.quantity}x ${addon.name}</span>
                                        </td>
                                        <td class="item-qty"></td>
                                        <td class="item-price" style="color: #888;">
                                            R$ ${(addon.price || 0).toFixed(2).replace('.', ',')}
                                        </td>
                                        <td class="item-price" style="color: #888;">
                                            R$ ${((addon.price || 0) * (addon.quantity || 1)).toFixed(2).replace('.', ',')}
                                        </td>
                                    </tr>
                                `).join('') : ''}
                                ${hasAddons ? `
                                    <tr class="item-total-row">
                                        <td colspan="3" class="total-label">Total do item</td>
                                        <td class="total-value">R$ ${itemTotal.toFixed(2).replace('.', ',')}</td>
                                    </tr>
                                ` : ''}
                            `;
                        }).join('')}
                    </tbody>
                </table>

                <!-- SUBTOTAL COM ACOMPANHAMENTOS -->
                <div class="subtotal-row">
                    <span>Subtotal</span>
                    <span>${formatMoney(subtotalWithAddons)}</span>
                </div>

                <!-- DESCONTO -->
                ${hasDiscount ? `
                    <div class="discount-row">
                        <span>💰 ${discountText}</span>
                        <span>- ${formatMoney(order.discount)}</span>
                    </div>
                ` : ''}

                <!-- TAXA DE ENTREGA -->
                <div class="delivery-row">
                    <span class="delivery-label">🚚 Taxa de entrega</span>
                    <span class="delivery-value">${deliveryFeeDisplay}</span>
                </div>

                <!-- TOTAL -->
                <div class="total-row">
                    <span class="total-label">TOTAL DO PEDIDO</span>
                    <span class="total-value">${formatMoney(order.total)}</span>
                </div>
            </div>

            <!-- OBSERVAÇÕES -->
            ${order.notes ? `
                <div class="section">
                    <div class="section-title">📝 Observações</div>
                    <p style="font-size: 14px; color: #60696b; padding: 8px 0;">${order.notes}</p>
                </div>
            ` : ''}

            <!-- FOOTER -->
            <div class="footer">
                Documento gerado em ${new Date().toLocaleString('pt-BR')} • Smart Delivery SaaS
                <br>
                Este documento é uma cópia do pedido #${order.order_number}
            </div>

            <!-- BOTÃO IMPRIMIR -->
            <div class="no-print" style="text-align: center; margin-top: 24px;">
                <button onclick="window.print()" style="
                    padding: 12px 40px;
                    background: #d9531e;
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: inherit;
                ">
                    🖨️ Imprimir / Salvar PDF
                </button>
                <button onclick="window.close()" style="
                    padding: 12px 40px;
                    background: #60696b;
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: inherit;
                    margin-left: 12px;
                ">
                    ✕ Fechar
                </button>
            </div>
        </body>
        </html>
    `;

    // Abrir janela de impressão
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
        alert('Por favor, permita pop-ups para imprimir o pedido.');
        return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };
};