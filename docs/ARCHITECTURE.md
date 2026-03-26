# LeadFlow AI

## Arquitetura de autenticacao demo

- `frontend/`: React + TypeScript com cliente hibrido de autenticacao e dados.
- `backend/server.js`: Node + Express emitindo JWT HS256, refresh token, healthcheck e simulacao de falhas.
- `backend/app/`: FastAPI para dados operacionais de leads, CRM, dashboard e configuracoes.
- `frontend/src/services/mockBackend.ts`: banco local em `localStorage` para operar sem backend e sem banco.

## Fluxo correto

1. O operador faz login em `frontend/src/pages/LoginPage.tsx`.
2. O frontend tenta `POST /api/auth/login` no backend Node.
3. Se a autenticacao remota responde, o frontend salva a sessao JWT.
4. O frontend consulta a saude da API de dados.
5. Se a API de dados estiver indisponivel, a sessao entra em modo `hybrid` e usa mock local.
6. Se o backend de autenticacao estiver offline, lento, malformado ou indisponivel, o frontend libera login demo local com persistencia.
7. Toda chamada relevante gera logs estruturados no console e em `window.__LEADFLOW_LOGS__`.

## Falhas simuladas

O backend Node aceita `x-demo-simulate` em `POST /api/auth/login` para exercitar cenarios:

- `invalid_credentials`
- `rate_limit`
- `server_error`
- `timeout`
- `malformed_response`

## Estratégia de fallback

- Falha de autenticacao com credenciais invalidas: nao faz fallback.
- Timeout, indisponibilidade, erro 5xx ou resposta malformada: ativa `offline-demo`.
- API de dados offline apos login valido: ativa `hybrid`, preservando sessao remota e dados mock.
- Banco ausente: nao bloqueia login demo, porque o backend Node nao depende de banco.

## Escalabilidade

- Segregacao entre autenticacao e dados.
- Sessao tipada e persistida.
- Refresh token pronto para rotacao.
- Mock stateful para operacao local e testes de UX.
- Logs com `requestId` no backend e correlação no frontend.
