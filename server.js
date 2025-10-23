// server.js
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Substitua pela sua DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_AZQOH21EvDqR@ep-solitary-rice-aebx2vma-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"
});

app.use(cors());
app.use(bodyParser.json());

// ---------- criar tabela se não existir ----------
(async () => {
  const client = await pool.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      solicitante TEXT,
      prioridade TEXT,
      status TEXT DEFAULT 'Aberto',
      criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atualizadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  client.release();
})();

// ---------- CRUD ----------

// Listar tickets
app.get("/tickets", async (req, res) => {
  const result = await pool.query("SELECT * FROM tickets ORDER BY criadoEm DESC");
  res.json(result.rows);
});

// Criar ticket
app.post("/tickets", async (req, res) => {
  const { titulo, descricao, solicitante, prioridade } = req.body;
  const result = await pool.query(
    `INSERT INTO tickets (titulo, descricao, solicitante, prioridade) 
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [titulo, descricao, solicitante, prioridade]
  );
  res.json(result.rows[0]);
});

// Atualizar ticket
app.put("/tickets/:id", async (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, solicitante, prioridade, status } = req.body;
  const result = await pool.query(
    `UPDATE tickets SET 
      titulo=$1, descricao=$2, solicitante=$3, prioridade=$4, status=$5, atualizadoEm=NOW()
     WHERE id=$6 RETURNING *`,
    [titulo, descricao, solicitante, prioridade, status, id]
  );
  res.json(result.rows[0]);
});

// Deletar ticket
app.delete("/tickets/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM tickets WHERE id=$1", [id]);
  res.sendStatus(204);
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});
