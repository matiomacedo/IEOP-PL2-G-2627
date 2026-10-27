# RPA — Automatização do alerta de stock baixo

**Autor:** Mario Ferreira (N.º 31434) — Analista RPA
**Projeto:** Gestão Inteligente de Assistência Técnica e Intervenções
**Ferramenta:** n8n (self-hosted) + Camada de Serviços REST + Moloni ON
**Versão:** 27 de outubro de 2026

> **Nota para o Mátio (apagar antes de integrar no template).** Texto para a parte de RPA, com as etapas numeradas como na secção 2.2 do Gonçalo R. As figuras estão em `RPA/prints/` no repositório. O ponto 6 tem o texto para o ponto 4 da secção 2.2 e a descrição do componente para o diagrama da secção 2.1.

---

## 1. Tarefa automatizada

Das três opções propostas na distribuição de tarefas (acompanhamento de pagamentos, envio de faturas em PDF por e-mail e alerta de stock baixo), foi escolhido o **alerta de stock baixo de peças**.

Um workflow executado automaticamente uma vez por dia consulta o stock atual e o stock mínimo de cada peça no Moloni ON. As peças abaixo do mínimo são reunidas num único alerta, enviado por e-mail ao gestor, que pode assim encomendar ao fornecedor antes de o stock esgotar.

**Enquadramento no processo.** A automatização liga-se à **Etapa 5** (execução da intervenção e consulta de stock) e ao percurso de exceção **«Encomendar ao Fornecedor → Aguardar encomenda»** descrito na secção 2.2. Esse percurso ocorre quando o técnico precisa de uma peça que não existe em armazém, o que atrasa a reparação ou a montagem. O alerta antecipa a encomenda e reduz o número de vezes em que o processo segue esse percurso.

**Porque não as outras opções.**
- *Acompanhamento de pagamentos:* à data da análise, ainda não estava confirmado como saber pela API do Moloni ON se uma fatura está paga (a aplicação mostra a percentagem paga, mas o campo equivalente na API está por confirmar).
- *Envio da fatura em PDF por e-mail:* esta função já está atribuída à aplicação Mendix, através do módulo Email Connector (Etapa 7), pelo que haveria sobreposição.

## 2. Porque vale a pena automatizar

No processo atual (AS-IS), o controlo de stock depende de alguém se lembrar de verificar as quantidades. Na prática, a falta de uma peça só é descoberta quando o técnico precisa dela, o que obriga a encomendar ao fornecedor com a intervenção já em curso e atrasa a entrega ao cliente.

A automatização traz:
- **Prevenção em vez de reação:** a encomenda é feita antes de a peça faltar, não durante a intervenção.
- **Zero trabalho manual:** a verificação corre sozinha todos os dias, sem ninguém abrir o Moloni ON.
- **Um único aviso consolidado:** o gestor recebe um e-mail com a lista de todas as peças em falta, e não um e-mail por peça. Se nenhuma peça estiver abaixo do mínimo, não é enviado nenhum e-mail.
- **Sem impacto no ERP:** o workflow apenas lê dados. Não emite documentos (não consome o limite de 50 documentos por mês do plano) nem altera o stock.

## 3. Escolha da ferramenta

A lista do professor inclui duas famílias de ferramentas:
- **RPA pela interface gráfica** (UiPath, UI.Vision): robôs de software que imitam um utilizador, abrindo aplicações, clicando em botões e lendo valores do ecrã. Justificam-se quando o sistema não disponibiliza API.
- **Automatização de workflows por API** (n8n, Make, Zapier): ligam sistemas diretamente através das respetivas APIs.

| Critério | n8n | Make | Zapier | UiPath | UI.Vision |
|---|---|---|---|---|---|
| Tipo | Workflows por API | Workflows por API | Workflows por API | RPA (interface) | RPA (browser) |
| Onde corre | Local (self-hosted) ou cloud | Apenas cloud | Apenas cloud | Local (Windows) | Extensão do browser |
| Custo para este caso | Gratuito em self-hosted | Plano gratuito com limites | Plano gratuito com limites | Edição Community gratuita | Gratuito |
| Adequado quando há API | Sim | Sim | Sim | Pouco indicado | Pouco indicado |

**Foi escolhido o n8n**, pelas seguintes razões:
1. **O Moloni ON tem API.** Uma automatização pela interface (UiPath, UI.Vision) seria mais lenta e mais frágil, porque deixa de funcionar quando o aspeto da aplicação muda. A integração por API é a solução tecnicamente mais adequada.
2. **Corre localmente, sem limites de execuções.** O n8n pode ser instalado no próprio computador ou num servidor (self-hosted), gratuitamente. O Make e o Zapier funcionam apenas na cloud e os planos gratuitos limitam o número de execuções e funcionalidades, o que é um problema para uma tarefa diária.
3. **Liga-se a qualquer API.** Nenhuma das ferramentas tem integração pronta para o Moloni ON. O n8n disponibiliza nós genéricos (HTTP Request e GraphQL) para chamar diretamente qualquer serviço REST ou GraphQL.
4. **Cobre o caso sem programação.** Agendamento (Schedule Trigger), condições (If), transformação de dados (Split Out) e envio de e-mail (Send Email) são nós prontos. Foi usado código apenas num nó, para formatar o texto do alerta.
5. **Os dados ficam do nosso lado.** Ao correr localmente, as credenciais e os dados de stock não passam por um serviço de terceiros.

**Licença.** O n8n é distribuído sob um modelo *fair-code* (Sustainable Use License): o código é público e pode ser usado e alojado gratuitamente para fins próprios, mas não é *open source* no sentido estrito da definição.

## 4. Descrição do workflow

Fluxo do workflow «Alerta de stock baixo»:

```
Schedule Trigger (todos os dias às 9h)
        │
        ▼
HTTP Request ── GET /api/produtos/stock (Camada de Serviços, X-API-Key)
        │
        ▼
Split Out ── separa a lista "produtos" (uma peça por item)
        │
        ▼
If ── stockAtual < stockMinimo ?
   │ true                      │ false
   ▼                           ▼
Code ── monta o alerta     (sem ação)
   │
   ▼
Send Email ── envia o alerta ao gestor
```

| Nó | Tipo | Função |
|---|---|---|
| Schedule Trigger | Gatilho | Inicia o workflow automaticamente todos os dias às 9h. O fuso horário (Europe/Lisbon) foi definido nas definições do workflow, porque o n8n usa America/New_York por omissão. O gatilho manual usado no desenvolvimento ficou no workflow, ligado ao mesmo nó, para permitir testes a pedido. |
| HTTP Request | Integração | Pede à camada de serviços a lista de peças com stock. Autentica-se com o cabeçalho `X-API-Key`, guardado como credencial encriptada do n8n (Header Auth). |
| Split Out | Transformação | A resposta chega num único item com a lista `produtos`; este nó transforma-a num item por peça, para poder ser avaliada individualmente. |
| If | Decisão | Compara `stockAtual` com `stockMinimo`. As peças abaixo do mínimo seguem pelo ramo *true*; as restantes pelo ramo *false*, que termina sem ação. |
| Code (JavaScript) | Transformação | Junta todas as peças do ramo *true* num único item com o assunto e o corpo do e-mail. |
| Send Email | Notificação | Envia o alerta ao gestor por SMTP, em texto simples. O assunto e o corpo vêm do nó anterior (`{{ $json.assunto }}` e `{{ $json.corpo }}`). Os dados da conta de e-mail ficam guardados como credencial encriptada do n8n (SMTP). |

Exemplo da resposta da camada de serviços (`GET /api/produtos/stock`):

```json
{
  "total": 3,
  "produtos": [
    { "productId": 363517, "name": "Filtro de ar", "reference": "dr", "stockAtual": 10, "stockMinimo": 15 },
    { "productId": 363520, "name": "Termóstato", "reference": "ds", "stockAtual": 10, "stockMinimo": 0 },
    { "productId": 363526, "name": "Fusível 10A", "reference": "dt", "stockAtual": 10, "stockMinimo": 0 }
  ]
}
```

Se nenhuma peça estiver abaixo do mínimo, o ramo *true* do If não produz itens; no n8n, um nó sem itens de entrada não é executado, pelo que nem o nó Code nem o Send Email correm e não é enviado nenhum e-mail.

O workflow exportado está em `RPA/workflow-alerta-stock-baixo.json` e pode ser importado noutra instância do n8n. O ficheiro contém apenas o nome e o identificador das credenciais, não os seus valores, que têm de ser recriados na instância de destino.

Código do nó que monta o alerta:

```js
const linhas = $input.all().map(i =>
  `- ${i.json.name}: ${i.json.stockAtual} em stock (mínimo ${i.json.stockMinimo})`
);

return [{
  json: {
    assunto: `Alerta de stock baixo: ${linhas.length} peça(s)`,
    corpo: "As seguintes peças estão abaixo do stock mínimo:\n\n" + linhas.join("\n"),
  },
}];
```

## 5. Ligação à arquitetura

O workflow **não chama o Moloni ON diretamente**: passa pela camada de serviços do Guilherme, tal como a aplicação Mendix.

```
n8n ──REST/JSON (HTTPS, X-API-Key)──► Camada de Serviços ──GraphQL (Bearer API Key)──► Moloni ON
                                         GET /api/produtos/stock           query products { stock minStock }
n8n ──SMTP──► E-mail do gestor
```

Vantagens desta decisão:
- **A chave do Moloni ON fica num só sítio** (variável de ambiente da camada de serviços), e não espalhada pelo n8n e pelo Mendix.
- **O n8n consome REST simples**, sem ter de construir pedidos GraphQL nem tratar os erros do Moloni, que chegam dentro de respostas HTTP 200.
- **Mudanças na API do Moloni ON** só obrigam a alterar a camada de serviços.

O endpoint `GET /api/produtos/stock` foi criado pelo Guilherme especificamente para esta automatização. Devolve apenas os artigos com gestão de stock (exclui serviços como «Mão de Obra»).

## 6. Contributo para outras secções

**Para a secção 2.1 (diagrama de arquitetura, Guilherme).** Componente «Automatização (n8n)», com duas ligações:
- n8n → Camada de Serviços: REST/JSON, `GET /api/produtos/stock`, autenticação por API Key interna (`X-API-Key`);
- n8n → Servidor de e-mail: SMTP.
Tecnologia: n8n (Node.js), self-hosted. Execução agendada (diária).

**Para o ponto 4 da secção 2.2 (Gonçalo R.).** Texto proposto para substituir o atual, que ainda descreve o acompanhamento de pagamentos:

> **4. Integração do Agente RPA (Mario)**
>
> Na Etapa 5 (`Verificar stock`), para evitar que uma intervenção pare por falta de componentes e tenha de seguir o percurso de exceção `Encomendar ao Fornecedor` → `Aguardar encomenda`:
> * Um workflow n8n é executado diariamente de forma automática (Schedule Trigger).
> * O workflow consulta, através da camada de serviços, o stock atual e o stock mínimo de cada peça registada no Moloni ON.
> * As peças com stock abaixo do mínimo são agrupadas num único alerta enviado por e-mail ao gestor, que pode encomendar ao fornecedor antes de o stock esgotar.
> * O workflow apenas lê dados do ERP: não emite documentos nem altera o stock.

## 7. Exploração realizada e testes

- **23 de outubro de 2026.** Instalação do n8n no computador local (`npx n8n`). No Safari foi necessário arrancar com `N8N_SECURE_COOKIE=false`, porque o navegador não aceita o cookie seguro do n8n em `localhost` sem HTTPS. Construção de um primeiro workflow com dados fictícios (gatilho manual → nó Code com três peças → If) para validar a lógica da decisão: as duas peças abaixo do mínimo seguiram pelo ramo *true* e a terceira pelo ramo *false* (Figuras 1 e 2).
- **26 de outubro de 2026.** Execução local da camada de serviços (`npm start`, porta 3000) com a chave do Moloni ON da empresa de teste numa variável de ambiente (`.env`, excluído do repositório). O nó Code de teste foi substituído por um pedido HTTP real à camada de serviços, autenticado com uma credencial Header Auth (Figuras 3 e 4). Com os dados de teste (Filtro de ar com stock 10 e mínimo 15; Termóstato e Fusível 10A com stock 10 e mínimo 0), o workflow identificou corretamente apenas o Filtro de ar e gerou a mensagem «Alerta de stock baixo: 1 peça(s)» (Figuras 5, 6 e 7).
- **26 e 27 de outubro de 2026.** Para os testes foi criada uma conta Gmail do projeto, que faz de gestor e é usada como remetente e destinatário. O envio usa o servidor SMTP do Gmail (`smtp.gmail.com`, porta 465, SSL/TLS) com uma palavra-passe de aplicação, guardada como credencial encriptada do n8n; o teste de ligação da credencial foi bem-sucedido. Com o gatilho manual, o servidor aceitou o envio do alerta (Figuras 8 e 9). Foi depois adicionado o Schedule Trigger, com o fuso horário Europe/Lisbon definido nas definições do workflow. Para testar o agendamento sem esperar pelas 9h, a hora foi colocada temporariamente para as 00:25 e o workflow foi publicado: às 00:25 o n8n executou o workflow sozinho, sem intervenção manual (execução concluída em 1,4 s), e o e-mail «Alerta de stock baixo: 1 peça(s)», com o Filtro de ar, chegou à caixa do gestor (Figuras 10 a 12). No histórico de execuções, esta execução distingue-se das execuções manuais de teste. No fim, o agendamento foi reposto para as 9h e o workflow foi exportado.

**Figuras** (em `RPA/prints/`):

| Figura | Ficheiro | Descrição |
|---|---|---|
| 1 | `01-n8n-workflow-teste-dados-ficticios.png` | Primeiro workflow com dados fictícios e resultado da decisão |
| 2 | `02-n8n-if-condicao-teste.png` | Condição do nó If |
| 3 | `03-n8n-credencial-header-auth.png` | Credencial Header Auth (valor oculto) |
| 4 | `04-n8n-http-request-stock-camada-servicos.png` | Pedido à camada de serviços com o stock real do Moloni ON |
| 5 | `05-n8n-split-out-pecas.png` | Separação da lista num item por peça |
| 6 | `06-n8n-if-stock-abaixo-minimo.png` | Decisão com dados reais: só o Filtro de ar abaixo do mínimo |
| 7 | `07-n8n-code-mensagem-alerta.png` | Mensagem do alerta gerada |
| 8 | `08-n8n-send-email-configuracao.png` | Configuração do nó Send Email e resposta do servidor SMTP (destinatário aceite) |
| 9 | `09-n8n-credencial-smtp.png` | Credencial SMTP com a ligação testada (palavra-passe oculta) |
| 10 | `10-email-alerta-recebido.png` | E-mail de alerta recebido |
| 11 | `11-n8n-workflow-final.png` | Workflow final com os dois gatilhos (manual e agendado) |
| 12 | `12-n8n-execucao-agendada.png` | Execução lançada pelo agendamento, no histórico de execuções |

Nenhuma figura mostra chaves de API.

## 8. Limitações e trabalho futuro

- **O stock só desce quando a fatura é finalizada.** Nos testes do Gonçalo C., uma fatura em rascunho não alterou o stock. Por isso, nos testes, o alerta foi provocado definindo um stock mínimo acima do stock atual, e não consumindo peças.
- **Depende do stock mínimo estar configurado** em cada peça no Moloni ON. Uma peça com mínimo 0 nunca gera alerta.
- **Execução local.** O n8n e a camada de serviços correm, por agora, em computadores locais. O agendamento só dispara se, às 9h, o n8n estiver a correr e o workflow estiver ativo (publicado). Para funcionar todos os dias sem depender de um computador ligado, ambos têm de ser alojados num servidor acessível, o que também é necessário para a aplicação Mendix.
- **Dependência da camada de serviços.** Se a camada de serviços estiver em baixo, o pedido falha e o alerta desse dia não é enviado. Uma melhoria é usar um workflow de erro do n8n (Error Trigger) para avisar quando a verificação falha.
- **Alertas repetidos.** Enquanto a peça não for reposta, o alerta repete-se todos os dias. Pode ser aceitável como lembrete; em alternativa, pode guardar-se a data do último aviso por peça.
- **Stock global e não por armazém.** O endpoint devolve o stock total do produto; a empresa de teste tem um único armazém, pelo que isto não afeta o protótipo.
- **Período de teste do Moloni ON.** A conta de teste dura 30 dias e o projeto decorre até janeiro, pelo que o acesso à API tem de ser renovado ou prolongado.

## 9. Esforço registado (diário do projeto)

| Data | Tarefa | Horas |
|---|---|---|
| 13/10 | Análise da distribuição de tarefas e do papel de Analista RPA | 0h30 |
| 13/10 | Configuração do ambiente: Mendix Studio Pro, acesso remoto ao computador de trabalho e clonagem do repositório | 2h00 |
| 13 a 15/10 | Certificação Mendix Rapid Developer | 7h00 |
| 14/10 | Leitura da análise das APIs (Jasmin) e escolha preliminar da tarefa | 0h30 |
| 22/10 | Leitura da distribuição de tarefas e da secção 3 (Moloni ON); análise das opções de automatização | 1h00 |
| 23/10 | Instalação e exploração do n8n; workflow de teste com dados fictícios | 2h00 |
| 23/10 | Comparação das ferramentas, justificação da escolha e alinhamento com a secção 2.2 | 0h45 |
| 26/10 | Análise da camada de serviços e coordenação com Guilherme e Gonçalo C. | 0h45 |
| 26/10 | Integração do n8n com a camada de serviços e testes com dados reais | 1h00 |
| 26/10 | Redação da documentação RPA | 0h30 |
| 26 e 27/10 | Envio de e-mail e agendamento diário: credencial SMTP, testes, exportação do workflow e conclusão da documentação | 0h45 |

Totais por semana: **Semana 1:** 10h00 (3h00 + 7h00 da certificação) · **Semana 2:** 3h45 · **Semana 3 (até 27/10):** 3h00.

## 10. Referências

[1] n8n. *n8n Docs*. https://docs.n8n.io/ (acedido a 26/10/2026)
[2] n8n. *Sustainable Use License*. https://docs.n8n.io/sustainable-use-license/ (acedido a 26/10/2026)
[3] n8n. *HTTP Request node, Split Out node, If node, Code node, Schedule Trigger node, Send Email node* (documentação dos nós). https://docs.n8n.io/integrations/builtin/ (acedido a 26/10/2026)
[4] Make. *Pricing*. https://www.make.com/en/pricing (acedido a 26/10/2026)
[5] Zapier. *Pricing*. https://zapier.com/pricing (acedido a 26/10/2026)
[6] UiPath. *UiPath Platform*. https://www.uipath.com/ (acedido a 26/10/2026)
[7] UI.Vision. *UI.Vision RPA*. https://ui.vision/ (acedido a 26/10/2026)
[8] Moloni ON. *Documentação da API*. https://docs.molonion.pt/ (acedido a 26/10/2026)
