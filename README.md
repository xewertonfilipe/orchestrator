# Bytebank Orchestrator (Root Config)

Aplicacao shell do ecossistema Bytebank, responsavel por registrar, carregar e compor os microfrontends com single-spa.

## Visao geral

- Package: `@bytebank/root-config`
- Porta local (webpack / import map local): `9000`
- Porta container-local (webpack / import map container): `8080`
- Entrypoint principal: `@bytebank/root-config`

## Pre-requisitos

1. Node.js 18+
2. npm 9+
3. Docker Desktop (opcional, para execucao via container-local)

## Instalacao

```bash
npm install
```

## Perfis de execucao em desenvolvimento

O orchestrator possui dois perfis para montar o import map:

1. `isLocal` (portas 9000): usado quando MFEs estao rodando com `npm start`

## Executando em desenvolvimento (npm local 9000)

1. Suba os MFEs no modo npm (`npm start`) nas portas 9000.
2. Em outra aba/terminal, inicie o orchestrator:

```bash
npm start
```

3. Acesse `http://localhost:9000`.

## Executando em desenvolvimento (container-local 8080)

Use o compose unificado na raiz `frontend` para subir shell + MFEs em um comando.

```bash
cd ..
docker compose up --build
```

Acesse `http://localhost:8080`.

Para parar:

```bash
docker compose down
```

## Executando o orchestrator via Docker

Este `docker-compose.yml` builda o shell com `BUILD_PROFILE=container-local`.

```bash
npm run start:docker
```

A aplicacao ficara disponivel em `http://localhost:8080`.

Para parar os containers:

```bash
npm run stop:docker
```

## Matriz de portas dos MFEs

| MFE            | Import name                | Local (npm) | Container (docker) |
| -------------- | -------------------------- | ----------- | ------------------ |
| Orchestrator   | `@bytebank/root-config`    | 9000        | 8080               |
| Navbar         | `@bytebank/navbar`         | 9001        | 8081               |
| Menu           | `@bytebank/menu`           | 9003        | 8082               |
| Account        | `@bytebank/account`        | 9004        | 8083               |
| Statement      | `@bytebank/statement`      | 9005        | 8084               |
| Transaction    | `@bytebank/transaction`    | 9006        | 8085               |
| Authentication | `@bytebank/authentication` | 9007        | 8087               |

## Ordem recomendada para subir ambiente completo

1. Suba primeiro os MFEs consumidos pelo shell (navbar, menu, account, transaction, statement, authentication).
2. Em seguida, suba o orchestrator no mesmo perfil (local 900x ou container-local 808x).
3. Acesse o shell e valide:
4. Rota default: tela de autenticacao
5. Rota `/home`: layout com navbar, menu, account, transaction e statement

## Responsividade

- O layout da rota `/home` usa grid-layout para composicao dos MFEs.
- Em telas maiores, o grid principal segue o padrao: `menu` a esquerda, `account + transaction` no centro e `statement` a direita.
- Em telas menores, o grid muda para coluna unica nesta ordem: `menu`, `account + transaction`, `statement`.
- A rota default com `@bytebank/authentication` permanece inalterada.

## Scripts uteis

- `npm start`: orchestrator local porta 9000
- `npm run start:docker`: sobe orchestrator via Docker Compose com build
- `npm run stop:docker`: derruba containers do Docker Compose
- `npm run build`: build de producao
- `npm test`: executa testes
- `npm run lint`: lint
- `npm run typecheck`: verificacao de tipos
- `npm run format`: formatacao com Prettier
