
/*
 * Main database module.
 * Provides the connection to database and gives
 * functions to process the queries.
 */

const mysql = require("mysql");

// Sub-modules
const foodHandler = require("./foodHandler.js");
const trainingsHandler = require("./trainingsHandler.js");
const groupsHandler = require("./groupsHandler.js");
const profileHandler = require("./profileHandler.js");


// Exporting the interface
exports.getActionByID = getActionByID;
exports.connectToDB = connectToDB;


// Creating the connection to the database
var connection = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_NAME
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
    },
    profile: {
        0: profileHandler.getProfileInfo,
        1: profileHandler.getFriendInfo,
        2: profileHandler.searchUser,
        3: profileHandler.addNewUser,
        4: profileHandler.changeProfileInfo,
        5: profileHandler.acceptGroupRequest,
        6: profileHandler.declineGroupRequest,
        7: profileHandler.acceptFriendRequest,
        8: profileHandler.declineFriendRequest,
        9: profileHandler.sendFriendRequest,
        10: profileHandler.removeFriend,
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