# Backend LeadFlow AI

## Estrutura

```text
backend/
├── app/
│   ├── api/
│   │   ├── deps.py
│   │   ├── endpoints/
│   │   └── router.py
│   ├── core/
│   │   └── config.py
│   ├── db/
│   │   ├── base.py
│   │   ├── seed.py
│   │   └── session.py
│   ├── models/
│   │   ├── agent_settings.py
│   │   ├── enums.py
│   │   └── lead.py
│   ├── schemas/
│   │   ├── approach.py
│   │   ├── auth.py
│   │   ├── crm.py
│   │   ├── dashboard.py
│   │   ├── lead.py
│   │   └── settings.py
│   ├── services/
│   │   ├── approach_service.py
│   │   ├── crm_service.py
│   │   ├── dashboard_service.py
│   │   ├── diagnosis_service.py
│   │   ├── lead_service.py
│   │   ├── score_service.py
│   │   └── settings_service.py
│   └── main.py
├── postman/
├── tests/
├── requirements.txt
└── server.js
```

## Como rodar

### Autenticacao Node + JWT

```bash
cd backend
npm install
npm run dev
```

Rotas:

- `GET /api/health`
- `GET /api/auth/demo-capabilities`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

O login demo nao depende de banco. O header `x-demo-simulate` aceita:

- `invalid_credentials`
- `rate_limit`
- `server_error`
- `timeout`
- `malformed_response`

Testes:

```bash
cd backend
npm test
```

Colecao Postman:

- `backend/postman/leadflow-auth.postman_collection.json`

### Dados FastAPI

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

O backend cria tabelas e seed automaticamente no startup.

Por padrao ele usa banco real SQLite em `backend/leadflow.db`.
Se quiser PostgreSQL, configure `DATABASE_URL=postgresql+psycopg://...`.

As rotas de dados exigem `Authorization: Bearer <token>` e aceitam:

- JWT emitido pelo backend Node usando o mesmo segredo
- `demo-token` para o login demo local da API FastAPI

Rotas principais da API de dados:

- `GET /api/health`
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
