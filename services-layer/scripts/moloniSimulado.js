// Simulador local da API GraphQL do Moloni ON, apenas para testes de contrato.
// Uso: node scripts/moloniSimulado.js [porta]
// O modo de resposta muda com POST /__modo {"modo":"..."}.
const http = require("node:http");

const PORTA = Number(process.argv[2]) || 4010;
const CHAVE_ESPERADA = "chave-moloni-simulada";
const EMPRESA_ESPERADA = 1;
const INT_MAXIMO = 2147483647;

const PRODUTOS = [
  { productId: 1, name: "Filtro de ar", reference: "dr", hasStock: true, stock: 10, minStock: 15 },
  { productId: 2, name: "Mão de Obra", reference: "mo", hasStock: false, stock: 0, minStock: 0 },
];
const CLIENTES = [{ customerId: 7, name: "Cliente de Teste", vat: "123456789", number: "2" }];

let modo = "ok";
const emails = [];

function dados({ query, variables }) {
  if (/\bproduct\s*\(/.test(query)) {
    const produto = PRODUTOS.find((p) => p.productId === variables.productId);
    return {
      product: {
        errors: [],
        data: produto
          ? { ...produto, warehouses: [{ warehouseId: 507, stock: produto.stock, minStock: produto.minStock }] }
          : null,
      },
    };
  }
  if (/\bproducts\s*\(/.test(query)) {
    // Tal como no GraphQL, só devolve os campos pedidos.
    const data = /\bhasStock\b/.test(query)
      ? PRODUTOS
      : PRODUTOS.map(({ productId, name, reference }) => ({ productId, name, reference }));
    return { products: { errors: [], data } };
  }
  if (/\bcustomers\s*\(/.test(query)) {
    return { customers: { errors: [], data: CLIENTES.filter((c) => c.vat === variables.nif) } };
  }
  return null;
}

function responder(res, estado, corpo) {
  res.writeHead(estado, { "Content-Type": "application/json" });
  res.end(typeof corpo === "string" ? corpo : JSON.stringify(corpo));
}

http
  .createServer((req, res) => {
    let texto = "";
    req.on("data", (parte) => (texto += parte));
    req.on("end", () => {
      if (req.url === "/__emails") return responder(res, 200, emails);
      if (req.url === "/__modo") {
        modo = JSON.parse(texto).modo;
        return responder(res, 200, { modo });
      }

      if (req.url === "/v3/smtp/email") {
        if (!req.headers["api-key"]) return responder(res, 401, { message: "Key not found" });
        emails.push(JSON.parse(texto));
        return responder(res, 201, { messageId: "<simulado>" });
      }

      if (modo === "sem_ligacao") return req.socket.destroy();
      if (modo === "http_401") return responder(res, 401, { message: "Unauthorized" });
      if (modo === "http_403") return responder(res, 403, { message: "Forbidden" });
      if (modo === "http_500") return responder(res, 500, { message: "Internal error" });
      if (modo === "json_invalido") return responder(res, 200, "<html>");
      if (modo === "graphql_autenticacao") {
        return responder(res, 200, { errors: [{ message: "You must be logged in" }] });
      }
      if (modo === "graphql_validacao") {
        return responder(res, 200, { data: { resultado: { errors: [{ field: "vat", msg: "validation failed" }], data: null } } });
      }
      if (modo === "graphql_operacao") {
        return responder(res, 200, { errors: [{ message: "Something went wrong" }] });
      }
      if (modo === "sem_dados") return responder(res, 200, {});
      if (modo === "graphql_malformado") return responder(res, 200, { errors: [null] });
      if (modo === "dados_inesperados") {
        const operacao = { errors: [], data: "inesperado" };
        return responder(res, 200, { data: { products: operacao, customers: operacao } });
      }

      if (req.headers.authorization !== `Bearer ${CHAVE_ESPERADA}`) {
        return responder(res, 401, { message: "Unauthorized" });
      }

      const pedido = JSON.parse(texto);
      if (pedido.variables?.companyId !== EMPRESA_ESPERADA) {
        return responder(res, 200, { errors: [{ message: "Variable $companyId of required type Int! was not provided" }] });
      }
      if (pedido.variables?.productId > INT_MAXIMO) {
        return responder(res, 200, { errors: [{ message: "Int cannot represent non 32-bit signed integer value" }] });
      }
      return responder(res, 200, { data: dados(pedido) });
    });
  })
  .listen(PORTA, () => console.log(`Moloni simulado na porta ${PORTA}`));
