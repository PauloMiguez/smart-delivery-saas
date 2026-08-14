// ============================================================
//  PUSH NOTIFICATIONS - ENDPOINTS
// ============================================================
//  Adicione este código no server.js antes do app.listen()
// ============================================================

const webpush = require('web-push');

// Configurar VAPID
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:seu-email@dominio.com',
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('✅ VAPID configurado para push notifications');
} else {
  console.warn('⚠️ VAPID keys não configuradas. Push notifications não funcionarão.');
  console.warn('   Adicione VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no .env');
}

// Armazenar subscriptions (em produção, usar banco de dados)
const pushSubscriptions = new Map();

// ============================================================
//  ENDPOINT: Obter chave pública VAPID
// ============================================================
app.get('/api/push/vapid-public-key', (req, res) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(404).json({ 
        error: 'VAPID public key not configured',
        message: 'O administrador precisa configurar as VAPID keys'
      });
    }
    res.json({ publicKey });
  } catch (error) {
    console.error('❌ Erro ao obter VAPID key:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
//  ENDPOINT: Inscrever para push notifications
// ============================================================
app.post('/api/push/subscribe', async (req, res) => {
  try {
    const tenant = req.query.tenant || 'default';
    const subscription = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Subscription inválida' });
    }
    
    const tenantKey = `tenant-${tenant}`;
    if (!pushSubscriptions.has(tenantKey)) {
      pushSubscriptions.set(tenantKey, []);
    }
    
    const subscriptions = pushSubscriptions.get(tenantKey);
    const exists = subscriptions.some(s => s.endpoint === subscription.endpoint);
    
    if (!exists) {
      subscriptions.push(subscription);
      console.log(`✅ Nova subscription para ${tenantKey}: ${subscription.endpoint.substring(0, 50)}...`);
    } else {
      console.log(`🔄 Subscription já existe para ${tenantKey}`);
    }
    
    res.json({ 
      success: true, 
      message: 'Inscrito com sucesso!',
      subscriptionsCount: subscriptions.length 
    });
  } catch (error) {
    console.error('❌ Erro ao inscrever:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
//  ENDPOINT: Desinscrever de push notifications
// ============================================================
app.post('/api/push/unsubscribe', async (req, res) => {
  try {
    const tenant = req.query.tenant || 'default';
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint não fornecido' });
    }
    
    const tenantKey = `tenant-${tenant}`;
    if (pushSubscriptions.has(tenantKey)) {
      const subscriptions = pushSubscriptions.get(tenantKey);
      const filtered = subscriptions.filter(s => s.endpoint !== endpoint);
      pushSubscriptions.set(tenantKey, filtered);
      console.log(`🗑️ Subscription removida para ${tenantKey}`);
    }
    
    res.json({ success: true, message: 'Desinscrito com sucesso!' });
  } catch (error) {
    console.error('❌ Erro ao desinscrever:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
//  ENDPOINT: Contar subscriptions (debug)
// ============================================================
app.get('/api/push/stats', (req, res) => {
  try {
    const stats = {};
    for (const [key, subscriptions] of pushSubscriptions) {
      stats[key] = subscriptions.length;
    }
    res.json({ 
      total: pushSubscriptions.size,
      tenants: stats 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
//  FUNÇÃO: Enviar notificação push
// ============================================================
async function sendPushNotification(tenant, payload) {
  const tenantKey = `tenant-${tenant}`;
  const subscriptions = pushSubscriptions.get(tenantKey) || [];
  
  if (subscriptions.length === 0) {
    console.log(`📭 Nenhuma subscription para ${tenantKey}`);
    return { sent: 0, failed: 0, total: 0 };
  }
  
  console.log(`📤 Enviando push para ${subscriptions.length} dispositivos (${tenantKey})`);
  
  let sent = 0;
  let failed = 0;
  
  const notifications = subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      sent++;
      console.log(`✅ Push enviado com sucesso`);
      return { success: true };
    } catch (error) {
      failed++;
      console.error(`❌ Erro ao enviar push:`, error.message);
      
      // Se a subscription expirou, remover
      if (error.statusCode === 410 || error.statusCode === 404) {
        const subs = pushSubscriptions.get(tenantKey) || [];
        pushSubscriptions.set(
          tenantKey,
          subs.filter(s => s.endpoint !== subscription.endpoint)
        );
        console.log(`🗑️ Subscription removida (expirada)`);
      }
      return { success: false, error: error.message };
    }
  });
  
  const results = await Promise.allSettled(notifications);
  
  return { 
    sent, 
    failed, 
    total: subscriptions.length,
    results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false })
  };
}

// ============================================================
//  FUNÇÃO: Notificar novo pedido
// ============================================================
async function notifyNewOrder(tenant, orderData) {
  const payload = {
    title: '📦 Novo pedido!',
    body: `Pedido #${orderData.orderNumber || 'NOVO'} - Total: R$ ${orderData.total?.toFixed(2) || '0,00'}`,
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: `order-${orderData.orderNumber || Date.now()}`,
    data: {
      url: `/admin?tenant=${tenant}&order=${orderData.id || ''}`,
      type: 'new_order',
      orderId: orderData.id,
      orderNumber: orderData.orderNumber
    },
    vibrate: [200, 100, 200],
  };
  
  return await sendPushNotification(tenant, payload);
}

// ============================================================
//  FUNÇÃO: Notificar atualização de status
// ============================================================
async function notifyOrderStatusUpdate(tenant, orderData) {
  const statusNames = {
    'pending': '📋 Pendente',
    'confirmed': '✅ Confirmado',
    'preparing': '👨‍🍳 Em preparo',
    'dispatched': '🏍️ Despachado',
    'delivered': '📦 Entregue',
    'scheduled': '📅 Agendado',
    'canceled': '❌ Cancelado'
  };
  
  const statusName = statusNames[orderData.status] || orderData.status;
  
  const payload = {
    title: '📦 Atualização do pedido',
    body: `Pedido #${orderData.orderNumber || 'NOVO'} - Status: ${statusName}`,
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: `order-${orderData.orderNumber || Date.now()}`,
    data: {
      url: `/track/${orderData.id}?token=${orderData.accessToken || ''}`,
      type: 'status_update',
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      status: orderData.status
    },
    vibrate: [200, 100, 200],
  };
  
  return await sendPushNotification(tenant, payload);
}

console.log('🔔 Push Notifications endpoints carregados!');
