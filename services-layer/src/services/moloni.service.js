class ErroMoloni extends Error {
  constructor(mensagem, tipo = "OPERACAO", estadoHTTP = 502) {
    super(mensagem);
    this.name = "ErroMoloni";
    this.tipo = tipo;
    this.estadoHTTP = estadoHTTP;
  }
}

function classificarErrosGraphQL(erros) {
  const mensagens = erros
    .map((erro) => String(erro.msg || erro.message || ""))
    .join(" ")
    .toLowerCase();

  const autenticacao =
    /must be logged in|unauthorized|unauthenticated|invalid.*token|invalid.*api.key|access denied/i;

  if (autenticacao.test(mensagens)) {
    return new ErroMoloni(
      "Falha de autenticação na API do Moloni ON.",
      "AUTENTICACAO",
    );
  }

  const validacao =
    /validation|invalid.*field|required|must be|graphql_validation_failed/i;

  if (validacao.test(mensagens)) {
    return new ErroMoloni(
      "O Moloni ON rejeitou os dados da operação.",
      "VALIDACAO",
    );
  }

  return new ErroMoloni(
    "O Moloni ON devolveu um erro na operação solicitada.",
    "OPERACAO",
  );
}

function verificarErrosGraphQL(resultado) {
  if (Array.isArray(resultado.errors) && resultado.errors.length > 0) {
    throw classificarErrosGraphQL(resultado.errors);
  }

  if (!resultado.data || typeof resultado.data !== "object") {
    throw new ErroMoloni(
      "Resposta inesperada do Moloni ON.",
      "RESPOSTA_INVALIDA",
    );
  }

  for (const operacao of Object.values(resultado.data)) {
    if (Array.isArray(operacao?.errors) && operacao.errors.length > 0) {
      throw classificarErrosGraphQL(operacao.errors);
    }
  }
}

async function executarGraphQL(query, variables = {}) {
  let resposta;

  try {
    resposta = await fetch(process.env.MOLONI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MOLONI_API_KEY}`,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new ErroMoloni(
      "Não foi possível estabelecer comunicação com o Moloni ON.",
      "COMUNICACAO",
    );
  }

  if (resposta.status === 401 || resposta.status === 403) {
    throw new ErroMoloni(
      "Falha de autenticação na API do Moloni ON.",
      "AUTENTICACAO",
    );
  }

  if (!resposta.ok) {
    throw new ErroMoloni(
      `O Moloni ON devolveu o código HTTP ${resposta.status}.`,
      "HTTP",
    );
  }

  let resultado;

  try {
    resultado = await resposta.json();
  } catch {
    throw new ErroMoloni(
      "O Moloni ON devolveu uma resposta JSON inválida.",
      "RESPOSTA_INVALIDA",
    );
  }

  verificarErrosGraphQL(resultado);

  return resultado;
}

module.exports = { executarGraphQL, ErroMoloni };
