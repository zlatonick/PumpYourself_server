
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

    let queryString = "SELECT groups_users.group_id AS group_id, "
        + "group_name, group_description FROM groups_users "
        + "JOIN training_groups ON groups_users.group_id = training_groups.group_id "
        + "WHERE user_id = ?";

    connection.query(queryString, [user_id], (err, res) => {

        if (err) cb(err);

        // Initializing an asynchronous queue (for photos)
        let queue = asyncQueueFactory.createQueue();

        let result = {}

        for (line of res) {

            let group_id = line['group_id'];

            result[group_id] = {
                name: line['group_name'],
                description: line['group_description']
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

    let queryString = "SELECT group_name, group_description, start_date, "
        + "trainings.training_id AS training_id, training_name, "
        + "training_description, day_number, day_plan, "
        + "groups_users.user_id AS user_id, user_name FROM training_groups "
        + "JOIN trainings ON trainings.training_id = training_groups.training_id "
        + "JOIN trainings_days ON trainings_days.training_id = training_groups.training_id "
        + "JOIN groups_users ON training_groups.group_id = groups_users.group_id "
        + "JOIN users ON groups_users.user_id = users.user_id "
        + "WHERE groups_users.group_id = ?";

    connection.query(queryString, [group_id], (err, res) => {

        if (err) cb(err);

        // Initializing an asynchronous queue (for photos)
        let queue = asyncQueueFactory.createQueue();

        let result = {
            members: {},
            training: {
                training_id: res[0]['training_id'],
                start_date: res[0]['start_date'],
                days: []
            }
        }

        for (line of res) {

            // Adding new day, if not already
            if (result.training.days.every(val =>
                val.day_number != line['day_number'])) {
                    result.training.days.push({
                        day_number: line['day_number'],
                        day_plan: line['day_plan']
                    });
            }

            // Adding new member, if not already
            if (!result.members[line['user_id']]) {
                    result.members[line['user_id']] = {
                        user_name: line['user_name']
                    };

                    // Loading the photo
                    queue.addTask({
                        action: images.getImage,
                        args: ['users', line['user_id']],
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
    let queryString = "INSERT INTO training_groups(Group_name, Group_description, "
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