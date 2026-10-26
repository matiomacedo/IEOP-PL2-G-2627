require("dotenv").config();

const API_URL = process.env.MOLONI_API_URL;
const API_KEY = process.env.MOLONI_API_KEY;
const COMPANY_ID = Number(process.env.MOLONI_COMPANY_ID);

async function testarProdutos() {
  try {
    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          query ($companyId: Int!) {
            products(companyId: $companyId) {
              errors {
                field
                msg
              }
              data {
                productId
                name
                reference
                hasStock
                stock
                minStock
              }
            }
          }
        `,
        variables: {
          companyId: COMPANY_ID,
        },
      }),
    });

    const resultado = await resposta.json();

    console.log("Código HTTP:", resposta.status);
    console.log("Resposta da API:", JSON.stringify(resultado, null, 2));
  } catch (erro) {
    console.error("Erro de comunicação:", erro.message);
  }
}

testarProdutos();
