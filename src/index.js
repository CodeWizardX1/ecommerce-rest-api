import { Pool } from "pg";

// Debug: Check if DATABASE_URL is loaded
console.log("DATABASE_URL:", process.env.DATABASE_URL);

// Use explicit configuration to avoid any issues with connection string parsing
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ecommerce',
  password: 'postgres',
  port: 5432,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);
export { pool };
