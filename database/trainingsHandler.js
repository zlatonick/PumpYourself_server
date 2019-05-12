
/*
 * Module provides functions for processing training requests
 */

const dates = require('./dateHandler.js');
const asyncQueueFactory = require('../asyncQueue.js');

exports.getAllUserTrainings = getAllUserTrainings;
exports.getAllPublicTrainings = getAllPublicTrainings;
exports.createTraining = createTraining;
exports.startTraining = startTraining;
exports.stopTraining = stopTraining;


// Get all trainings of the user
function getAllUserTrainings(connection, user_id, cb) {

    let queryString = "SELECT start_date, "
        + "trainings.training_id AS training_id, training_name, "
        + "training_description, day_number, day_plan FROM trainings_days "
        + "JOIN trainings ON trainings.training_id = trainings_days.training_id "
        + "JOIN trainings_users ON trainings.training_id = trainings_users.training_id "
        + "WHERE user_id = ?";

    connection.query(queryString, [user_id], (err, res) => {

        if (err) cb(err);

        let result = {}

        for (line of res) {

            let currTrainingId = line['training_id'];

            if (result[currTrainingId]) {
                result[currTrainingId].days.push({
                    day_number: line['day_number'],
                    day_plan: line['day_plan']
                });
            }
            else {
                result[currTrainingId] = {
                    name: line['training_name'],
                    description: line['training_description'],
                    start_date: dates.getDay(line['start_date']),
                    days: [{
                        day_number: line['day_number'],
                        day_plan: line['day_plan']
                    }]
                };
            }
        }
        cb(null, result);
    });
}


// Get trainings, that are available to all users
function getAllPublicTrainings(connection, cb) {

    let queryString = "SELECT trainings.training_id AS training_id, training_name, "
        + "training_description, day_number, day_plan FROM trainings_days "
        + "JOIN trainings ON trainings.training_id = trainings_days.training_id "
        + "WHERE trainings.is_public = 1";

    connection.query(queryString, (err, res) => {
        
        if (err) cb(err);

        // All public trainings
        let trainings = {};

        for (line of res) {

            let currTrainingId = line['training_id'];

            // Adding the day to the training
            if (trainings[currTrainingId]) {
                trainings[currTrainingId].days.push({
                    day_number: line['day_number'],
                    day_plan: line['day_plan']
                });
            }
            else {
                // Creating the training and adding the day
                trainings[currTrainingId] = {
                    name: line['training_name'],
                    description: line['training_description'],
                    days: [{
                        day_number: line['day_number'],
                        day_plan: line['day_plan']
                    }]
                };
            }
        }

        cb(null, trainings);
    });
}


// Add new training to the database
function createTraining(connection, training, cb) {

    let queryString = "INSERT INTO trainings(training_name, training_description, "
        + "is_public) VALUES(?, ?, 0)";

    connection.query(queryString, [training.name, training.description], (err, res) => {

        if (err) cb(err);

        let newTrainingId = res.insertId;

        // Creating the asynchronous queue and putting there all the insert queries
        let asyncQueue = asyncQueueFactory.createQueue();

        for (day of training.days) {

            let queryString = "INSERT INTO trainings_days(training_id, day_number, day_plan) "
                + "VALUES(?, ?, ?)";

            asyncQueue.addTask({
                action: (...args) => { connection.query(...args) },
                args: [queryString, [newTrainingId, day.day_number, day.day_plan]],
                callback: (err) => { if (err) cb(err); }
            });
        }

        // Adding the callback to the queue
        asyncQueue.addTask({
            action: cb,
            args: [null, newTrainingId]
        });
    });
}


// Subscribe on the training
function startTraining(connection, user_id, training_id, date, cb) {

    let queryString = "INSERT INTO trainings_users(user_id, training_id, start_date) "
        + "VALUES(?, ?, ?)";

    connection.query(queryString, [user_id, training_id, date], (err) => {
        cb(err);
    });
}


// Stop the training plan
function stopTraining(connection, user_id, training_id, cb) {

    let queryString = "DELETE FROM trainings_users WHERE user_id = ? AND training_id = ?";

    connection.query(queryString, [user_id, training_id], (err) => {
        cb(err);
    });
}