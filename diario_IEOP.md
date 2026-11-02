
# Diário do Projeto

**UC:** Integração da Empresa · **Projeto final 2026/2027**
**Entrega intermédia:** 3 de novembro (aulas PL) · **Entrega final:** 10 de janeiro

## Como preencher

1. Cada pessoa preenche **apenas a sua coluna**, no fim de cada sessão de trabalho (não no fim da semana, senão esquece-se).
2. Cada linha é **uma tarefa**. Se várias pessoas trabalharam na mesma tarefa, usa-se a mesma linha e cada um regista o seu tempo na sua coluna.
3. O tempo regista-se em **horas** (ex.: `1h30`). Deixar em branco quem não trabalhou nessa tarefa.
4. Descrever a tarefa de forma concreta (ex.: "Exploração da API do Jasmin: autenticação e endpoint de clientes"), e não "trabalho no projeto".
5. Reuniões também contam: registar o tempo na linha "Reunião de equipa" e preencher o registo da reunião à parte.
6. No fim de cada semana, o M confirma que todos preencheram e atualiza a linha de total.

**Exemplo:**

| Tarefa | M | Gonçalo Costa | Gonçalo Rodrigues | Guilherme Barros | Mário Ferreira |
|---|---|---|---|---|---|
| Ex.: análise de ferramenta Bizagi | | | 2h | | |

---

## Semana 1 (12 a 18 de outubro)

| Tarefa | M | Gonçalo Costa | Gonçalo Rodrigues | Guilherme Barros | Mário Ferreira |
|---|---|---|---|---|---|
| Reunião de equipa (escolha do tema) | | | | | |
| Criação da conta de developer do Jasmin e de uma app no Primavera Identity | | 1h | | | |
| Análise da Web API do Jasmin: estrutura dos endpoints, autenticação OAuth2, coleção Postman | | 2h | | | |
| Tentativa de autenticação e de primeiro pedido à API do Jasmin | | 1h | | | |
| | | | | | |
| | | | | | |
| **Total da semana** | | **4h** | | | |

## Semana 2 (19 a 25 de outubro)

| Tarefa | M | Gonçalo Costa | Gonçalo Rodrigues | Guilherme Barros | Mário Ferreira |
|---|---|---|---|---|---|
| Análise da API do Moloni ON (estrutura, autenticação, operações) e escolha das operações para o processo | | 2h | | | |
| Criação da conta Moloni ON e da empresa de teste; ticket ao apoio da Moloni | | 1h | | | |
| Configuração da empresa de teste: chave de API, séries de documentos, armazém, categorias, produtos e cliente | | 1h30 | | | |
| Testes iniciais no Explorer (query me, IDs) e teste de stock com fatura em rascunho | | 1h | | | |
| Redação da secção 3.1 e tabelas de dados ERP para Gonçalo R. e Guilherme | | 1h30 | | | |
| Análise da distribuição de tarefas e da secção 3 (Moloni ON); escolha da tarefa a automatizar (alerta de stock baixo) | | | | | 1h |
| Instalação e exploração do n8n; workflow de teste com dados fictícios (gatilho, Code, If) | | | | | 2h |
| Comparação das ferramentas de automação (n8n, Make, Zapier, UiPath, UI.Vision) e justificação da escolha do n8n | | | | | 0h45 |
| Análise dos requisitos de integração e definição da arquitetura da Services Layer (Node.js, Express e Moloni ON) | | | | 0h45 | |
| Configuração inicial da Services Layer, variáveis de ambiente e autenticação por API Key | | | | 0h45 | |
| Implementação e testes dos endpoints REST de consulta de produtos e clientes | | | | 1h30 | |
| Implementação dos endpoints de stock e integração com as operações GraphQL do Moloni ON | | | | 1h15 | |
| Elaboração e validação da especificação OpenAPI dos serviços REST | | | | 0h45 | |
| Análise do processo de assistência técnica e redação da primeira versão da secção 2.2 (intervenientes, 8 etapas, exceções e mapeamento com os diagramas BPMN e o Moloni ON) | | | 2h30 | | |
| Modelo de domínio no Mendix: entidades (Cliente, Intervencao, CatalogoPeca, PecaUtilizada, Fatura, Recibo), enumerações de estados e associações | | | 2h | | |
| Microflows de teste no Mendix: chamada REST à API do Moloni ON e envio de e-mail por SMTP (Mailtrap) | | | 1h30 | | |
| **Total da semana** | | **7h** | **6h** | **5h** | **3h45** |

## Semana 3 (26 de outubro a 1 de novembro)

| Tarefa | M | Gonçalo Costa | Gonçalo Rodrigues | Guilherme Barros | Mário Ferreira |
|---|---|---|---|---|---|
| Testes da API no Explorer: ativação do módulo, impostos, invoiceUpdate com IVA 23%, PDF | | 1h30 | | | |
| Correção dos impostos (IVA português) e associação aos produtos | | 0h30 | | | |
| Atualização da secção 3.1 (figuras, dificuldades, versão .md) e referências da secção 3 | | 1h | | | |
| Guia de ligação do Mendix ao Moloni ON (apoio a Gonçalo R.) | | 1h | | | |
| Integração do n8n com a camada de serviços (endpoint de stock) e testes com dados reais do Moloni ON | | | | | 1h45 |
| Documentação RPA; envio de e-mail (SMTP) e agendamento diário do workflow n8n: testes e exportação | | | | | 1h15 |
| Diagrama do workflow, revisão da documentação RPA e alinhamento com as secções 2.1, 2.2, 4.1 e 8.1 | | | | | 1h05 |
| Testes de integração com o Moloni ON e prova de conceito de criação e consulta de fatura em rascunho | | | | 1h | |
| Implementação e validação do tratamento de erros GraphQL e HTTP na Services Layer | | | | 1h | |
| Elaboração das secções 2.1, 4.1, 4.2 e 8.1 do relatório intermédio | | | | 2h | |
| Criação do diagrama de arquitetura, organização das capturas de ecrã e publicação da documentação no GitHub | | | | 1h | |
| Atualização do README e da documentação técnica da Services Layer | | | | 0h30 | |
| Preparação do servidor Express e publicação da Services Layer no Render | | | | 1h | |
| Testes dos cinco endpoints REST, autenticação e comunicação com o Moloni ON através do Render | | | | 0h45 | |
| Revisão da secção 2.2 e alinhamento técnico com a equipa: Gestor como sexto interveniente, secção 4 do agente RPA (n8n), Intervencao como o próprio pedido, entidade Tecnico e etapas 6 e 7 com a confirmação de que o stock só baixa com a fatura finalizada | | | 1h30 | | |
| Descrição do componente Mendix para a secção 2.1 e proposta de tratamento de erros da camada de serviços (HTTP de erro com mensagem JSON) | | | 0h45 | | |
| Segurança no Mendix: papéis de módulo e de utilizador (Dispatcher, Tecnico, Gestor), utilizadores de demonstração, acesso às páginas por papel e correção do erro de permissão no menu | | | 1h30 | | |
| Páginas de gestão das entidades (Cliente, Intervencao, CatalogoPeca, Tecnico, Fatura só de leitura), menu de navegação por papel e ícones | | | 1h30 | | |
| Personalização da página de login (TecAssist) e do tema | | | 3h | | |
| Página inicial do Gestor com faturas por pagar e peças com stock baixo | | | 0h45 | | |
| Diagnóstico do envio de e-mail pelo Mailtrap (leitura do log, limite de envios do plano gratuito) | | | 0h30 | | |
| Leitura e teste do guia de ligação do Mendix ao Moloni ON (feito por Gonçalo C.) | | | 0h30 | | |
| Camada de serviços a correr localmente: clone do repositório, ficheiro .env, arranque, teste de /api/health e importação do contrato OpenAPI no Mendix com constantes de URL e API Key | | | 1h30 | | |
| Microflow Atualizar_Catalogo: chamada a /api/produtos/stock, estrutura de resposta, ciclo sobre as peças, criação ou atualização do CatalogoPeca, tratamento de erro e teste com a camada desligada | | | 2h | | |
| Formulário de registo do pedido (Intervencao_NewEdit) com cliente, tipo, descrição e número de processo automático | | | 0h45 | | |
| Página do Técnico e microflows de estado: Iniciar_Diagnostico, Enviar_Orcamento (cálculo do valor e e-mail ao cliente), Aprovar e Recusar | | | 2h30 | | |
| Gestão das peças utilizadas na intervenção: lista, Nova_PecaUtilizada, página da peça e Guardar_PecaUtilizada (validação, stock e preço) | | | 2h | | |
| **Total da semana** | | **4h** | **18h45** | **7h15** | **4h05** |

## Semana 4 (2 a 8 de novembro)

| Tarefa | M | Gonçalo Costa | Gonçalo Rodrigues | Guilherme Barros | Mário Ferreira |
|---|---|---|---|---|---|
| Ensaio da defesa / entrega intermédia (3 nov) | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| **Total da semana** | | | | | |

---

## Modelo para novas semanas

Copiar o bloco abaixo para o fim do ficheiro e alterar o número e as datas.

```markdown
## Semana N (dd a dd de mês)

| Tarefa | M | Gonçalo Costa | Gonçalo Rodrigues | Guilherme Barros | Mário Ferreira |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| **Total da semana** | | | | | |
```

---

## Resumo do esforço acumulado

Atualizado pelo M no fim de cada semana. Será usado no relatório final, que deve incluir a contabilização do esforço despendido.

| Semana | M | Gonçalo Costa | Gonçalo Rodrigues | Guilherme Barros | Mário Ferreira |
|---|---|---|---|---|---|
| 1 | | 4h | | | |
| 2 | | 7h | 6h | 5h | 3h45 |
| 3 | | 4h | 18h45 | 7h15 | 4h05 |
| 4 | | | | | |
| **Total acumulado** | | **15h** | **24h45** | **12h15** | **7h50** |
