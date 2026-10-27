# Services Layer — Gestão Inteligente de Assistência Técnica e Intervenções

Camada de integração desenvolvida no âmbito do projeto académico da unidade curricular de Integração da Empresa.

## 1. Objetivo

A Services Layer disponibiliza uma API REST que permite à aplicação Mendix e ao workflow n8n comunicar com o ERP Moloni ON, sem necessidade de utilizarem diretamente a sua API GraphQL.

A solução centraliza a autenticação, a execução das operações GraphQL, a validação das respostas e o tratamento de erros.

## 2. Tecnologias

- Node.js 22
- JavaScript
- Express 5
- API REST e JSON
- GraphQL
- OpenAPI 3.0.3
- Autenticação por API Key

## 3. Arquitetura

A integração segue o seguinte fluxo:

- Mendix → Services Layer (REST/JSON) → Moloni ON (GraphQL/JSON)
- n8n → Services Layer (REST/JSON) → Moloni ON (GraphQL/JSON)

O Mendix é responsável pela gestão dos processos de assistência técnica, enquanto o Moloni ON centraliza os dados comerciais e administrativos.

O n8n utiliza a Services Layer para consultar o stock e executar o workflow automatizado de alerta de existências abaixo do mínimo.

## 4. Instalação e configuração

### Requisitos

- Node.js 22 ou versão compatível
- npm
- Acesso à API do Moloni ON
- Credenciais de autenticação da Services Layer

### Instalação

Na pasta `services-layer`, executar:

```bash
npm install
```

Criar o ficheiro `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Configurar as variáveis de ambiente necessárias:

| Variável            | Descrição                                           |
| ------------------- | --------------------------------------------------- |
| `PORT`              | Porta HTTP utilizada pela Services Layer            |
| `INTERNAL_API_KEY`  | Chave de autenticação interna dos consumidores REST |
| `MOLONI_API_URL`    | Endereço da API GraphQL do Moloni ON                |
| `MOLONI_API_KEY`    | Chave de autenticação da API Moloni ON              |
| `MOLONI_COMPANY_ID` | Identificador da empresa no Moloni ON               |

O ficheiro `.env` contém informação sensível e não deve ser publicado no GitHub.

### Iniciar o servidor

```bash
npm start
```

Por defeito, a Services Layer é utilizada localmente através de:

`http://localhost:3000`

## 5. Endpoints REST implementados

| Método | Endpoint                   | Descrição                                | Autenticação |
| ------ | -------------------------- | ---------------------------------------- | ------------ |
| GET    | `/api/health`              | Verificar o estado da aplicação          | Não          |
| GET    | `/api/produtos`            | Consultar produtos do Moloni ON          | Sim          |
| GET    | `/api/clientes?nif=...`    | Pesquisar clientes por NIF               | Sim          |
| GET    | `/api/produtos/stock`      | Consultar produtos com controlo de stock | Sim          |
| GET    | `/api/produtos/{id}/stock` | Consultar stock de um produto            | Sim          |

O contrato completo da API está documentado no ficheiro `openapi.yaml`.

## 6. Autenticação

Os endpoints protegidos exigem uma chave interna enviada através do cabeçalho HTTP:

`X-API-Key`

A chave fornecida é comparada de forma segura com a configurada na variável `INTERNAL_API_KEY`.

O middleware devolve:

| HTTP | Situação                             |
| ---- | ------------------------------------ |
| 401  | Chave interna não fornecida          |
| 403  | Chave interna inválida               |
| 503  | Autenticação interna não configurada |

A chave do Moloni ON é utilizada exclusivamente pela Services Layer e não deve ser transmitida aos consumidores REST.

## 7. Exemplos de utilização

Os exemplos seguintes assumem que o servidor está a funcionar em `localhost:3000` e que a variável `INTERNAL_API_KEY` está definida no terminal.

### Verificar o estado

```bash
curl http://localhost:3000/api/health
```

### Consultar produtos

```bash
curl \
  -H "X-API-Key: $INTERNAL_API_KEY" \
  http://localhost:3000/api/produtos
```

### Pesquisar clientes

```bash
curl \
  -H "X-API-Key: $INTERNAL_API_KEY" \
  "http://localhost:3000/api/clientes?nif=000000000"
```

### Consultar stock

```bash
curl \
  -H "X-API-Key: $INTERNAL_API_KEY" \
  http://localhost:3000/api/produtos/stock
```

### Consultar stock individual

```bash
curl \
  -H "X-API-Key: $INTERNAL_API_KEY" \
  http://localhost:3000/api/produtos/363517/stock
```

Os identificadores apresentados são exemplos da empresa de teste e podem ser diferentes noutros ambientes.

## 8. Tratamento de erros

A Services Layer distingue falhas de autenticação, validação, comunicação e operação provenientes do Moloni ON.

Os erros GraphQL podem surgir mesmo quando o ERP devolve uma resposta HTTP 200. Por este motivo, a Services Layer verifica os erros presentes no corpo da resposta e converte-os em erros REST.

As falhas identificadas através do módulo de tratamento de erros são devolvidas em JSON, com uma mensagem e um código.

Exemplo:

```json
{
  "erro": "Não foi possível consultar os produtos.",
  "codigo": "MOLONI_AUTENTICACAO"
}
```

Principais códigos utilizados:

| Código                     | Significado                        |
| -------------------------- | ---------------------------------- |
| `MOLONI_AUTENTICACAO`      | Falha de autenticação no Moloni ON |
| `MOLONI_VALIDACAO`         | Dados rejeitados pelo ERP          |
| `MOLONI_OPERACAO`          | Erro de operação GraphQL           |
| `MOLONI_COMUNICACAO`       | Falha de comunicação com o ERP     |
| `MOLONI_HTTP`              | Erro HTTP do ERP                   |
| `MOLONI_RESPOSTA_INVALIDA` | Resposta inválida ou inesperada    |
| `ERRO_INTERNO`             | Erro inesperado na Services Layer  |

Os erros classificados provenientes do Moloni ON são atualmente devolvidos com HTTP 502. Alguns erros de validação de parâmetros e respostas inesperadas são tratados diretamente pelas rotas, pelo que podem apresentar outro formato JSON.

## 9. Testes realizados

Foram validados:

- Arranque do servidor Express.
- Proteção dos endpoints por `X-API-Key`.
- Consulta real de produtos e clientes.
- Consulta geral e individual do stock.
- Classificação de erros GraphQL de autenticação e validação através de simulações.
- Formatação das respostas JSON de erro.
- Prova de conceito de criação e consulta de fatura em rascunho através de scripts GraphQL.

O endpoint `/api/produtos/stock` foi também utilizado e testado pelo workflow n8n de alerta de stock baixo.

## 10. Estado de desenvolvimento

### Implementado

- Estrutura Node.js e Express.
- Integração com a API GraphQL do Moloni ON.
- Cinco endpoints REST.
- Middleware de autenticação interna.
- Tratamento e classificação de erros.
- Contrato OpenAPI.
- Integração de consulta de stock com o workflow n8n.

### Em desenvolvimento ou previsto

- Criação de clientes através da API REST.
- Criação e consulta de faturas através de endpoints REST.
- Recuperação de documentos PDF.
- Criação de recibos.
- Integração completa com os microflows do Mendix.
- Disponibilização da Services Layer num endereço acessível aos restantes componentes em ambiente remoto.

As operações de faturação encontram-se parcialmente exploradas através de scripts de teste, mas ainda não estão disponíveis como endpoints REST.

## 11. Segurança

As credenciais são configuradas através de variáveis de ambiente.

O ficheiro `.env` não deve ser incluído no controlo de versões.

As mensagens devolvidas pelos endpoints não expõem as credenciais utilizadas na comunicação com o ERP.

Para utilização fora do ambiente local, deverá ser configurado um serviço acessível através de HTTPS, com mecanismos adequados de proteção e gestão de credenciais.
