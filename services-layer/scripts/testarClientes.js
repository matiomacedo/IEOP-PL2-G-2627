require("dotenv").config();

const { executarGraphQL } = require("../src/services/moloni.service");

async function testarClientes() {
  try {
    const query = `
      query ($companyId: Int!) {
        customers(
          companyId: $companyId
          options: {
            search: {
                field: vat
                value: "seuNIF_testes_API"
            }
            pagination: { page: 1, qty: 20 }
            }
        ) {
          errors { field msg }
          data {
            customerId
            name
            vat
            number
          }
        }
      }
    `;

    const resultado = await executarGraphQL(query, {
      companyId: Number(process.env.MOLONI_COMPANY_ID),
    });

    console.log("Resposta:", JSON.stringify(resultado, null, 2));
  } catch (erro) {
    console.error("Erro na consulta:", erro.message);
  }
}

testarClientes();