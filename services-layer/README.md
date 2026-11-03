# Services Layer — Gestão Inteligente de Assistência Técnica e Intervenções

Camada de integração desenvolvida no âmbito do projeto académico da unidade curricular de Integração da Empresa.

## 1. Objetivo

A Services Layer disponibiliza uma API REST que permite à aplicação Mendix e ao workflow n8n comunicar com o ERP Moloni ON, sem necessidade de utilizarem diretamente a sua API GraphQL.

A solução centraliza a autenticação, a execução das operações GraphQL, a validação das respostas e o tratamento de erros.

## 2. Tecnologias

- n8n 2.46.4 (workflows com nós Webhook, HTTP Request e Code)
- JavaScript (apenas nos nós Code e nos scripts de teste)
- API REST e JSON
- GraphQL
- OpenAPI 3.0.3
- Autenticação por API Key

## 3. Arquitetura

Cada endpoint é um workflow em `workflows/`. Todos chamam o sub-workflow `Moloni GraphQL`, que concentra o pedido ao ERP e a classificação de erros.

A integração segue o seguinte fluxo:

- Mendix → Services Layer (REST/JSON) → Moloni ON (GraphQL/JSON)
- n8n → Services Layer (REST/JSON) → Moloni ON (GraphQL/JSON)

O Mendix é responsável pela gestão dos processos de assistência técnica, enquanto o Moloni ON centraliza os dados comerciais e administrativos.

O workflow de alerta de stock corre na mesma instância n8n e consome a Services Layer através da API REST. Esta instância é, por isso, um ponto único de falha para a API e para o alerta.

## 4. Instalação e configuração

### Requisitos

- Docker
- Acesso à API do Moloni ON

A versão testada é a `docker.n8n.io/n8nio/n8n:2.46.4`.

### Configuração

Na pasta `services-layer`, criar os ficheiros locais e preencher os respetivos valores:

```bash
cp .env.example .env
cp credenciais.exemplo.json credenciais.json
```

| Variável               | Descrição                                               |
| ---------------------- | ------------------------------------------------------- |
| `N8N_ENCRYPTION_KEY`   | Chave que encripta as credenciais guardadas no n8n      |
| `N8N_ENDPOINT_WEBHOOK` | Prefixo dos endpoints; `api` mantém os caminhos `/api/` |
| `MOLONI_API_URL`       | Endereço da API GraphQL do Moloni ON                    |
| `MOLONI_COMPANY_ID`    | Identificador da empresa no Moloni ON                   |

As chaves internas e do Moloni ON ficam em `credenciais.json`. Os ficheiros `.env` e `credenciais.json` contêm informação sensível e não devem ser publicados no GitHub.

### Importar e arrancar

```bash
IMAGEM=docker.n8n.io/n8nio/n8n:2.46.4
n8n_cli() {
  docker run --rm --env-file .env -v n8n_dados:/home/node/.n8n \
    -v "$PWD/credenciais.json:/tmp/credenciais.json:ro" \
    -v "$PWD/workflows:/tmp/workflows:ro" "$IMAGEM" "$@"
}

n8n_cli import:credentials --input=/tmp/credenciais.json
n8n_cli import:workflow --separate --input=/tmp/workflows
for id in SLmoloniGraphql1 SLapiHealth00001 SLapiProdutos001 SLapiStockTodos1 SLapiStockUm0001 SLapiClientes001; do
  n8n_cli publish:workflow --id="$id"
done

docker run -d --name services-layer --env-file .env -p 5678:5678 \
  -v n8n_dados:/home/node/.n8n "$IMAGEM"
```

A Services Layer fica disponível em `http://localhost:5678`. O workflow de alerta de stock é importado à parte, a partir de `../RPA/workflow-alerta-stock-baixo.json`, e a respetiva credencial SMTP é criada no editor do n8n.

## 5. Endpoints REST implementados

| Método | Endpoint                   | Descrição                                | Autenticação |
| ------ | -------------------------- | ---------------------------------------- | ------------ |
| GET    | `/api/health`              | Verificar o estado da aplicação          | Não          |
| GET    | `/api/produtos`            | Consultar produtos do Moloni ON          | Sim          |
| GET    | `/api/clientes?nif=...`    | Pesquisar clientes por NIF               | Sim          |
| GET    | `/api/produtos/stock`      | Consultar produtos com controlo de stock | Sim          |
| GET    | `/api/produtos/stock-detalhe?id=...` | Consultar stock de um produto  | Sim          |

O contrato completo da API está documentado no ficheiro `openapi.yaml`.

O stock individual usa um parâmetro de consulta porque o n8n acrescenta o identificador do webhook aos caminhos com parâmetros (`/api/<webhookId>/produtos/:id/stock`).

## 6. Autenticação

Os endpoints protegidos exigem uma chave interna enviada através do cabeçalho HTTP:

`X-API-Key`

A verificação é feita pelo Header Auth nativo do nó Webhook. Uma chave em falta ou inválida devolve HTTP 403 com o texto simples `Authorization data is wrong!`, e não um corpo JSON.

A chave do Moloni ON é utilizada exclusivamente pelo workflow `Moloni GraphQL` e não deve ser transmitida aos consumidores REST.

## 7. Exemplos de utilização

Os exemplos seguintes assumem que o n8n está a funcionar em `localhost:5678` e que a variável `INTERNAL_API_KEY` está definida no terminal.

### Verificar o estado

```bash
curl http://localhost:5678/api/health
```

### Consultar produtos

```bash
curl \
  -H "X-API-Key: $INTERNAL_API_KEY" \
  http://localhost:5678/api/produtos
```

### Pesquisar clientes

```bash
curl \
  -H "X-API-Key: $INTERNAL_API_KEY" \
  "http://localhost:5678/api/clientes?nif=000000000"
```

### Consultar stock

```bash
curl \
  -H "X-API-Key: $INTERNAL_API_KEY" \
  http://localhost:5678/api/produtos/stock
```

### Consultar stock individual

```bash
curl \
  -H "X-API-Key: $INTERNAL_API_KEY" \
  "http://localhost:5678/api/produtos/stock-detalhe?id=363517"
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
| 
Os erros classificados provenientes do Moloni ON são atualmente devolvidos com HTTP 502. Alguns erros de validação de parâmetros e respostas inesperadas são tratados diretamente pelas rotas, pelo que podem apresentar outro formato JSON.

## 9. Testes realizados

O contrato é verificado com `scripts/testarContrato.js`, contra o simulador `scripts/moloniSimulado.js`, cobrindo respostas de sucesso, validação, autenticação e falhas do Moloni ON:

```bash
node scripts/moloniSimulado.js 4010
node scripts/testarContrato.js http://localhost:5678 "$INTERNAL_API_KEY"
```

Para estes testes, `MOLONI_API_URL` deve apontar para o simulador (`http://host.docker.internal:4010/` em Docker) e a credencial do Moloni deve ter o valor `Bearer chave-moloni-simulada`.

A migração para n8n ainda não foi validada contra o Moloni ON real nem num alojamento remoto. As consultas reais e a prova de conceito de fatura foram realizadas na versão anterior em Express, disponível no histórico do repositório.

## 10. Estado de desenvolvimento

### Implementado

- Workflows n8n para os cinco endpoints REST.
- Integração com a API GraphQL do Moloni ON.
- Autenticação interna por Header Auth.
- Tratamento e classificação de erros.
- Contrato OpenAPI.
- Integração de consulta de stock com o workflow de alerta.

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
