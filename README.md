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

## reCAPTCHA no login e cadastro

Use chaves do **reCAPTCHA v2 com caixa de seleção**, registradas para o domínio deste frontend em https://www.google.com/recaptcha/admin/create.

Configure no frontend:

```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=sua_chave_publica
```

Configure no backend `RECAPTCHA_SECRET_KEY` e `RECAPTCHA_ALLOWED_HOSTNAMES` (hostnames exatos do frontend separados por vírgula, sem https://). Nunca exponha a chave secreta em variável NEXT_PUBLIC_. Configure os dois projetos antes de implantar e faça um novo build do frontend: a chave pública é incorporada no build. Sem configuração, login e cadastro ficam bloqueados; não há bypass silencioso.

O formulário limpa a verificação após cada tentativa e ao alternar entre cadastro e login; trata expiração e erro de rede. O backend verifica cada token com o Google antes de processar credenciais. Nomes iguais no ranking continuam permitidos; o CAPTCHA não remove contas existentes nem torna o nome único.

reCAPTCHA reduz automação, mas não substitui limites de requisições, especialmente nas rotas de chat e upload. A homologação com desafio real depende das chaves e do domínio publicados.
