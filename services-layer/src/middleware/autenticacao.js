const crypto = require("node:crypto");

function autenticar(req, res, next) {
  const chaveEsperada = process.env.INTERNAL_API_KEY;
  const chaveRecebida = req.get("X-API-Key");

  if (!chaveEsperada) {
    return res.status(503).json({
      erro: "Autenticação interna não configurada.",
    });
  }

  if (!chaveRecebida) {
    return res.status(401).json({
      erro: "API Key interna obrigatória.",
    });
  }

  const esperada = crypto.createHash("sha256")
    .update(chaveEsperada)
    .digest();

  const recebida = crypto.createHash("sha256")
    .update(chaveRecebida)
    .digest();

  if (!crypto.timingSafeEqual(esperada, recebida)) {
    return res.status(403).json({
      erro: "API Key interna inválida.",
    });
  }

  next();
}

module.exports = autenticar;