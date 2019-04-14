

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


function addGroup(connection, user_id, group_name, training_id, cb) {

    let queryString = "INSERT INTO training_groups()"
}