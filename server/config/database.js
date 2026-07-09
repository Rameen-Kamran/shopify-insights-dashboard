// config/database.js
// Creates and exports a single Sequelize instance for the whole app.
// Every model imports THIS instance so they all share one connection pool.

const { Sequelize } = require('sequelize');

// dotenv is loaded in index.js before this file is required, so
// process.env already has our DB_* values here.
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',     // tells Sequelize to use the mysql2 driver under the hood
    logging: false,       // set to console.log if you want to see the raw SQL
  }
);

module.exports = sequelize;
