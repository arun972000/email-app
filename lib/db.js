import mysql from "mysql2/promise";

// Create the connection to database
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "bulk_email",
  password: "Race@2023",
  waitForConnections: true,
  connectionLimit: 500,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export default db;