const express = require("express");
const { executarGraphQL } = require("../services/moloni.service");

const router = express.Router();

// Consultar produtos do Moloni ON
router.get("/", async (req, res) => {
  try {
    const query = `
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
          }
        }
      }
    `;

    const resultado = await executarGraphQL(query, {
      companyId: Number(process.env.MOLONI_COMPANY_ID),
    });

    const operacao = resultado.data?.products;

    if (operacao?.errors?.length) {
      return res.status(502).json({
        erro: "O Moloni ON devolveu erros na consulta de produtos.",
      });
    }

    const produtos = operacao?.data;

    if (!Array.isArray(produtos)) {
      return res.status(502).json({
        erro: "Resposta inesperada do Moloni ON.",
      });
    }

    return res.status(200).json({
      total: produtos.length,
      produtos,
    });
  } catch (erro) {
    console.error("Erro na consulta de produtos:", erro.message);

    return res.status(502).json({
      erro: "Não foi possível consultar os produtos.",
    });
  }
});

module.exports = router;