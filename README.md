# Agente Bot — frontend

Interface Next.js para o backend do Agente Bot, com chat em streaming e anexos de imagem via Cloudinary.

## Desenvolvimento

Crie um `.env.local` na raiz do frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Depois execute `npm install` e `npm run dev`.

## Deploy na Vercel

No projeto do **frontend**, configure em Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://seu-backend.vercel.app
```

Marque Production, Preview e Development. A variável é incorporada no build, portanto faça um novo deploy sempre que alterar seu valor.

No projeto do **backend**, configure:

```env
MONGO_URI=...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Adicione também as chaves dos provedores que pretende habilitar:

```env
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
OPENWEATHER_API_KEY=...
```

`OPENWEATHER_API_KEY` é opcional e habilita o recurso de clima. O backend deve aceitar o domínio publicado do frontend na configuração de CORS.
