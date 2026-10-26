require("dotenv").config();

const { executarGraphQL } = require("../src/services/moloni.service");

async function testarStock() {
  try {
    const query = `
      query ($companyId: Int!, $productId: Int!) {
        product(companyId: $companyId, productId: $productId) {
          errors {
            field
            msg
          }
          data {
            productId
            name
            type
            hasStock
            stock
            minStock
            warehouses {
              warehouseId
              stock
              minStock
            }
          }
        }
      }
    `;

    const resultado = await executarGraphQL(query, {
      companyId: Number(process.env.MOLONI_COMPANY_ID),
      productId: 363517,
    });

    console.log("Resposta:", JSON.stringify(resultado, null, 2));
  } catch (erro) {
    console.error("Erro na consulta de stock:", erro.message);
  }
}

testarStock();