const express = require("express");
const { executarGraphQL } = require("../services/moloni.service");

const router = express.Router();

router.get("/", async (req, res) => {
  const nif = req.query.nif;

  if (typeof nif !== "string" || !nif.trim()) {
    return res.status(400).json({
      erro: "O parâmetro nif é obrigatório.",
    });
  }

  const query = `
    query ($companyId: Int!, $nif: String!) {
      customers(
        companyId: $companyId
        options: {
          search: {
            field: vat
            value: $nif
          }
          pagination: { page: 1, qty: 20 }
        }
      ) {
        errors {
          field
          msg
        }
        data {
          customerId
          name
          vat
          number
        }
      }
    }
  `;

  try {
    const resultado = await executarGraphQL(query, {
      companyId: Number(process.env.MOLONI_COMPANY_ID),
      nif: nif.trim(),
    });

    const operacao = resultado.data?.customers;

    if (operacao?.errors?.length) {
      return res.status(502).json({
        erro: "O Moloni ON devolveu erros na consulta de clientes.",
      });
    }

    const clientes = operacao?.data;

    if (!Array.isArray(clientes)) {
      return res.status(502).json({
        erro: "Resposta inesperada do Moloni ON.",
      });
    }

    return res.status(200).json({
      total: clientes.length,
      clientes,
    });
  } catch (erro) {
    console.error("Erro na consulta de clientes:", erro.message);

    return res.status(502).json({
      erro: "Não foi possível consultar os clientes.",
    });
  }
});

module.exports = router;