# AgentZ

Monorepo full stack com backend FastAPI preparado para deploy no Railway e frontend React + Vite preparado para deploy na Vercel.

## Visão geral

O objetivo desta estrutura é evitar autodetecção frágil de stack e permitir deploy independente por subdiretório:

- Railway deve apontar para `backend`
- Vercel deve apontar para `frontend`

Cada aplicação agora tem configuração própria, variáveis separadas e documentação isolada.

## Estrutura

```text
AgentZ/
├── backend/
│   ├── app/
│   ├── postman/
│   ├── tests/
│   ├── .env.example
│   ├── Procfile
│   ├── railway.json
│   ├── requirements.txt
│   ├── runtime.txt
│   └── README.md
├── docs/
│   └── legacy/
│       └── backend-node-auth/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── .gitignore
└── README.md
```

## Variáveis de ambiente

### Backend

Arquivo: `backend/.env`

```env
APP_ENV=development
APP_PORT=8000
DATABASE_URL=sqlite:///./leadflow.db
CORS_ORIGINS=http://localhost:5173
AUTH_JWT_SECRET=change-me-in-production
GEMINI_ENABLED=false
GEMINI_API_KEY=
```

### Frontend

Arquivo: `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Regras:

- tudo que começa com `VITE_` fica exposto ao navegador
- segredos ficam apenas no backend

## Rodando localmente

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Build local

### Backend

```bash
cd backend
python3 -m compileall app
python3 -m unittest discover -s tests
```

### Frontend

```bash
cd frontend
npm install
npm run build
npm run preview
```

## Deploy no Railway

Backend pronto para deploy isolado a partir de `backend`.

Checklist:

- Root Directory: `backend`
- Variáveis configuradas no serviço: `DATABASE_URL`, `CORS_ORIGINS`, `AUTH_JWT_SECRET`, `GEMINI_*` quando necessário
- Start command explícito: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Não depender de arquivos da raiz do monorepo

Arquivos usados pelo Railway:

- `backend/requirements.txt`
- `backend/Procfile`
- `backend/railway.json`
- `backend/runtime.txt`

## Deploy na Vercel

Frontend pronto para deploy isolado a partir de `frontend`.

Checklist:

- Root Directory: `frontend`
- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- Variável obrigatória: `VITE_API_BASE_URL=https://seu-backend.up.railway.app/api`

## Notas de robustez

- O backend Node legado foi retirado de `backend/` e preservado em `docs/legacy/backend-node-auth/`.
- `node_modules`, `dist`, `.venv`, banco local e arquivos gerados agora ficam ignorados no Git.
- O backend aceita `PORT` automaticamente em produção e `APP_PORT` em ambiente local.
- O frontend mantém somente variáveis públicas com prefixo `VITE_`.
