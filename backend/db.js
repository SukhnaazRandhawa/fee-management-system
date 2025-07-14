const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase and many cloud Postgres providers
  },
});

module.exports = {
  query: (text, params) => pool.query(text, params),
}; 