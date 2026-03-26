# Teste Manual via Postman

Base URL padrao: `http://localhost:3000`

## Sequencia recomendada

1. `GET /api/health`
2. `GET /api/auth/demo-capabilities`
3. `POST /api/auth/login` com:

```json
{
  "email": "admin@leadflow.ai",
  "password": "123456"
}
```

4. Copie `access_token` e `refresh_token`
5. `GET /api/auth/me` com header `Authorization: Bearer <access_token>`
6. `POST /api/auth/refresh` com:

```json
{
  "refresh_token": "<refresh_token>"
}
```

## Simulacoes de falha

Adicione o header `x-demo-simulate` no login:

- `timeout`
- `server_error`
- `rate_limit`
- `malformed_response`
- `invalid_credentials`

## Resultado esperado no frontend

- Backend auth online + dados online: sessao remota.
- Backend auth online + dados offline: sessao `hybrid`.
- Backend auth offline + credenciais demo validas: sessao `offline-demo`.
