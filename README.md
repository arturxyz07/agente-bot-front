# Agente Bot — frontend

## Sala Pública em tempo real

Acesse **`/sala`** ou o link **Sala Pública ao vivo** no menu. A página conecta ao backend via Socket.io enviando o JWT do login. Mensagens aparecem em todas as abas abertas sem recarregar, com o nome do autor. Chame a IA com `@gemini` ou `@bot`; a resposta aparece para todos como **🤖 Moderador Gemini**. O topo mostra os usuários online e o rodapé indica quem está digitando.

A URL do WebSocket é `NEXT_PUBLIC_SOCKET_URL` ou, se vazia, `NEXT_PUBLIC_API_URL`. O backend precisa rodar em um serviço com conexões persistentes (ex.: Render).

## Painel admin e documentos (RAG)

Acesse **`/admin`** ou o link **Painel admin · Documentos** no menu após entrar como administrador.

**Administrador padrão de desenvolvimento:** email `admin@agente-bot.local`, senha `Admin@123456`. Antes do primeiro login, execute **`npm run seed:admin` no backend**, com o MongoDB configurado. O login exige o reCAPTCHA já utilizado pelo projeto. O cadastro público cria apenas usuários comuns.

No backend, `ADMIN_EMAIL` e `ADMIN_PASSWORD` permitem definir outras credenciais. Em produção, defina `NODE_ENV=production` e uma senha própria de pelo menos 12 caracteres; o seed rejeita a senha padrão. Reexecutar o seed não altera senhas existentes.

No painel:

1. Envie um PDF com texto selecionável ou TXT em UTF-8 (até 4 MiB e 200.000 caracteres).
2. Selecione o documento e faça uma pergunta de até 4.000 caracteres.
3. Consulte a resposta e os trechos citados pelo Gemini. Quando a informação não estiver no documento, o modelo é instruído a informar isso.
4. Exclua documentos pelo ícone de lixeira e confirme a exclusão.

O backend recupera e envia o texto integral ao Gemini internamente a cada consulta. A interface recebe metadados e respostas; o texto completo não entra no histórico do chat. Não há embeddings ou busca vetorial nesta versão. PDFs digitalizados precisam de OCR externo antes do envio. As respostas são geradas por IA e devem ser verificadas contra a fonte.

Configure `GOOGLE_GENERATIVE_AI_API_KEY`, `MONGO_URI` e `JWT_SECRET` no backend. Opcionalmente, defina `RAG_GEMINI_MODEL`. Copie `.env.example` para `.env.local` no frontend e configure a URL da API e a chave pública reCAPTCHA. As permissões são verificadas no backend em todas as rotas `/api/admin/*`; esconder o painel no frontend não é a barreira de segurança.

Validação local: `npm run lint` e `npm run build`. O backend possui testes automatizados em `npm test`.

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
