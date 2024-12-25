require('dotenv').config();

const { Pool } = require('pg'); 

const pool = new Pool({
    connectionString: process.env.POOLED_NEON_DB_CONNECTION
})


module.exports = pool