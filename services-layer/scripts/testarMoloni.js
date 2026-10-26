require("dotenv").config();

const API_URL = process.env.MOLONI_API_URL;
const API_KEY = process.env.MOLONI_API_KEY;

async function testarLigacao() {
  try {
    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          query {
            me {
              errors {
                field
                msg
              }
              data {
                userId
                userCompanies {
                  companyId
                }
              }
            }
          }
        `,
      }),
    });

    const resultado = await resposta.json();

    console.log("Código HTTP:", resposta.status);
    console.log("Resposta da API:", JSON.stringify(resultado, null, 2));
  } catch (erro) {
    console.error("Erro de comunicação:", erro.message);
  }
}

testarLigacao();