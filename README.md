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

1. `isLocal` (portas 900x): usado quando MFEs estao rodando com `npm start`
2. `isContainerLocal` (portas 808x): usado quando MFEs estao rodando via Docker

## Executando em desenvolvimento (npm local 900x)

1. Suba os MFEs no modo npm (`npm start`) nas portas 900x.
2. Em outra aba/terminal, inicie o orchestrator:

```bash
npm start
```

3. Acesse `http://localhost:9000`.

## Executando em desenvolvimento (container-local 808x)

1. Suba os MFEs via Docker (`docker compose up --build`) nas portas 808x.
2. Inicie o orchestrator no perfil container-local:

```bash
npm run start:container
```

3. Acesse `http://localhost:8080`.

## Executando o orchestrator via Docker

Este `docker-compose.yml` ja builda o shell com `BUILD_PROFILE=container-local`.

```bash
docker compose up --build
```

A aplicacao ficara disponivel em `http://localhost:8080`.

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

## Scripts uteis

- `npm start`: orchestrator em `isLocal` (porta 9000)
- `npm run start:container`: orchestrator em `isContainerLocal` (porta 8080)
- `npm run build`: build de producao
- `npm run build:container`: build de producao para perfil container-local
- `npm test`: executa testes
- `npm run lint`: lint
- `npm run typecheck`: verificacao de tipos
- `npm run format`: formatacao com Prettier

## Troubleshooting

1. Se o navegador abrir o shell, mas sem MFEs, confirme se as URLs do import map estao ativas e no mesmo perfil de portas.
2. Se um MFE especifico falhar no carregamento, acesse diretamente o arquivo `bytebank-*.js` no host/porta esperado.
3. Se houver CORS ou erro de rede, verifique se todos os servicos estao rodando em localhost e sem conflito de portas.
