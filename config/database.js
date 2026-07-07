const mysql = require('mysql2');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 10000
};

const connection = mysql.createConnection(dbConfig);

const connectWithRetry = () => {
    connection.connect((err) => {
        if (err) {
            console.error('Database connection failed. Retrying in 5 seconds...', err.message);
            setTimeout(connectWithRetry, 5000);
            return;
        }

        console.log('Database connected successfully');
    });
};

connection.on('error', (err) => {
    console.error('Database connection error:', err.message);

    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
        console.log('Attempting to reconnect to the database...');
        connectWithRetry();
    } else {
        throw err;
    }
});

connectWithRetry();

module.exports = connection;