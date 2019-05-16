
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


function getAllUserGroups(connection, user_id, cb) {

    let queryString = "SELECT Groups_users.Group_id AS Group_id, "
        + "Group_name, Group_description FROM Groups_users "
        + "JOIN Training_groups ON Groups_users.Group_id = Training_groups.Group_id "
        + "WHERE User_id = ?";

    connection.query(queryString, [user_id], (err, res) => {

        if (err) cb(err);

        // Initializing an asynchronous queue (for photos)
        let queue = asyncQueueFactory.createQueue();

        let result = {}

        for (line of res) {

            let group_id = line['Group_id'];

            result[group_id] = {
                name: line['Group_name'],
                description: line['Group_description']
            }

            // Loading the photo
            queue.addTask({
                action: images.getImage,
                args: ['groups', group_id],
                callback: (err, res, image_id) => {
                    if (err) cb(err);
                    result[image_id].photo = res;
                }
            });
        }
        queue.addTask({
            action: cb,
            args: [null, result]
        });
    });
}


function getMoreGroupInfo(connection, group_id, cb) {

    let queryString = "SELECT Group_name, Group_description, Start_date, "
        + "Trainings.Training_id AS Training_id, Training_name, "
        + "Training_description, Day_number, Day_plan, "
        + "Groups_users.User_id AS User_id, User_name FROM Training_groups "
        + "JOIN Trainings ON Trainings.Training_id = Training_groups.Training_id "
        + "JOIN Trainings_days ON Trainings_days.Training_id = Training_groups.Training_id "
        + "JOIN Groups_users ON Training_groups.Group_id = Groups_users.Group_id "
        + "JOIN Users ON Groups_users.User_id = Users.User_id "
        + "WHERE Groups_users.Group_id = ?";

    connection.query(queryString, [group_id], (err, res) => {

        if (err) cb(err);

        // Initializing an asynchronous queue (for photos)
        let queue = asyncQueueFactory.createQueue();

        let result = {
            members: {},
            training: {
                training_id: res[0]['Training_id'],
                start_date: res[0]['Start_date'],
                days: []
            }
        }

        for (line of res) {

            // Adding new day, if not already
            if (result.training.days.every(val =>
                val.day_number != line['Day_number'])) {
                    result.training.days.push({
                        day_number: line['Day_number'],
                        day_plan: line['Day_plan']
                    });
            }

            // Adding new member, if not already
            if (!result.members[line['User_id']]) {
                    result.members[line['User_id']] = {
                        user_name: line['User_name']
                    };

                    // Loading the photo
                    queue.addTask({
                        action: images.getImage,
                        args: ['users', line['User_id']],
                        callback: (err, res, image_id) => {
                            if (err) cb(err);
                            result.members[image_id].photo = res;
                        }
                    });
            }
        }
        queue.addTask({
            action: cb,
            args: [null, result]
        });
    });
}


// Adding with training_id. Needs to add training first
function addGroup(connection, user_id, group, cb) {

    // Adding the group
    let queryString = "INSERT INTO Training_groups(Group_name, Group_description, "
        + "Training_id, Start_date) VALUES(?, ?, ?, ?)";

    connection.query(queryString, [group.name, group.description, group.training_id,
        group.start_date], (err, res) => {

        if (err) cb(err);

        let group_id = res.insertId;

        // Adding the user to group
        let queryString = "INSERT INTO Groups_users(User_id, Group_id) VALUES(?, ?)";

        connection.query(queryString, [user_id, group_id], (err, res) => {

            if (err) cb(err);

            // Processing the photo
            if (group.photo) {            
                images.saveImage('groups', group_id, group.photo, (err) => {
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
function editGroup(connection, group_id, group_info, cb) {

    let queryString = "UPDATE Training_groups SET Group_name = ?, Group_description = ? "
        + "WHERE Group_id = ?";

    connection.query(queryString, [group_info.name, group_info.description, group_id],
        (err, res) => {

        if (err) cb(err);

        // Processing the photo
        if (group_info.photo) {            
            images.saveImage('groups', group_id, group_info.photo, (err) => {
                cb(err);
            });
        }
        else {
            cb();
        }
    });
}


function inviteFriendIntoGroup(connection, user_id, friend_id, group_id, cb) {

    let queryString = "INSERT INTO Groups_requests(User_id_from, User_id_to, "
        + "Group_id) VALUES(?, ?, ?)";

    connection.query(queryString, [user_id, friend_id, group_id], (err) => {
        cb(err);      // Without the result
    });
}


function leaveTheGroup(connection, user_id, group_id, cb) {

    let queryString = "DELETE FROM Groups_users WHERE User_id = ? AND Group_id = ?";

    connection.query(queryString, [user_id, group_id], (err) => {
        cb(err);
    });
}