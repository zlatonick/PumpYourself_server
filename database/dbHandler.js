
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
const imagesHandler = require("./dbImagesHandler.js");


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
        getallfood: foodHandler.getAllFood,
        addeating: foodHandler.addEating,
        editeating: foodHandler.editEating,
        deleteeating: foodHandler.deleteEating
    },
    trainings: {
        getallusertrainings: trainingsHandler.getAllUserTrainings,
        getallpublictrainings: trainingsHandler.getAllPublicTrainings,
        createtraining: trainingsHandler.createTraining,
        starttraining: trainingsHandler.startTraining,
        stoptraining: trainingsHandler.stopTraining
    },
    groups: {
        getallusergroups: groupsHandler.getAllUserGroups,
        getmoregroupinfo: groupsHandler.getMoreGroupInfo,
        addgroup: groupsHandler.addGroup,
        editgroup: groupsHandler.editGroup,
        invitefriendintogroup: groupsHandler.inviteFriendIntoGroup,
        leavethegroup: groupsHandler.leaveTheGroup
    },
    profile: {
        getprofileinfo: profileHandler.getProfileInfo,
        getfriendinfo: profileHandler.getFriendInfo,
        searchuser: profileHandler.searchUser,
        addnewuser: profileHandler.addNewUser,
        changeprofileinfo: profileHandler.changeProfileInfo,
        acceptgrouprequest: profileHandler.acceptGroupRequest,
        declinegrouprequest: profileHandler.declineGroupRequest,
        acceptfriendrequest: profileHandler.acceptFriendRequest,
        declinefriendrequest: profileHandler.declineFriendRequest,
        sendfriendrequest: profileHandler.sendFriendRequest,
        removefriend: profileHandler.removeFriend,
        login: profileHandler.login
    }
}


// Applying the first argument of the function
function carry(fn, first) {
    return (...args) => fn(first, ...args);
}


// Getting the group and id of action and returning the appropriate function
function getActionByID(group, action) {
    if (group == 'images') {
        return carry(imagesHandler.getImageQuery, action);
    }
    if (actions[group] != null && actions[group][action] != null) {
        return carry(actions[group][action], connection);
    }
    return null;
}