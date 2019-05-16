
/*
 * Module that creates the database and fills it with initial information
 */

const mysql = require("mysql");
const fs = require('fs');

// Creating the connection to the database
var connection = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASS,
    multipleStatements: true
});


connection.connect((err) => {

    if (err) {
        console.log('Error while connecting to database: ' + err);
        return;
    }

    // Reading the SQL script
    fs.readFile('./database/create.sql', 'utf-8', (err, data) => {

        if (err) {
            console.log('Error while reading the SQL file: ' + err);
            return;
        }

        // Running the script
        connection.query(data, (err) => {

            if (err) {
                console.log('Error while executing the SQL script: ' + err);
                return;
            }

            console.log('Database was created successfully');
            return;
        });
    });
});