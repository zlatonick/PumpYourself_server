
/*
 * Module provides functions for processing group requests
 */

exports.getAllGroups = getAllGroups;
exports.addGroup = addGroup;
exports.inviteFriendIntoGroup = inviteFriendIntoGroup;
exports.leaveTheGroup = leaveTheGroup;

function getAllGroups(connection, user_id, cb) {

    let queryString = "SELECT user_group_id, groups_users.group_id AS group_id, "
        + "group_name, days_completed, "
        + "trainings.training_id AS training_id, training_name, "
        + "training_description, day_number, day_plan FROM trainings_days "
        + "JOIN trainings ON trainings.training_id = trainings_days.training_id "
        + "JOIN training_groups ON trainings.training_id = training_groups.training_id "
        + "JOIN groups_users ON training_groups.group_id = groups_users.group_id "
        + "WHERE user_id = ?";

    connection.query(queryString, [user_id], (err, res) => {

        if (err) cb(err);

        let result = {}

        for (line of res) {

            let currUserGroupId = line['user_group_id'];

            if (result[currUserGroupId]) {
                result[currUserGroupId].training.days.push({
                    day_number: line['day_number'],
                    day_plan: line['day_plan']
                });
            }
            else {
                result[currUserGroupId] = {
                    group_id: line['group_id'],
                    name: line['group_name'],
                    training: {
                        id: line['training_id'],
                        name: line['training_name'],
                        description: line['training_description'],
                        days: [{
                            day_number: line['day_number'],
                            day_plan: line['day_plan']
                        }]
                    },
                    days_completed: line['days_completed']
                };
            }
        }
        cb(null, result);
    });
}


// Adding with training_id. Needs to add training first
function addGroup(connection, user_id, group_name, training_id, cb) {

    // Adding the group
    let queryString = "INSERT INTO training_groups(Group_name, Training_id) VALUES(?, ?)";

    connection.query(queryString, [group_name, training_id], (err, res) => {

        if (err) cb(err);

        // Adding the user to group
        let queryString = "INSERT INTO Groups_users(User_id, Group_id) VALUES(?, ?)";

        connection.query(queryString, [user_id, res.insertId], (err, res) => {
            cb(err, res.insertId);
        });
    });
}


// Edit group parameters (no training parameters)
// group - {group_id, new_name, new_photo}
function editGroup(connection, group, cb) {

    let queryString = "UPDATE Training_groups SET Group_name = ?, Group_photo = ? "
        + "WHERE Group_id = ?";

    connection.query(queryString, [group.new_name, group.new_photo, group.group_id],
        (err, res) => {
        cb(err, null);      // Without the result
    });
}


function inviteFriendIntoGroup(connection, user_id, friend_id, group_id, cb) {

    let queryString = "INSERT INTO Groups_requests(User_id_from, User_id_to, "
        + "Group_id) VALUES(?, ?, ?)";

    connection.query(queryString, [user_id, friend_id, group_id], (err, res) => {
        cb(err, null);      // Without the result
    });
}


function leaveTheGroup(connection, user_group_id, cb) {

    let queryString = "DELETE FROM Groups_users WHERE User_group_id = ?";

    connection.query(queryString, [user_group_id], (err, res) => {
        cd(err, null);
    });
}