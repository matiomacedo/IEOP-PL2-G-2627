async function executarGraphQL(query, variables = {}) {
  const resposta = await fetch(process.env.MOLONI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MOLONI_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!resposta.ok) {
    throw new Error(`Erro HTTP do Moloni ON: ${resposta.status}`);
  }

  const resultado = await resposta.json();

  if (resultado.errors?.length) {
    throw new Error("O Moloni ON devolveu erros GraphQL.");
  }

  return resultado;
}

module.exports = { executarGraphQL };