
/*
 * Module provides functions for processing group requests
 */

const images = require('./dbImagesHandler.js');
const asyncQueueFactory = require('../asyncQueue.js');

exports.getAllUserGroups = getAllUserGroups;
exports.getMoreGroupInfo = getMoreGroupInfo;
exports.addGroup = addGroup;
exports.editGroup = editGroup;
exports.inviteFriendIntoGroup = inviteFriendIntoGroup;
exports.leaveTheGroup = leaveTheGroup;


function getAllUserGroups(connection, params, cb) {

    let queryString = "SELECT Groups_users.Group_ID AS Group_ID, Group_name, Group_description "
        + "FROM Groups_users "
        + "JOIN Training_groups ON Groups_users.Group_ID = Training_groups.Group_ID "
        + "WHERE User_ID = ?";

    connection.query(queryString, [params.user_id], (err, res) => {

        if (err) cb(err);

        cb(null, res);

        // // Initializing an asynchronous queue (for photos)
        // let queue = asyncQueueFactory.createQueue();

        // let result = {}

        // for (line of res) {

        //     let group_id = line['Group_id'];

        //     result[group_id] = {
        //         name: line['Group_name'],
        //         description: line['Group_description']
        //     }

        //     // Loading the photo
        //     queue.addTask({
        //         action: images.getImage,
        //         args: ['groups', group_id],
        //         callback: (err, res, image_id) => {
        //             if (err) cb(err);
        //             result[image_id].photo = res;
        //         }
        //     });
        // }
        // queue.addTask({
        //     action: cb,
        //     args: [null, result]
        // });
    });
}


function getMoreGroupInfo(connection, params, cb) {

    let queryString = "SELECT Start_date, "
        + "Trainings.Training_ID AS Training_ID, Training_name, "
        + "Training_description, Day_number, Day_plan, "
        + "Groups_users.User_ID AS User_ID, User_name FROM Training_groups "
        + "JOIN Trainings ON Trainings.Training_ID = Training_groups.Training_ID "
        + "JOIN Trainings_days ON Trainings_days.Training_ID = Training_groups.Training_ID "
        + "JOIN Groups_users ON Training_groups.Group_ID = Groups_users.Group_ID "
        + "JOIN Users ON Groups_users.User_ID = Users.User_ID "
        + "WHERE Groups_users.Group_ID = ?";

    connection.query(queryString, [params.group_id], (err, res) => {

        if (err) cb(err);

        let result = {
            Members: [],
            Training: []
        }

        for (line of res) {

            // Adding new day, if not already
            if (result.Training.every(val =>
                val.Day_number != line['Day_number'])) {
                    result.Training.push({
                        Training_ID: line['Training_ID'],
                        Start_date: line['Start_date'],
                        Day_number: line['Day_number'],
                        Day_plan: line['Day_plan']
                    });
            }

            // Adding new member, if not already
            if (result.Members.every(val =>
                val.User_ID != line['User_ID'])) {
                    result.Members.push({
                        User_ID: line['User_ID'],
                        User_name: line['User_name']
                    });
            }
        }

        cb(null, result)
    });
}


// Adding with training_id. Needs to add training first
function addGroup(connection, params, cb) {

    // Adding the group
    let queryString = "INSERT INTO Training_groups(Group_name, Group_description, "
        + "Training_id, Start_date) VALUES(?, ?, ?, ?)";

    connection.query(queryString, [params.group_name, params.description, params.training_id,
        params.start_date], (err, res) => {

        if (err) cb(err);

        let group_id = res.insertId;

        // Adding the user to group
        let queryString = "INSERT INTO Groups_users(User_id, Group_id) VALUES(?, ?)";

        connection.query(queryString, [params.user_id, group_id], (err, res) => {

            if (err) cb(err);

            // Processing the photo
            if (params.photo) {            
                images.saveImage('groups', group_id, params.photo, (err) => {
                    cb(err, group_id);
                });
            }
            else {            
                images.createStandardImage('groups', group_id, (err) => {
                    cb(err, group_id);
                });
            }
        });
    });
}


// Edit group parameters (no training parameters)
function editGroup(connection, params, cb) {

    let queryString = "UPDATE Training_groups SET Group_name = ?, Group_description = ? "
        + "WHERE Group_id = ?";

    connection.query(queryString, [params.name, params.description, params.group_id],
        (err, res) => {

        if (err) cb(err);

        // Processing the photo
        if (params.photo) {            
            images.saveImage('groups', params.group_id, params.photo, (err) => {
                cb(err);
            });
        }
        else {
            cb();
        }
    });
}


function inviteFriendIntoGroup(connection, params, cb) {

    let queryString = "INSERT INTO Groups_requests(User_id_from, User_id_to, "
        + "Group_id) VALUES(?, ?, ?)";

    connection.query(queryString, [params.user_id, params.friend_id, params.group_id], (err) => {
        cb(err);      // Without the result
    });
}


function leaveTheGroup(connection, params, cb) {

    let queryString = "DELETE FROM Groups_users WHERE User_id = ? AND Group_id = ?";

    connection.query(queryString, [params.user_id, params.group_id], (err) => {
        cb(err);
    });
}