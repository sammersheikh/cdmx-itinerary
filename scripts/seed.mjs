import { neon } from "@neondatabase/serverless";
import { PLACES } from "./places.mjs";

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS places (
    id SERIAL PRIMARY KEY,
    cat TEXT NOT NULL DEFAULT 'Other',
    name TEXT NOT NULL,
    addr TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`CREATE UNIQUE INDEX IF NOT EXISTS places_name_addr ON places (name, addr)`;

for (const p of PLACES) {
  await sql`
    INSERT INTO places (cat, name, addr, lat, lng, note)
    VALUES (${p.cat}, ${p.name}, ${p.addr}, ${p.lat ?? null}, ${p.lng ?? null}, ${p.note || ""})
    ON CONFLICT (name, addr) DO UPDATE SET
      cat = EXCLUDED.cat,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      note = EXCLUDED.note
  `;
}

const count = await sql`SELECT count(*)::int AS n FROM places`;
console.log("seeded", count[0].n, "places");
