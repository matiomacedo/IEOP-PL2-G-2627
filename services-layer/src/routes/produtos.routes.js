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

// Consultar stock de um produto do Moloni ON
router.get("/:id/stock", async (req, res) => {
  const productId = Number(req.params.id);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return res.status(400).json({
      erro: "O identificador do produto deve ser um número inteiro positivo.",
    });
  }

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

  try {
    const resultado = await executarGraphQL(query, {
      companyId: Number(process.env.MOLONI_COMPANY_ID),
      productId,
    });

    const operacao = resultado.data?.product;

    if (operacao?.errors?.length) {
      return res.status(502).json({
        erro: "O Moloni ON devolveu erros na consulta de stock.",
      });
    }

    const produto = operacao?.data;

    if (!produto || typeof produto !== "object") {
      return res.status(404).json({
        erro: "Produto não encontrado.",
      });
    }

    return res.status(200).json({
      productId: produto.productId,
      name: produto.name,
      hasStock: produto.hasStock,
      stockAtual: produto.stock,
      stockMinimo: produto.minStock,
      armazens: (produto.warehouses || []).map((armazem) => ({
        warehouseId: armazem.warehouseId,
        stockAtual: armazem.stock,
        stockMinimo: armazem.minStock,
      })),
    });
  } catch (erro) {
    console.error("Erro na consulta de stock:", erro.message);

    return res.status(502).json({
      erro: "Não foi possível consultar o stock do produto.",
    });
  }
});

// Consultar o stock dos produtos para o n8n
router.get("/stock", async (req, res) => {
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
          hasStock
          stock
          minStock
        }
      }
    }
  `;

  try {
    const resultado = await executarGraphQL(query, {
      companyId: Number(process.env.MOLONI_COMPANY_ID),
    });

    const operacao = resultado.data?.products;

    if (operacao?.errors?.length) {
      return res.status(502).json({
        erro: "O Moloni ON devolveu erros na consulta de stock.",
      });
    }

    if (!Array.isArray(operacao?.data)) {
      return res.status(502).json({
        erro: "Resposta inesperada do Moloni ON.",
      });
    }

    const produtos = operacao.data
      .filter((produto) => produto.hasStock === true)
      .map((produto) => ({
        productId: produto.productId,
        name: produto.name,
        reference: produto.reference,
        stockAtual: produto.stock,
        stockMinimo: produto.minStock,
      }));

    return res.status(200).json({
      total: produtos.length,
      produtos,
    });
  } catch (erro) {
    console.error("Erro na consulta de stock:", erro.message);

    return res.status(502).json({
      erro: "Não foi possível consultar o stock dos produtos.",
    });
  }
});

module.exports = router;