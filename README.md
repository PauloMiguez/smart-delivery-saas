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
- ✅ Modal de acompanhamento do pedido com detalhes
- ✅ Configurações da loja (nome, horário, taxa de entrega, endereço)
- ✅ Upload de banner e logo via Cloudinary
- ✅ Horários de funcionamento configuráveis por dia da semana
- ✅ Notificações em tempo real com WebSocket
- ✅ Layout responsivo com cards mobile

### 🔐 Multi-tenant
- ✅ Isolamento total de dados por restaurante
- ✅ Subdomínios para cada tenant
- ✅ Autenticação JWT por usuário
- ✅ Página de boas-vindas para acessos sem tenant

### 📦 Pedidos
- ✅ Numeração sequencial por tenant (ex: #FIREBURGER-000001)
- ✅ Status: Pendente → Confirmado → Em preparo → Entregue
- ✅ Agendamento de pedidos com limite de 2 dias
- ✅ Status "📅 Agendado" para pedidos programados
- ✅ Notificações em tempo real via WebSocket
- ✅ Link único seguro para acompanhamento (token + validação)
- ✅ Histórico de pedidos por cliente

---

## 🛠️ Tecnologias

### Backend
- **Node.js** + **Express** - API REST
- **MySQL (TiDB Cloud)** - Banco de dados escalável
- **JWT** - Autenticação segura
- **Cloudinary** - Upload e otimização de imagens
- **Socket.io** - Notificações em tempo real
- **Rate Limiting** - Proteção contra abusos

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
│   ├── server.js          # API principal com WebSocket
│   ├── upload.js          # Configuração do Cloudinary
│   ├── package.json
│   └── .env
├── frontend-react/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Client/    # Cardápio, checkout, pedidos, tracking
│   │   │   ├── Admin/     # Dashboard, produtos, categorias, pedidos
│   │   │   └── Shared/    # Componentes reutilizáveis
│   │   ├── contexts/      # Context API (Tenant, Cart, Toast, Modal)
│   │   ├── services/      # API, axios, socket
│   │   ├── styles/        # Tema global, styled components
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── frontend/              # Versão Vanilla (backup)
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
```

### Deploy no Render

1. Conecte seu repositório ao Render
2. Configure o build:
   ```yaml
   Build Command: cd backend && npm install && cd ../frontend-react && npm install && npm run build
   Start Command: cd backend && node server.js
   ```
3. Adicione as variáveis de ambiente
4. Clique em **Deploy**

### Executar Localmente

```bash
# Clonar o repositório
git clone https://github.com/PauloMiguez/smart-delivery-saas.git
cd smart-delivery-saas

# Backend
cd backend
npm install
npm start

# Frontend (outro terminal)
cd frontend-react
npm install
npm run dev

# Acessar
# Cliente: http://localhost:5173/?tenant=fireburger
# Admin: http://localhost:5173/admin?tenant=fireburger
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

---

## 🎯 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Login do administrador |
| POST | `/api/auth/register` | Cadastro do restaurante |
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
| POST | `/api/upload/banner` | Upload do banner |
| POST | `/api/upload/logo` | Upload do logo |
| POST | `/api/upload/product` | Upload de imagem de produto |
| POST | `/api/upload/delete` | Deletar imagem |

---

## 📱 Links do Sistema

| Função | URL |
|--------|-----|
| **🏠 Cardápio (Cliente)** | `https://smart-delivery-saas.onrender.com/?tenant=seu-tenant` |
| **⚙️ Painel Admin** | `https://smart-delivery-saas.onrender.com/admin?tenant=seu-tenant` |
| **🔐 Login** | `https://smart-delivery-saas.onrender.com/login` |
| **📝 Registro** | `https://smart-delivery-saas.onrender.com/register` |
| **📋 Meus Pedidos** | `https://smart-delivery-saas.onrender.com/verify-orders?tenant=seu-tenant` |
| **🔗 Acompanhar Pedido** | `https://smart-delivery-saas.onrender.com/track/{id}?token={token}` |

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
7. Cliente acompanha o pedido pelo link único
   ↓
8. Pedido é entregue e finalizado
```

---

## 📊 Status do Pedido

| Status | Descrição |
|--------|-----------|
| 📋 Pendente | Aguardando confirmação do restaurante |
| ✅ Confirmado | Pedido confirmado, aguardando preparo |
| 👨‍🍳 Em preparo | Pedido sendo preparado na cozinha |
| 📦 Entregue | Pedido entregue ao cliente |
| 📅 Agendado | Pedido agendado para data/hora futura |
| ❌ Cancelado | Pedido cancelado |

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
- [ ] Integração com WhatsApp Business API
- [ ] Sistema de cupons de desconto
- [ ] Avaliações de clientes
- [ ] Notificações push (PWA)
- [ ] Mapa de pedidos em tempo real
- [ ] Dashboard personalizável
- [ ] App mobile (React Native)

---

**Desenvolvido com ❤️ para o ecossistema de delivery SaaS**

🔗 **Demo:** https://smart-delivery-saas.onrender.com/?tenant=fireburger
📧 **Contato:** seu-email@dominio.com
```

## 📦 **COMMIT E DEPLOY**

```bash
# 1. Substituir o README.md
cat > README.md << 'EOF'
# (conteúdo acima)
EOF

# 2. Commit
git add README.md
git commit -m "docs: atualiza README com todas as funcionalidades do sistema

- Adiciona agendamento de pedidos
- Adiciona horários de funcionamento
- Adiciona status '📅 Agendado'
- Adiciona endpoints da API
- Atualiza estrutura do projeto
- Adiciona links do sistema"

git push origin main
```

---

**O README.md está atualizado e completo!** 📚🚀
