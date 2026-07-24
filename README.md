Sistema de delivery multi-tenant (SaaS) onde múltiplos restaurantes podem se cadastrar, gerenciar seu cardápio e receber pedidos. Cada restaurante tem seu próprio subdomínio e dados isolados.

## 📋 Funcionalidades

- ✅ **Multi-tenant**: Cada restaurante tem seu próprio subdomínio e dados isolados
- ✅ **Painel Administrativo**: Gerencie produtos, categorias, pedidos e configurações
- ✅ **Cardápio Online**: Clientes visualizam produtos e fazem pedidos
- ✅ **Checkout com CEP Automático**: ViaCEP integrado para preencher endereço
- ✅ **Gestão de Pedidos**: Acompanhamento de status em tempo real
- ✅ **Notificações via WhatsApp**: Integração para enviar pedidos ao restaurante
- ✅ **Upload de Imagens**: Cloudinary integrado para banner, logo e produtos
- ✅ **Autenticação JWT**: Login seguro para administradores
- ✅ **Rate Limiting**: Proteção contra abusos
- ✅ **Dashboard**: Métricas de pedidos e faturamento

## 🛠️ Tecnologias

### Backend
- **Node.js** + **Express** - API REST
- **MySQL (TiDB Cloud)** - Banco de dados
- **JWT** - Autenticação
- **Cloudinary** - Upload e otimização de imagens

### Frontend
- **HTML** + **CSS** + **JavaScript** (Vanilla)
- **Responsivo** - Mobile-first

### Infraestrutura
- **Render.com** - Hospedagem
- **TiDB Cloud** - Banco de dados escalável
- **Cloudinary** - CDN de imagens

## 🚀 Deploy

### Pré-requisitos
- Node.js v18+
- Conta no [Render](https://render.com)
- Conta no [TiDB Cloud](https://tidbcloud.com)
- Conta no [Cloudinary](https://cloudinary.com)

### Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
DB_HOST=gateway01.us-east-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=smart_delivery_saas
JWT_SECRET=seu_jwt_secret
PORT=3000
NODE_ENV=production

# Cloudinary
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret
CLOUDINARY_FOLDER=smart-delivery
```

### Deploy no Render

1. Conecte seu repositório ao Render
2. Configure:
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && node server.js`
3. Adicione as variáveis de ambiente
4. Clique em **Deploy**

### Executar Localmente

```bash
# Clonar o repositório
git clone https://github.com/PauloMiguez/smart-delivery-saas.git
cd smart-delivery-saas

# Instalar dependências
cd backend && npm install

# Executar
node server.js

# Acessar
# Frontend: http://localhost:3000
# Admin: http://localhost:3000/admin
# Login: http://localhost:3000/login.html
```

## 📁 Estrutura do Projeto

```
smart-delivery-saas/
├── backend/
│   ├── server.js          # API principal
│   ├── upload.js          # Configuração do Cloudinary
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/            # Cliente (cardápio, checkout)
│   │   ├── index.html
│   │   ├── app.js
│   │   ├── style.css
│   │   ├── login.html
│   │   └── register.html
│   └── admin/             # Painel administrativo
│       ├── index.html
│       ├── admin.js
│       └── style.css
└── README.md
```

## 🔒 Segurança

- **JWT** para autenticação
- **Rate Limiting** por tenant
- **Isolamento de dados** entre tenants
- **Conexão SSL** com o banco de dados
- **Validação de dados** no backend

## 🎯 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Login do administrador |
| POST | `/api/auth/register` | Cadastro do restaurante |
| GET | `/api/products` | Listar produtos |
| POST | `/api/products` | Criar produto |
| GET | `/api/categories` | Listar categorias |
| POST | `/api/categories` | Criar categoria |
| GET | `/api/orders` | Listar pedidos |
| POST | `/api/orders` | Criar pedido |
| PUT | `/api/orders/:id/status` | Atualizar status do pedido |
| GET | `/api/config` | Obter configurações |
| POST | `/api/upload/banner` | Upload do banner |
| POST | `/api/upload/logo` | Upload do logo |

## 👥 Fluxo do Sistema

1. **Administrador** se cadastra e cria um restaurante
2. **Administrador** adiciona produtos, categorias e configura a loja
3. **Cliente** acessa o cardápio e faz um pedido
4. **Pedido** aparece no painel administrativo
5. **Restaurante** confirma e prepara o pedido
6. **Cliente** recebe o pedido

## 📱 Links do Sistema

| Função | URL |
|--------|-----|
| **Cliente** | `https://smart-delivery-saas.onrender.com/?tenant=seu-tenant` |
| **Admin** | `https://smart-delivery-saas.onrender.com/admin?tenant=seu-tenant` |
| **Login** | `https://smart-delivery-saas.onrender.com/login.html` |
| **Registro** | `https://smart-delivery-saas.onrender.com/register.html` |

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 🙏 Agradecimentos

- [TiDB Cloud](https://tidbcloud.com) pelo banco de dados escalável
- [Cloudinary](https://cloudinary.com) pelo serviço de imagens
- [Render](https://render.com) pela hospedagem
- [ViaCEP](https://viacep.com.br) pela API de CEP

---




