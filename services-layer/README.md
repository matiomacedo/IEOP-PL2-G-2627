# Services Layer — Gestão de Assistência Técnica

Camada de integração do projeto académico desenvolvido na unidade curricular de Integração da Empresa.

## Objetivo

Disponibilizar uma API REST que permita à aplicação Mendix comunicar com o Moloni ON através da sua API GraphQL.

## Tecnologias

- Node.js 22
- JavaScript
- Express 5
- REST e JSON
- GraphQL
- API Keys

## Arquitetura

Mendix → Services Layer (REST/JSON) → Moloni ON (GraphQL/JSON)

## Responsabilidades

- Disponibilizar endpoints REST para o Mendix.
- Transformar pedidos REST em operações GraphQL.
- Autenticar os pedidos enviados ao Moloni ON.
- Validar dados e tratar erros.
- Devolver respostas JSON simplificadas.

## Configuração

1. Executar `npm install`.
2. Copiar `.env.example` para `.env`.
3. Configurar as variáveis de ambiente no `.env`.
4. Iniciar o servidor (comando a definir).

## Estado

Estrutura inicial preparada. Endpoints REST ainda não implementados.
