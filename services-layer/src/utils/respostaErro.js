const { ErroMoloni } = require("../services/moloni.service");

function responderErro(res, erro, mensagemPadrao) {
  if (erro instanceof ErroMoloni) {
    console.error("Erro Moloni:", erro.tipo, erro.message);

    return res.status(erro.estadoHTTP).json({
      erro: mensagemPadrao,
      codigo: `MOLONI_${erro.tipo}`,
    });
  }

  console.error("Erro inesperado:", erro.message);

  return res.status(500).json({
    erro: "Ocorreu um erro interno no servidor.",
    codigo: "ERRO_INTERNO",
  });
}

module.exports = { responderErro };
