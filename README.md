# IEOP-PL2-G-2627

Gestão Inteligente de Assistência Técnica e Intervenções: projeto do Grupo G da unidade curricular de Integração da Empresa (2026/2027).

A solução gere os pedidos de assistência técnica, desde a receção até ao pagamento e à entrega do equipamento, integrando a aplicação de processos com o ERP.

## Arquitetura

```
Mendix ──REST/JSON──► Services Layer (n8n) ──GraphQL──► Moloni ON
                              ▲
                              │ REST/JSON
                     Alerta de stock (n8n) ──HTTPS──► Brevo ──► E-mail do gestor
```

| Componente | Função |
| --- | --- |
| Mendix | Aplicação de gestão dos processos de assistência técnica |
| Services Layer | API REST entre os restantes componentes e o ERP, implementada com workflows n8n |
| Alerta de stock | Workflow n8n diário que avisa o gestor das peças abaixo do stock mínimo |
| Moloni ON | ERP: clientes, produtos, stock, faturas e pagamentos |

A Services Layer e o alerta correm na mesma instância n8n. Se esta estiver em baixo, o Mendix perde o acesso ao ERP e o alerta não é enviado.

## Estrutura do repositório

| Caminho | Conteúdo |
| --- | --- |
| `services-layer/` | Workflows, contrato OpenAPI e testes da Services Layer. Ver o [README](services-layer/README.md) |
| `RPA/` | Workflow de alerta de stock e [documentação](RPA/RPA_alerta_stock_n8n.md) |
| `diario_IEOP.md` | Diário de esforço do projeto |
| `Relatorio_Intermedio_IEOP_Grupo_G.pdf` | Relatório intermédio entregue |
| `IPVC-EI-Apresentacao-IEOP-Grupo-G.pptx` | Apresentação da entrega intermédia |

O relatório intermédio, a apresentação e `services-layer/docs/` descrevem a versão anterior da Services Layer, em Node.js e Express, disponível no histórico do repositório.

## Estado atual

- Os cinco endpoints de consulta e o contrato OpenAPI estão migrados para n8n e testados contra um simulador do Moloni ON.
- Falta validar a migração contra o Moloni ON real e publicá-la num alojamento remoto.
- Faltam os endpoints de criação de clientes, faturas, PDF e recibos, bem como a integração com o Mendix.

O planeamento está no [GitHub Project do grupo](https://github.com/users/matiomacedo/projects/2), de acesso restrito à equipa.
