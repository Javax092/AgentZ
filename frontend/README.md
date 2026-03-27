# Frontend AgentZ

Frontend React + Vite do AgentZ. Este diretório é independente para desenvolvimento local e para deploy na Vercel.

## Stack

- React 18
- Vite 5
- TypeScript
- Tailwind CSS

## Variáveis de ambiente

Copie `frontend/.env.example` para `frontend/.env`.

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Use apenas variáveis com prefixo `VITE_` no frontend. Segredos devem ficar somente no backend.
Para overrides locais, prefira `frontend/.env.local`; esse arquivo nao deve ser commitado.

## Rodando localmente

```bash
cd frontend
npm install
npm run dev
```

## Build local

```bash
cd frontend
npm install
npm run build
npm run preview
```

## Deploy na Vercel

- Root Directory: `frontend`
- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

Configure a variável `VITE_API_BASE_URL` na Vercel apontando para a URL pública da API no Railway, por exemplo:

```env
VITE_API_BASE_URL=https://seu-backend.up.railway.app/api
```
