import { Client } from "pg";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

export default async function handler(req, res) {
  const { method } = req;

  if (method === "GET") {
    const result = await client.query("SELECT * FROM tickets ORDER BY criadoEm DESC");
    res.status(200).json(result.rows);
  } else if (method === "POST") {
    const { titulo, descricao, solicitante, prioridade } = req.body;
    const result = await client.query(
      `INSERT INTO tickets (titulo, descricao, solicitante, prioridade, status, criadoEm, atualizadoEm)
       VALUES ($1,$2,$3,$4,'Aberto',NOW(),NOW()) RETURNING *`,
      [titulo, descricao, solicitante || null, prioridade || 'normal']
    );
    res.status(201).json(result.rows[0]);
  } else if (method === "PUT") {
    const { id } = req.query;
    const { titulo, descricao, solicitante, prioridade, status } = req.body;
    const result = await client.query(
      `UPDATE tickets SET titulo=$1, descricao=$2, solicitante=$3, prioridade=$4, status=$5, atualizadoEm=NOW()
       WHERE id=$6 RETURNING *`,
      [titulo, descricao, solicitante, prioridade, status, id]
    );
    res.status(200).json(result.rows[0]);
  } else if (method === "DELETE") {
    const { id } = req.query;
    await client.query(`DELETE FROM tickets WHERE id=$1`, [id]);
    res.status(204).end();
  } else {
    res.setHeader("Allow", ["GET","POST","PUT","DELETE"]);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
