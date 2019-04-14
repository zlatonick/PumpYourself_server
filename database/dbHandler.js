
/*
 * Main database module.
 * Provides the connection to database and gives
 * functions to process the queries.
 */

const mysql = require("mysql");

// Sub-modules
const foodHandler = require("./foodHandler.js");
const trainingsHandler = require("./trainingsHandler.js");


// Exporting the interface
exports.getActionByID = getActionByID;
exports.connectToDB = connectToDB;


// Creating the connection to the database
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'health'
});


// Executing the connection
function connectToDB(cb) {
    connection.connect((err) => {
        cb(err, connection.threadId);
    });
}


// All types of database queries
var actions = {
    meal: {
        0: foodHandler.getAllFood,
        1: foodHandler.addEating,
        2: foodHandler.editEating,
        3: foodHandler.deleteEating
    },
    trainings: {
        0: trainingsHandler.getAllPublicTrainings,
        1: trainingsHandler.getAllUserTrainings,
        2: trainingsHandler.createTraining,
        3: trainingsHandler.startTraining,
        4: trainingsHandler.stopTraining
    }
}


// Applying the first argument of the function
function carry(fn, first) {
    return (...args) => fn(first, ...args);
}


// Getting the group and id of action and returning the appropriate function
function getActionByID(group, id) {
    return carry(actions[group][id], connection);
}


// TODO: Move to another (registration) module
// Adding the new user
// Callback parameters: error, id_of_new_user
function addUser(userName, cb) {

    // Checking if the user name already exists
    let queryString = "SELECT COUNT(*) AS quan FROM Users WHERE User_name = ?";

    connection.query(queryString, [userName], (err, res) => {

        if (err) {
            cb(err);
        }

        if (res[0].quan > 0) {
            cb("User name already exists");
        }
        else {
            
            // Inserting the new user
            let insertUserQuery = 'INSERT INTO Users SET ?';

            connection.query(insertUserQuery, {user_name: userName}, (err, resIn) => {
                
                if (err) {
                    cb(err);
                }

                cb(null, resIn.insertId);
            });
        }
    });
}