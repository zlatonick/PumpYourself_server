
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
function getAllUserTrainings(connection, params, cb) {

    let queryString = "SELECT Start_date, "
        + "Trainings.Training_ID AS Training_ID, Training_name, "
        + "Training_description, Day_number, Day_plan FROM Trainings_days "
        + "JOIN Trainings ON Trainings.Training_ID = Trainings_days.Training_ID "
        + "JOIN Trainings_users ON Trainings.Training_ID = Trainings_users.Training_ID "
        + "WHERE User_ID = ?";

    connection.query(queryString, [params.user_id], (err, res) => {

        if (err) cb(err);

        cb(null, res);

        // let result = {}

        // for (line of res) {

        //     let currTrainingId = line['Training_id'];

        //     if (result[currTrainingId]) {
        //         result[currTrainingId].days.push({
        //             day_number: line['Day_number'],
        //             day_plan: line['Day_plan']
        //         });
        //     }
        //     else {
        //         result[currTrainingId] = {
        //             name: line['Training_name'],
        //             description: line['Training_description'],
        //             start_date: dates.getDay(line['Start_date']),
        //             days: [{
        //                 day_number: line['Day_number'],
        //                 day_plan: line['Day_plan']
        //             }]
        //         };
        //     }
        // }
        // cb(null, result);
    });
}


// Get trainings, that are available to all users
function getAllPublicTrainings(connection, params, cb) {

    let queryString = "SELECT Trainings.Training_ID AS Training_ID, Training_name, "
        + "Training_description, Day_number, Day_plan FROM Trainings_days "
        + "JOIN Trainings ON Trainings.Training_ID = Trainings_days.Training_ID "
        + "WHERE Trainings.Is_public = 1";

    connection.query(queryString, (err, res) => {
        
        if (err) cb(err);
        
        cb(null, res);

        // // All public trainings
        // let trainings = {};

        // for (line of res) {

        //     let currTrainingId = line['Training_id'];

        //     // Adding the day to the training
        //     if (trainings[currTrainingId]) {
        //         trainings[currTrainingId].days.push({
        //             day_number: line['Day_number'],
        //             day_plan: line['Day_plan']
        //         });
        //     }
        //     else {
        //         // Creating the training and adding the day
        //         trainings[currTrainingId] = {
        //             name: line['Training_name'],
        //             description: line['Training_description'],
        //             days: [{
        //                 day_number: line['Day_number'],
        //                 day_plan: line['Day_plan']
        //             }]
        //         };
        //     }
        // }

        // cb(null, trainings);
    });
}


// Add new training to the database
function createTraining(connection, training, cb) {

    let queryString = "INSERT INTO Trainings(Training_name, Training_description, "
        + "Is_public) VALUES(?, ?, 0)";

    connection.query(queryString, [training[0].training_name, training[0].training_description],
        (err, res) => {

        if (err) cb(err);

        let newTrainingId = res.insertId;

        // Creating the asynchronous queue and putting there all the insert queries
        let asyncQueue = asyncQueueFactory.createQueue();

        for (day of training) {

            let queryString = "INSERT INTO Trainings_days(Training_ID, Day_number, Day_plan) "
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
function startTraining(connection, params, cb) {

    let queryString = "INSERT INTO Trainings_users(User_ID, Training_ID, Start_date) "
        + "VALUES(?, ?, ?)";

    connection.query(queryString, [params.user_id, params.training_id, params.date],
        (err) => {
        cb(err);
    });
}


// Stop the training plan
function stopTraining(connection, params, cb) {

    let queryString = "DELETE FROM Trainings_users WHERE User_ID = ? AND Training_ID = ?";

    connection.query(queryString, [params.user_id, params.training_id], (err) => {
        cb(err);
    });
}