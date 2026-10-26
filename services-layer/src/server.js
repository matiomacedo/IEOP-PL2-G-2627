require("dotenv").config();

const express = require("express");
const produtosRoutes = require("./routes/produtos.routes");
const autenticar = require("./middleware/autenticacao");
const clientesRoutes = require("./routes/clientes.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Verificar se a Services Layer está operacional
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "gestao-assistencia-integracao",
  });
});

// Rotas de produtos
app.use("/api/produtos", autenticar, produtosRoutes);
app.use("/api/clientes", autenticar, clientesRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Services Layer a funcionar na porta ${PORT}`);
});