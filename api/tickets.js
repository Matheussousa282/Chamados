import { Client } from "pg";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

export default async function handler(req, res) {
  const { method } = req;

  if (method === "GET") {
    const { rows } = await client.query("SELECT * FROM tickets ORDER BY criado_em DESC");
    return res.status(200).json(rows);
  }

  if (method === "POST") {
    const { titulo, descricao, solicitante, prioridade } = req.body;
    const now = new Date().toISOString();
    const { rows } = await client.query(
      `INSERT INTO tickets (titulo, descricao, solicitante, prioridade, status, criado_em, atualizado_em)
       VALUES ($1,$2,$3,$4,'Aberto',$5,$5) RETURNING *`,
      [titulo, descricao, solicitante || null, prioridade || 'normal', now]
    );
    return res.status(201).json(rows[0]);
  }

  if (method === "PUT") {
    const { id } = req.query;
    const { titulo, descricao, solicitante, prioridade, status } = req.body;
    const now = new Date().toISOString();
    const { rows } = await client.query(
      `UPDATE tickets
       SET titulo=$1, descricao=$2, solicitante=$3, prioridade=$4, status=COALESCE($5,status), atualizado_em=$6
       WHERE id=$7 RETURNING *`,
      [titulo, descricao, solicitante || null, prioridade || 'normal', status, now, id]
    );
    return res.status(200).json(rows[0]);
  }

  if (method === "DELETE") {
    const { id } = req.query;
    await client.query(`DELETE FROM tickets WHERE id=$1`, [id]);
    return res.status(204).end();
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).end(`Method ${method} Not Allowed`);
}
