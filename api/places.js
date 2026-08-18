import { neon } from "@neondatabase/serverless";

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  return neon(url);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const sql = db();
    if (req.method === "GET") {
      const rows = await sql`
        SELECT id, cat, name, addr, lat, lng, note
        FROM places
        ORDER BY id ASC
      `;
      return res.status(200).json({ places: rows });
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      if (!body.name || !body.addr) return res.status(400).json({ error: "name and addr required" });
      const rows = await sql`
        INSERT INTO places (cat, name, addr, lat, lng, note)
        VALUES (
          ${body.cat || "Other"},
          ${body.name},
          ${body.addr},
          ${body.lat ?? null},
          ${body.lng ?? null},
          ${body.note || ""}
        )
        RETURNING id, cat, name, addr, lat, lng, note
      `;
      return res.status(201).json({ place: rows[0] });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
