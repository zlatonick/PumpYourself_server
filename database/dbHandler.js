
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
/*var connection = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_NAME
});*/
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
        0: trainingsHandler.getAllUserTrainings,
        1: trainingsHandler.getAllPublicTrainings,
        2: trainingsHandler.createTraining,
        3: trainingsHandler.startTraining,
        4: trainingsHandler.stopTraining
    },
    groups: {
        0: groupsHandler.getAllUserGroups,
        1: groupsHandler.getMoreGroupInfo,
        2: groupsHandler.addGroup,
        3: groupsHandler.editGroup,
        4: groupsHandler.inviteFriendIntoGroup,
        5: groupsHandler.leaveTheGroup
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
        10: profileHandler.removeFriend
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