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

- Docker (versão testada: `docker.n8n.io/n8nio/n8n:2.46.4`)
- Node.js 22 ou versão compatível, para preparar os workflows e executar os testes
- Acesso à API do Moloni ON
- Conta Brevo com o remetente verificado, para o e-mail do alerta

### Configuração

Na pasta `services-layer`, criar os ficheiros locais e preencher os respetivos valores:

```bash
cp .env.example .env
cp credenciais.exemplo.json credenciais.json
node --env-file=.env scripts/prepararImportacao.js
```

| Variável               | Descrição                                                    |
| ---------------------- | ------------------------------------------------------------ |
| `N8N_ENCRYPTION_KEY`   | Chave que encripta as credenciais guardadas no n8n           |
| `N8N_ENDPOINT_WEBHOOK` | Prefixo dos endpoints; `api` mantém os caminhos `/api/`      |
| `MOLONI_API_URL`       | Endereço da API GraphQL do Moloni ON                         |
| `MOLONI_COMPANY_ID`    | Identificador da empresa no Moloni ON, aplicado aos workflows |

O script grava os workflows prontos a importar em `.importacao/`.

Em `credenciais.json`, as duas credenciais com o cabeçalho `X-API-Key` têm de ter o mesmo valor. A chave do Brevo fica na credencial `Brevo API Key`. Um valor por preencher em `X-API-Key` faz a API falhar com HTTP 500, sem aceitar pedidos.

Os ficheiros `.env` e `credenciais.json` contêm informação sensível e não devem ser publicados no GitHub. Depois de importar, apagar `credenciais.json`.

### Importar e arrancar localmente

```bash
IMAGEM=docker.n8n.io/n8nio/n8n:2.46.4
n8n_cli() {
  docker run --rm --env-file .env -v n8n_dados:/home/node/.n8n \
    -v "$PWD/credenciais.json:/tmp/credenciais.json:ro" \
    -v "$PWD/.importacao:/tmp/workflows:ro" "$IMAGEM" "$@"
}

n8n_cli import:credentials --input=/tmp/credenciais.json
n8n_cli import:workflow --separate --input=/tmp/workflows
for id in SLmoloniGraphql1 SLapiHealth00001 SLapiProdutos001 SLapiStockTodos1 SLapiStockUm0001 SLapiClientes001 siq7TIRggv38M2An; do
  n8n_cli publish:workflow --id="$id"
done

docker run -d --name services-layer --env-file .env -p 5678:5678 \
  -v n8n_dados:/home/node/.n8n "$IMAGEM"
```

A Services Layer fica disponível em `http://localhost:5678`. A importação inclui o workflow de alerta de stock, publicado para executar às 9h.

### Alojamento em Render free e Supabase

O plano gratuito do Render não tem acesso por shell nem tarefas pontuais, pelo que a importação é feita a partir de um computador, ligado à mesma base de dados. A ordem é importante: uma instância nova aceita a criação do proprietário sem autenticação, e quem a fizer primeiro fica com o controlo do n8n.

1. Criar o projeto no Supabase e retirar os comentários das variáveis `DB_*` em `.env`. Se a ligação direta falhar por exigir IPv6, usar os dados do *session pooler*.
2. Arrancar o n8n localmente com esse `.env` (sem o volume `n8n_dados`) e criar o proprietário em `http://localhost:5678`, **antes** de criar o serviço no Render.
3. Importar e publicar com os comandos da secção anterior, sem o volume `n8n_dados`, e parar o n8n local.
4. Criar o *web service* no Render a partir da imagem, com as mesmas variáveis de `.env` (incluindo `N8N_ENCRYPTION_KEY`) e as variáveis marcadas «Apenas no Render».
5. Configurar um serviço externo (por exemplo, cron-job.org) para chamar `GET /healthz` a cada 10 minutos. O Render adormece o serviço ao fim de 15 minutos sem tráfego, o que pararia o agendamento das 9h.

Depois de importar ou publicar novamente, reiniciar o serviço no Render. Após um arranque, `/healthz` pode responder antes de os endpoints `/api/` ficarem registados, pelo que os consumidores devem tolerar um 404 temporário.

Limitações do plano gratuito: as 750 horas mensais do Render cobrem apenas um serviço ligado todo o mês, os portos 25, 465 e 587 estão bloqueados (por isso o alerta usa a API HTTP do Brevo) e os projetos gratuitos do Supabase podem ser pausados por pouca atividade.

Este percurso foi testado localmente com Docker e PostgreSQL, mas não no Render nem no Supabase. Falta confirmar os limites de memória e as regras do Render sobre chamadas periódicas.

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

A verificação é feita pelo Header Auth nativo do nó Webhook. Uma chave em falta ou inválida devolve HTTP 403 com o texto simples `Authorization data is wrong!`, sem `Content-Type` e com o cabeçalho `WWW-Authenticate: Basic`. Se a chave interna não estiver configurada, a API devolve HTTP 500 com o texto simples `No authentication data defined on node!`.

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

As falhas identificadas pelo workflow `Moloni GraphQL` são devolvidas em JSON, com uma mensagem e um código.

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
| `ERRO_INTERNO`             | Erro inesperado, com HTTP 500      |

Os erros classificados provenientes do Moloni ON são atualmente devolvidos com HTTP 502. Alguns erros de validação de parâmetros e respostas inesperadas são tratados diretamente nos workflows dos endpoints, pelo que podem apresentar outro formato JSON.

Diferenças face à versão Express, para além das indicadas nas secções 5 e 6:

- `HEAD /api/health` devolve 404; para monitorização, usar `GET /healthz`.
- Os caminhos distinguem maiúsculas de minúsculas.
- Um caminho inexistente devolve um JSON do próprio n8n.

## 9. Testes realizados

O contrato é verificado com `scripts/testarContrato.js`, contra o simulador `scripts/moloniSimulado.js`, cobrindo respostas de sucesso, validação, autenticação e falhas do Moloni ON:

```bash
node scripts/moloniSimulado.js 4010
node scripts/testarContrato.js http://localhost:5678 "$INTERNAL_API_KEY"
```

Para estes testes, antes de preparar os workflows, `MOLONI_API_URL` deve apontar para o simulador (`http://host.docker.internal:4010/` em Docker) e `MOLONI_COMPANY_ID` deve ser `1`. A credencial do Moloni deve ter o valor `Bearer chave-moloni-simulada`.

Os scripts `testarMoloni.js` e `testarProdutos.js` consultam diretamente o Moloni ON (`node --env-file=.env.moloni scripts/testarMoloni.js`, com `MOLONI_API_URL`, `MOLONI_API_KEY` e `MOLONI_COMPANY_ID` definidos nesse ficheiro local).

A migração para n8n ainda não foi validada contra o Moloni ON real nem num alojamento remoto. As consultas reais e a prova de conceito de fatura foram realizadas na versão anterior em Express.

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

As chaves ficam encriptadas em credenciais do n8n e a chave de encriptação em variável de ambiente, fora do controlo de versões. `N8N_BLOCK_ENV_ACCESS_IN_NODE=true` impede os workflows de lerem as variáveis de ambiente.

As mensagens devolvidas pelos endpoints não expõem as credenciais utilizadas na comunicação com o ERP.

Os workflows da API não guardam dados de execução, porque estes incluiriam os cabeçalhos do pedido (com a chave interna) e os NIF pesquisados.

Durante cerca de um minuto, esses dados permanecem na base de dados até serem removidos pelas variáveis `EXECUTIONS_DATA_HARD_DELETE_BUFFER` e `EXECUTIONS_DATA_PRUNE_HARD_DELETE_INTERVAL`, pelo que o acesso à base de dados deve ser protegido.

Quem tiver acesso ao editor do n8n controla os workflows e as credenciais. A conta de proprietário deve ser criada antes de expor a instância (secção 4) e usar uma palavra-passe forte.
