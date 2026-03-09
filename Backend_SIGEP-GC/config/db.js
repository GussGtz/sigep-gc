const { Pool } = require("pg");
require("dotenv").config();

// DATABASE_URL tiene prioridad (Neon / Render / cualquier PaaS)
// Si no existe, usa variables individuales (desarrollo local)
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Neon requiere SSL
    })
  : new Pool({
      host:     process.env.DB_HOST,
      port:     parseInt(process.env.DB_PORT || "5432"),
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl:      process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });

pool.on("error", (err) => {
  console.error("Error inesperado en el pool de PostgreSQL:", err.message);
});

module.exports = pool;
