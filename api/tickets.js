import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === "GET") {
      const result = await pool.query("SELECT * FROM tickets ORDER BY criadoEm DESC");
      res.status(200).json(result.rows);
    } else if (method === "POST") {
      const { titulo, descricao, solicitante, prioridade } = req.body;
      const result = await pool.query(
        `INSERT INTO tickets (titulo, descricao, solicitante, prioridade)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [titulo, descricao, solicitante, prioridade]
      );
      res.status(201).json(result.rows[0]);
    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}
