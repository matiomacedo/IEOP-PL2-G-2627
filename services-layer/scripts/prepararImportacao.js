// Prepara os workflows para importação, com a empresa do Moloni ON de cada ambiente.
// Uso: node --env-file=.env scripts/prepararImportacao.js
const fs = require("node:fs");
const path = require("node:path");

const { MOLONI_API_URL, MOLONI_COMPANY_ID } = process.env;

if (!/^[1-9]\d*$/.test(MOLONI_COMPANY_ID ?? "")) {
  console.error("MOLONI_COMPANY_ID tem de ser um número inteiro positivo.");
  process.exit(1);
}

const raiz = path.join(__dirname, "..");
const destino = path.join(raiz, ".importacao");
const origens = [
  ...fs
    .readdirSync(path.join(raiz, "workflows"))
    .filter((ficheiro) => ficheiro.endsWith(".json"))
    .map((ficheiro) => path.join(raiz, "workflows", ficheiro)),
  path.join(raiz, "..", "RPA", "workflow-alerta-stock-baixo.json"),
];

fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino);

for (const origem of origens) {
  let conteudo = fs.readFileSync(origem, "utf8").replaceAll("PREENCHER_MOLONI_COMPANY_ID", MOLONI_COMPANY_ID);
  if (MOLONI_API_URL) conteudo = conteudo.replaceAll("https://api.molonion.pt/v1", MOLONI_API_URL);
  fs.writeFileSync(path.join(destino, path.basename(origem)), conteudo);
}

console.log(`${origens.length} workflows preparados em ${destino}`);
