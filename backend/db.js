const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',        
  host: 'localhost',       
  database: 'restaurant_booking', 
  password: 'chirag12',      
  port: 5432,             
});
module.exports = pool;
