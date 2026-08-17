# 🚀 Smart Delivery SaaS

Sistema de delivery multi-tenant (SaaS) onde múltiplos restaurantes podem se cadastrar, gerenciar seu cardápio e receber pedidos. Cada restaurante tem seu próprio subdomínio e dados isolados.

![Smart Delivery SaaS](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933)
![MySQL](https://img.shields.io/badge/MySQL-TiDB%20Cloud-4479a1)

---

## 📋 Funcionalidades

### 🛒 Cliente
- ✅ Cardápio online com categorias e produtos
- ✅ Carrinho de compras flutuante com drawer
- ✅ Checkout completo com CEP automático (ViaCEP)
- ✅ Status "Aberto/Fechado" baseado no horário local
- ✅ Design responsivo para dispositivos móveis
- ✅ Agendamento de pedidos (hoje, amanhã e depois de amanhã)
- ✅ Histórico de pedidos com verificação de nome/telefone
- ✅ Acompanhamento de pedidos em tempo real com link único
- ✅ Notificações via WhatsApp com resumo do pedido

### ⚙️ Painel Administrativo
- ✅ Dashboard com métricas e gráficos (vendas, status, produtos)
- ✅ Filtros por período (hoje/semana/mês/todos)
- ✅ CRUD de produtos com upload de imagens (Cloudinary)
- ✅ CRUD de categorias com ordenação
- ✅ Gerenciamento de pedidos com atualização de status
- ✅ Modal de acompanhamento do pedido com detalhes e impressão PDF
- ✅ Configurações da loja (nome, horário, endereço)
- ✅ Upload de banner e logo via Cloudinary
- ✅ Horários de funcionamento configuráveis por dia da semana
- ✅ Taxa de entrega configurável (Fixa/Dinâmica/Manual)
- ✅ Notificações em tempo real com WebSocket
- ✅ Layout responsivo com cards mobile
- ✅ Alteração de senha do administrador
- ✅ Botão de logout no painel

### 🔐 Multi-tenant
- ✅ Isolamento total de dados por restaurante
- ✅ Subdomínios para cada tenant
- ✅ Autenticação JWT por usuário
- ✅ Página de boas-vindas para acessos sem tenant
- ✅ Detecção automática de tenant por domínio personalizado
- ✅ Redirecionamento para domínio personalizado (quando disponível)

### 📦 Pedidos
- ✅ Numeração sequencial por tenant (ex: #FIREBURGER-000001)
- ✅ Status: Pendente → Confirmado → Em preparo → Despachado → Entregue
- ✅ Agendamento de pedidos com limite de 2 dias
- ✅ Status "📅 Agendado" para pedidos programados
- ✅ Status "🏍️ Despachado" para pedidos em rota de entrega
- ✅ Notificações em tempo real via WebSocket
- ✅ Link único seguro para acompanhamento (token + validação)
- ✅ Histórico de pedidos por cliente

### 🚚 Taxa de Entrega
- ✅ **Fixa:** Valor único para todos os pedidos
- ✅ **Dinâmica:** Valor por bairro configurável
- ✅ **Manual:** Definida após o pedido
- ✅ Cálculo automático baseado no endereço do cliente
- ✅ Exibição "Informada após o pedido" para taxas pendentes

### 💰 Desconto por Forma de Pagamento
- ✅ Configurável por tenant
- ✅ Aplicável para Dinheiro e Pix
- ✅ Percentual configurável (padrão 4%)
- ✅ Exibido no checkout, admin e tracking
- ✅ Gerenciamento via painel administrativo

### 🌐 Domínios Personalizados
- ✅ Suporte a múltiplos domínios por tenant
- ✅ Configuração via variável de ambiente
- ✅ Detecção automática do tenant pelo domínio
- ✅ URLs limpas sem parâmetros
- ✅ Redirecionamento condicional (ignora rotas /admin)

### 🔔 Notificações Push (PWA)
- ✅ Service Worker registrado e ativo
- ✅ Permissão de notificação solicitada automaticamente
- ✅ Inscrição push salva no banco por dispositivo
- ✅ Notificações específicas por dispositivo (device_token)
- ✅ Envio automático por mudança de status
- ✅ Mensagens personalizadas por status
- ✅ Redirecionamento para página de tracking ao clicar
- ✅ Suporte a múltiplos dispositivos
- ✅ Componente de permissão apenas em rotas públicas

---

## 🛠️ Tecnologias

### Backend
- **Node.js** + **Express** - API REST
- **MySQL (TiDB Cloud)** - Banco de dados escalável
- **JWT** - Autenticação segura
- **Cloudinary** - Upload e otimização de imagens
- **Socket.io** - Notificações em tempo real
- **Rate Limiting** - Proteção contra abusos
- **Web Push API** - Notificações push com VAPID

### Frontend
- **React 18** + **Vite** - Interface moderna e rápida
- **Styled Components** - Estilização com design system
- **React Router DOM** - Navegação SPA
- **Recharts** - Gráficos e visualizações
- **Axios** - Requisições HTTP
- **Socket.io-client** - Comunicação em tempo real

### Infraestrutura
- **Render.com** - Hospedagem (gratuito)
- **TiDB Cloud** - Banco de dados escalável
- **Cloudinary** - CDN de imagens
- **ViaCEP** - API de busca de CEP

---

## 📁 Estrutura do Projeto
```
smart-delivery-saas/
├── backend/
│   ├── server.js # API principal com WebSocket
│   ├── upload.js # Configuração do Cloudinary
│   ├── package.json
│   └── .env
├── frontend-react/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Client/ # Cardápio, checkout, pedidos, tracking
│   │   │   ├── Admin/ # Dashboard, produtos, categorias, pedidos
│   │   │   └── Shared/ # Componentes reutilizáveis
│   │   ├── contexts/ # Context API (Tenant, Cart, Toast, Modal)
│   │   ├── services/ # API, axios, socket
│   │   ├── styles/ # Tema global, tokens, styled components
│   │   └── App.jsx
│   ├── public/
│   │   ├── service-worker.js # Service Worker PWA
│   │   ├── manifest.json # Manifest PWA
│   │   └── offline.html # Página offline
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Deploy

### Pré-requisitos
- Node.js v18+
- Conta no [Render](https://render.com)
- Conta no [TiDB Cloud](https://tidbcloud.com)
- Conta no [Cloudinary](https://cloudinary.com)

### Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
# Banco de Dados
DB_HOST=gateway01.us-east-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=smart_delivery_saas

# Servidor
PORT=3000
JWT_SECRET=seu_jwt_secret
NODE_ENV=production

# Cloudinary
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret
CLOUDINARY_FOLDER=smart-delivery

# VAPID Keys (Push Notifications)
VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada

# Domínios Personalizados (opcional)
TENANT_DOMAINS=fireburgerpetropolis.com.br:fireburger,outrodominio.com:outrotenant
```

### Deploy no Render

Conecte seu repositório ao Render e configure:

```yaml
Build Command: cd backend && npm install && cd ../frontend-react && npm install && npm run build
Start Command: cd backend && node server.js
```

---

## 🔒 Segurança
- ✅ JWT para autenticação de administradores
- ✅ Rate Limiting por tenant (100 req/min)
- ✅ Isolamento de dados entre tenants
- ✅ Conexão SSL com o banco de dados
- ✅ Validação de dados no backend
- ✅ Sanitização de entradas do usuário
- ✅ Token único para acompanhamento de pedidos
- ✅ Validação de nome e telefone para acesso aos pedidos
- ✅ Senhas hashadas com bcrypt
- ✅ Proteção contra SQL Injection

---

## 🎯 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Login do administrador |
| POST | `/api/auth/register` | Cadastro do restaurante |
| PUT | `/api/auth/change-password` | Alterar senha do administrador |
| GET | `/api/domain-mapping` | Mapeamento de domínios personalizados |
| GET | `/api/products` | Listar produtos |
| POST | `/api/products` | Criar produto |
| PUT | `/api/products/:id` | Atualizar produto |
| DELETE | `/api/products/:id` | Remover produto |
| GET | `/api/categories` | Listar categorias |
| POST | `/api/categories` | Criar categoria |
| PUT | `/api/categories/:id` | Atualizar categoria |
| DELETE | `/api/categories/:id` | Remover categoria |
| GET | `/api/orders` | Listar pedidos |
| POST | `/api/orders` | Criar pedido |
| GET | `/api/orders/:id` | Buscar pedido por ID (com token) |
| PUT | `/api/orders/:id/status` | Atualizar status do pedido |
| GET | `/api/config` | Obter configurações |
| PUT | `/api/config` | Atualizar configurações |
| GET | `/api/stats/orders` | Estatísticas de pedidos |
| GET | `/api/stats/dashboard` | Dados do dashboard |
| GET | `/api/operating-hours` | Buscar horários de funcionamento |
| PUT | `/api/operating-hours` | Atualizar horários de funcionamento |
| GET | `/api/orders/available-slots` | Verificar horários disponíveis |
| POST | `/api/calculate-delivery` | Calcular taxa de entrega |
| GET | `/api/notifications/vapid-public-key` | Obter chave VAPID pública |
| POST | `/api/notifications/subscribe` | Inscrever dispositivo para push |

---

## 📱 Links do Sistema

| Função | URL |
|--------|-----|
| 🏠 Cardápio (Cliente) | `https://smart-delivery-saas.onrender.com/?tenant=seu-tenant` |
| ⚙️ Painel Admin | `https://smart-delivery-saas.onrender.com/admin?tenant=seu-tenant` |
| 🔐 Login | `https://smart-delivery-saas.onrender.com/login` |
| 📝 Registro | `https://smart-delivery-saas.onrender.com/register` |
| 📋 Meus Pedidos | `https://smart-delivery-saas.onrender.com/verify-orders?tenant=seu-tenant` |
| 🔗 Acompanhar Pedido | `https://smart-delivery-saas.onrender.com/track/{id}?token={token}` |

---

## 👥 Fluxo do Sistema

```
1. Restaurante se cadastra e cria sua conta
   ↓
2. Restaurante configura a loja (horário, taxa, imagens)
   ↓
3. Restaurante adiciona categorias e produtos
   ↓
4. Cliente acessa o cardápio e faz um pedido
   ↓
5. Restaurante recebe notificação em tempo real
   ↓
6. Restaurante confirma e prepara o pedido
   ↓
7. Restaurante despacha para entrega
   ↓
8. Cliente acompanha o pedido pelo link único
   ↓
9. Pedido é entregue e finalizado
```

---

## 📊 Status do Pedido

| Status | Descrição | Cor |
|--------|-----------|-----|
| 📋 Pendente | Aguardando confirmação do restaurante | Amarelo |
| ✅ Confirmado | Pedido confirmado, aguardando preparo | Verde |
| 👨‍🍳 Em preparo | Pedido sendo preparado na cozinha | Laranja |
| 🏍️ Despachado | Pedido saiu para entrega | Azul |
| 📦 Entregue | Pedido entregue ao cliente | Verde escuro |
| 📅 Agendado | Pedido agendado para data/hora futura | Azul claro |
| ❌ Cancelado | Pedido cancelado | Vermelho |

---

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT.

---

## 🙏 Agradecimentos

- [TiDB Cloud](https://tidbcloud.com) - Banco de dados escalável
- [Cloudinary](https://cloudinary.com) - Serviço de imagens
- [Render](https://render.com) - Hospedagem
- [ViaCEP](https://viacep.com.br) - API de CEP
- [Socket.io](https://socket.io) - Comunicação em tempo real
- [Recharts](https://recharts.org) - Biblioteca de gráficos

---

## 🎯 Próximas Melhorias

- [ ] Relatórios avançados com exportação
- [ ] Sistema de cupons de desconto
- [ ] Avaliações de clientes
- [ ] Notificações push aprimoradas (PWA)
- [ ] Métricas avançadas no dashboard
- [ ] Testes automatizados
- [ ] Documentação da API (Swagger/OpenAPI)

---

🔗 **Demo:** https://smart-delivery-saas.onrender.com/?tenant=fireburger  
🌐 **Domínio Personalizado:** https://fireburgerpetropolis.com.br  
📧 **Contato:** seu-email@dominio.com
```

