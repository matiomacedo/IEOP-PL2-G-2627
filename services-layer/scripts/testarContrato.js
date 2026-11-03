// Testes de contrato da Services Layer, contra o simulador do Moloni ON.
// Uso: node scripts/testarContrato.js <URL base> <X-API-Key> [URL do simulador]
const assert = require("node:assert/strict");

const [BASE, CHAVE, SIMULADOR = "http://localhost:4010"] = process.argv.slice(2);

if (!BASE || !CHAVE) {
  console.error("Uso: node scripts/testarContrato.js <URL base> <X-API-Key> [URL do simulador]");
  process.exit(2);
}

const FILTRO = { productId: 1, name: "Filtro de ar", reference: "dr" };
const STOCK = { ...FILTRO, stockAtual: 10, stockMinimo: 15 };
// Resposta do Header Auth nativo do n8n: texto simples, igual para chave em falta ou errada.
const ERRO_CHAVE = "Authorization data is wrong!";
const ERRO_INTERNO = { erro: "Ocorreu um erro interno no servidor.", codigo: "ERRO_INTERNO" };
const ERRO_PRODUTOS = "Não foi possível consultar os produtos.";

const casos = [
  ["estado sem autenticação", "ok", "/api/health", null, 200, { status: "ok", service: "gestao-assistencia-integracao" }],
  ["produtos", "ok", "/api/produtos", CHAVE, 200, {
    total: 2,
    produtos: [FILTRO, { productId: 2, name: "Mão de Obra", reference: "mo" }],
  }],
  ["stock exclui artigos sem stock", "ok", "/api/produtos/stock", CHAVE, 200, { total: 1, produtos: [STOCK] }],
  ["stock de um produto", "ok", "/api/produtos/stock-detalhe?id=1", CHAVE, 200, {
    productId: 1,
    name: "Filtro de ar",
    hasStock: true,
    stockAtual: 10,
    stockMinimo: 15,
    armazens: [{ warehouseId: 507, stockAtual: 10, stockMinimo: 15 }],
  }],
  ["cliente por NIF, sem espaços", "ok", "/api/clientes?nif=%20123456789%20", CHAVE, 200, {
    total: 1,
    clientes: [{ customerId: 7, name: "Cliente de Teste", vat: "123456789", number: "2" }],
  }],
  ["cliente inexistente", "ok", "/api/clientes?nif=000000000", CHAVE, 200, { total: 0, clientes: [] }],
  ["identificador inválido", "ok", "/api/produtos/stock-detalhe?id=abc", CHAVE, 400, {
    erro: "O identificador do produto deve ser um número inteiro positivo.",
  }],
  ["identificador zero", "ok", "/api/produtos/stock-detalhe?id=0", CHAVE, 400, {
    erro: "O identificador do produto deve ser um número inteiro positivo.",
  }],
  ["identificador em falta", "ok", "/api/produtos/stock-detalhe", CHAVE, 400, {
    erro: "O identificador do produto deve ser um número inteiro positivo.",
  }],
  ["produto inexistente", "ok", "/api/produtos/stock-detalhe?id=999", CHAVE, 404, { erro: "Produto não encontrado." }],
  ["NIF em falta", "ok", "/api/clientes", CHAVE, 400, { erro: "O parâmetro nif é obrigatório." }],
  ["NIF vazio", "ok", "/api/clientes?nif=%20", CHAVE, 400, { erro: "O parâmetro nif é obrigatório." }],
  ["chave em falta", "ok", "/api/produtos", null, 403, ERRO_CHAVE],
  ["chave errada", "ok", "/api/produtos", "chave-errada", 403, ERRO_CHAVE],
  ["identificador acima de Int", "ok", "/api/produtos/stock-detalhe?id=2147483648", CHAVE, 502, {
    erro: "Não foi possível consultar o stock do produto.",
    codigo: "MOLONI_OPERACAO",
  }],
  ["erro inesperado", "graphql_malformado", "/api/produtos", CHAVE, 500, ERRO_INTERNO],
  ["erro inesperado no stock", "graphql_malformado", "/api/produtos/stock", CHAVE, 500, ERRO_INTERNO],
  ["erro inesperado num produto", "graphql_malformado", "/api/produtos/stock-detalhe?id=1", CHAVE, 500, ERRO_INTERNO],
  ["erro inesperado nos clientes", "graphql_malformado", "/api/clientes?nif=1", CHAVE, 500, ERRO_INTERNO],
  ...[
    ["/api/produtos", "dados_inesperados"],
    ["/api/produtos/stock", "dados_inesperados"],
    ["/api/clientes?nif=1", "dados_inesperados"],
  ].map(([caminho, modo]) => [`resposta inesperada: ${caminho}`, modo, caminho, CHAVE, 502, {
    erro: "Resposta inesperada do Moloni ON.",
  }]),
  ...[
    ["/api/produtos/stock", "Não foi possível consultar o stock dos produtos."],
    ["/api/produtos/stock-detalhe?id=1", "Não foi possível consultar o stock do produto."],
    ["/api/clientes?nif=1", "Não foi possível consultar os clientes."],
  ].map(([caminho, erro]) => [`Moloni indisponível: ${caminho}`, "http_500", caminho, CHAVE, 502, {
    erro,
    codigo: "MOLONI_HTTP",
  }]),
  ...[
    ["graphql_autenticacao", "MOLONI_AUTENTICACAO"],
    ["graphql_validacao", "MOLONI_VALIDACAO"],
    ["graphql_operacao", "MOLONI_OPERACAO"],
    ["http_401", "MOLONI_AUTENTICACAO"],
    ["http_403", "MOLONI_AUTENTICACAO"],
    ["http_500", "MOLONI_HTTP"],
    ["json_invalido", "MOLONI_RESPOSTA_INVALIDA"],
    ["sem_dados", "MOLONI_RESPOSTA_INVALIDA"],
    ["sem_ligacao", "MOLONI_COMUNICACAO"],
  ].map(([modo, codigo]) => [`Moloni: ${modo}`, modo, "/api/produtos", CHAVE, 502, { erro: ERRO_PRODUTOS, codigo }]),
];

async function definirModo(modo) {
  await fetch(`${SIMULADOR}/__modo`, { method: "POST", body: JSON.stringify({ modo }) });
}

async function executar() {
  let falhas = 0;

  for (const [nome, modo, caminho, chave, estado, corpo] of casos) {
    await definirModo(modo);
    const resposta = await fetch(BASE + caminho, { headers: chave ? { "X-API-Key": chave } : {} });
    const texto = await resposta.text();

    try {
      assert.equal(resposta.status, estado);
      assert.deepEqual(typeof corpo === "string" ? texto : JSON.parse(texto), corpo);
      console.log(`ok    ${nome}`);
    } catch {
      falhas += 1;
      console.log(`FALHA ${nome}: esperado ${estado} ${JSON.stringify(corpo)}; obtido ${resposta.status} ${texto.slice(0, 200)}`);
    }
  }

  await definirModo("ok");
  console.log(`\n${casos.length - falhas}/${casos.length} casos passaram`);
  process.exit(falhas ? 1 : 0);
}

executar();
