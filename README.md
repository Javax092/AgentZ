# LeadFlow AI

CRM comercial para captação, qualificação, diagnóstico e acompanhamento de leads, com integração real na API e fallback demo/offline para uso local.

## O que está funcional

- login pela API real em `POST /api/auth/login`
- sessão persistida com bearer token e refresh automático
- dashboard consumindo API real
- CRUD de leads
- score, diagnóstico e mensagem inicial calculados no backend
- CRM com movimentação de pipeline e histórico de atividades
- settings com recálculo dos leads
- fallback demo/offline no frontend quando a API ficar indisponível
- logs em desenvolvimento
- tratamento global de erros no backend e na UI
- seed inicial com 8 leads realistas de Manaus

## Estrutura

```text
.
├── backend/
│   ├── app/
│   ├── package.json
│   ├── requirements.txt
│   └── server.js
├── docs/
└── frontend/
    ├── src/
    └── package.json
```

## Variáveis de ambiente

### Backend

Copie `backend/.env.example` para `backend/.env` se quiser customizar.

Principais variáveis:

```env
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
DATABASE_URL=sqlite:///./leadflow.db
CORS_ORIGINS=http://localhost:5173
DEMO_EMAIL=admin@leadflow.ai
DEMO_PASSWORD=123456
AUTH_JWT_SECRET=leadflow-local-demo-secret
```

### Frontend

Use `frontend/.env.example` ou exporte:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Subindo localmente

### 1. Backend da API real

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Observações:

- a API usa SQLite por padrão em `backend/leadflow.db`
- no primeiro boot ela cria o schema e faz seed automático
- se você já tinha um banco antigo e quiser reaplicar o seed novo, remova `backend/leadflow.db` antes de subir a API

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

O app ficará disponível em `http://localhost:5173`.

## Login demo

- email: `admin@leadflow.ai`
- senha: `123456`

## API usada pelo frontend

O frontend usa uma única base configurada por `VITE_API_BASE_URL`.

Rotas principais:

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/leads`
- `POST /api/leads`
- `GET /api/leads/{lead_id}`
- `PUT /api/leads/{lead_id}`
- `DELETE /api/leads/{lead_id}`
- `GET /api/crm/board`
- `POST /api/crm/leads/{lead_id}/move`
- `POST /api/crm/leads/{lead_id}/activities`
- `POST /api/approaches/generate`
- `GET /api/settings`
- `PUT /api/settings`

## Fallback demo/offline

Se a API real estiver fora do ar:

- o login demo pode cair para sessão offline
- dashboard, CRM, leads, mensagens e settings passam a operar com seed local
- o frontend sinaliza visualmente quando está em modo demo local

## Seed inicial

O projeto sobe com 8 leads de Manaus já preenchidos para dashboard e CRM:

- barbearias
- clínicas
- imobiliárias
- loja de móveis
- salão de beleza

Os leads entram com scores, diagnósticos, mensagens, etapas e status variados.

## Validação feita

- `cd frontend && npm run build`
- `cd backend && python3 -m compileall app`

Observação:

- não foi possível executar teste HTTP do backend aqui porque as dependências Python do ambiente atual não estavam instaladas

## Notas

- `backend/server.js` continua no repositório como backend Node legado de autenticação, mas o frontend integrado agora usa a API FastAPI em `VITE_API_BASE_URL`
- a autenticação do app usa bearer token no header `Authorization`
