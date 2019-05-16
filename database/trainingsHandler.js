
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

    let queryString = "SELECT Start_date, "
        + "Trainings.Training_id AS Training_id, Training_name, "
        + "Training_description, Day_number, Day_plan FROM Trainings_days "
        + "JOIN Trainings ON Trainings.Training_id = Trainings_days.Training_id "
        + "JOIN Trainings_users ON Trainings.Training_id = Trainings_users.Training_id "
        + "WHERE User_id = ?";

    connection.query(queryString, [user_id], (err, res) => {

        if (err) cb(err);

        let result = {}

        for (line of res) {

            let currTrainingId = line['Training_id'];

            if (result[currTrainingId]) {
                result[currTrainingId].days.push({
                    day_number: line['Day_number'],
                    day_plan: line['Day_plan']
                });
            }
            else {
                result[currTrainingId] = {
                    name: line['Training_name'],
                    description: line['Training_description'],
                    start_date: dates.getDay(line['Start_date']),
                    days: [{
                        day_number: line['Day_number'],
                        day_plan: line['Day_plan']
                    }]
                };
            }
        }
        cb(null, result);
    });
}


// Get trainings, that are available to all users
function getAllPublicTrainings(connection, cb) {

    let queryString = "SELECT Trainings.Training_id AS Training_id, Training_name, "
        + "Training_description, Day_number, Day_plan FROM Trainings_days "
        + "JOIN Trainings ON Trainings.Training_id = Trainings_days.Training_id "
        + "WHERE Trainings.Is_public = 1";

    connection.query(queryString, (err, res) => {
        
        if (err) cb(err);

        // All public trainings
        let trainings = {};

        for (line of res) {

            let currTrainingId = line['Training_id'];

            // Adding the day to the training
            if (trainings[currTrainingId]) {
                trainings[currTrainingId].days.push({
                    day_number: line['Day_number'],
                    day_plan: line['Day_plan']
                });
            }
            else {
                // Creating the training and adding the day
                trainings[currTrainingId] = {
                    name: line['Training_name'],
                    description: line['Training_description'],
                    days: [{
                        day_number: line['Day_number'],
                        day_plan: line['Day_plan']
                    }]
                };
            }
        }

        cb(null, trainings);
    });
}


// Add new training to the database
function createTraining(connection, training, cb) {

    let queryString = "INSERT INTO Trainings(Training_name, Training_description, "
        + "Is_public) VALUES(?, ?, 0)";

    connection.query(queryString, [training.name, training.description], (err, res) => {

        if (err) cb(err);

        let newTrainingId = res.insertId;

        // Creating the asynchronous queue and putting there all the insert queries
        let asyncQueue = asyncQueueFactory.createQueue();

        for (day of training.days) {

            let queryString = "INSERT INTO Trainings_days(Training_id, Day_number, Day_plan) "
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

    let queryString = "INSERT INTO Trainings_users(User_id, Training_id, Start_date) "
        + "VALUES(?, ?, ?)";

    connection.query(queryString, [user_id, training_id, date], (err) => {
        cb(err);
    });
}


// Stop the training plan
function stopTraining(connection, user_id, training_id, cb) {

    let queryString = "DELETE FROM Trainings_users WHERE User_id = ? AND Training_id = ?";

    connection.query(queryString, [user_id, training_id], (err) => {
        cb(err);
    });
}