const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Permite receber pedidos com corpo JSON
app.use(express.json());

// Endpoint para verificar o funcionamento do servidor
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "gestao-assistencia-integracao",
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Services Layer a funcionar na porta ${PORT}`);
});