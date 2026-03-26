# Backend AgentZ

API FastAPI isolada para deploy no Railway a partir do subdiretório `backend`.

## Estrutura

```text
backend/
├── app/
├── postman/
├── tests/
├── .env.example
├── Procfile
├── railway.json
├── requirements.txt
├── runtime.txt
└── README.md
```

## Variáveis de ambiente

Copie `backend/.env.example` para `backend/.env`.

Variáveis principais:

```env
APP_ENV=development
APP_PORT=8000
DATABASE_URL=sqlite:///./leadflow.db
CORS_ORIGINS=http://localhost:5173
AUTH_JWT_SECRET=change-me-in-production
GEMINI_ENABLED=false
GEMINI_API_KEY=
```

Observações:

- Em produção no Railway, a porta vem da variável `PORT`.
- Não exponha segredos do backend no frontend.
- Para PostgreSQL no Railway, configure `DATABASE_URL` com a connection string do serviço.

## Rodando localmente

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Build e validação local

```bash
cd backend
python3 -m compileall app
python3 -m unittest discover -s tests
```

## Deploy no Railway

Configure o serviço para apontar para `backend` como Root Directory.

Parâmetros validados:

- Root Directory: `backend`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Runtime/Builder: Python via Nixpacks

Arquivos de deploy:

- `Procfile`: fornece o processo `web`
- `railway.json`: fixa o `startCommand`
- `runtime.txt`: fixa a versão do Python
- `requirements.txt`: define dependências Python

## Legado preservado

O backend Node antigo foi movido para `docs/legacy/backend-node-auth/` para evitar autodetecção incorreta de stack no Railway sem perder o histórico do código.
