const Pool = require('pg').Pool;

const dotenv = require('dotenv');
const path = require('path');

const root = path.join.bind(this, __dirname);
dotenv.config({ path: root('.env') });

const pool = new Pool({
    user: process.env.user_db,
    password: process.env.password_db,
    host: process.env.host_db,
    port: process.env.port_db,
    database: process.env.database
});

module.exports = pool;