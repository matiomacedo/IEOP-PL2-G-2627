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
  ...[
    ["graphql_autenticacao", "MOLONI_AUTENTICACAO"],
    ["graphql_validacao", "MOLONI_VALIDACAO"],
    ["graphql_operacao", "MOLONI_OPERACAO"],
    ["http_401", "MOLONI_AUTENTICACAO"],
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
