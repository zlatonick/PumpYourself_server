
/*
 * Module provides functions for processing food requests
 */

// TODO: Standard food

const images = require('./dbImagesHandler.js');
const asyncQueueFactory = require('../asyncQueue.js');

exports.getAllFood = getAllFood;
exports.addEating = addEating;
exports.editEating = editEating;
exports.deleteEating = deleteEating;


// Parse the datetime, extract the date and return as string YYYY-MM-DD
function getDay(date) {
    return date.toISOString().substring(0, 10);
}

// Parse the datetime and return as string YYYY-MM-DDTHH:MM:SS
function getDateTime(date) {
    return date.toISOString().substring(0, 19);
}


// Check if two dish objects are equal
function checkDishesEquality(dish1, dish2) {
    return dish1.name == dish2.name &&
        dish1.proteins == dish2.proteins &&
        dish1.fats == dish2.fats &&
        dish1.carbohydrates == dish2.carbohydrates &&
        dish1.calories == dish2.calories;
}


// Get all eatings data of the user for the period (including borders)
// date: YYYY-MM-DDTHH:MM:SS
function getAllFood(connection, user_ID, start_date, end_date, cb) {

    // Selecting all the eatings of the user
    let queryString = "SELECT User_dish_ID, Dishes_eats.Dish_ID AS Dish_ID, Weight, Eating_date, "
        + "Photo_ID, Dish_name, Proteins, Fats, Carbohydrates, Calories "
        + "FROM Dishes_eats "
        + "JOIN Dishes ON Dishes_eats.Dish_ID = Dishes.Dish_ID "
        + "WHERE User_ID = ? AND Eating_date BETWEEN DATE(?) AND DATE(?)";

    connection.query(queryString, [user_ID, start_date, end_date], (err, res) => {

        if (err) cb(err);

        // All days of eating the food
        let foodByDays = {};

        // Information about all eaten dishes
        let allDishes = {};

        // All photos
        let allPhotos = {};

        for (line of res) {
            
            // Day of eating
            let currDate = getDay(line['Eating_date']);

            // Fact of eating
            let currEating = {id: line['User_dish_ID'],
                              id_food: line['Dish_ID'],
                              id_photo: line['Photo_ID'],
                              date_time: getDateTime(line['Eating_date']),
                              weight: line['Weight']};

            // Adding the eating to the array of certain day
            if (foodByDays[currDate] == null) {
                foodByDays[currDate] = [currEating];
            }
            else {
                foodByDays[currDate].push(currEating);
            }

            // Adding the photo id
            allPhotos[line['Photo_ID']] = -1;

            // Adding the information about the dish
            if (allDishes[line['Dish_ID']] == null) {
                allDishes[line['Dish_ID']] = {name: line['Dish_name'],
                                              proteins: line['Proteins'],
                                              fats: line['Fats'],
                                              carbohydrates: line['Carbohydrates'],
                                              calories: line['Calories']};
            }
        }

        // Adding the photos of dishes
        let asyncQueue = asyncQueueFactory.createQueue();

        for (photoId in allPhotos) {
            asyncQueue.addTask({
                action: images.getImage,
                args: ['dishes', photoId],
                callback: (err, res, image_id) => {
                    if (err) cb(err);
                    allPhotos[image_id] = res;
                }
            });
        }

        // Adding the callback
        asyncQueue.addTask({
            action: cb,
            args: [null, {days: foodByDays, dishes: allDishes, photos: allPhotos}]
        });
    });
}


// Select all the food that is public
// Returns an array of dish ids
function getAllPublicFood(connection, cb) {

    let queryString = "SELECT Dish_ID FROM Dishes WHERE Is_public = 1";

    connection.query(queryString, [user_ID], (err, res) => {

        if (err) cb(err);

        let resultArray = [];

        for (line of res) {
            resultArray.push(line['Dish_ID']);
        }

        cb(null, resultArray);
    });
}


// Insert the row into Dishes_eats table
// Callback parameters: id of the new row in Dishes_eats table
function insertIntoDishesEats(connection, user_ID, dish_ID, weight, date, photo_ID, cb) {

    let queryString = "INSERT INTO Dishes_eats(User_ID, Dish_ID, Weight, Eating_date, Photo_ID) "
        + "VALUES(?, ?, ?, DATE(?), ?)";
    
    connection.query(queryString, [user_ID, dish_ID, weight, date, photo_ID], (err, res) => {

        if (err) cb(err);

        cb(null, res.insertId);
    });
}


// Find the id of dish. If there is no such dish, insert it
function findOrAddDish(connection, dish, cb) {

    // Checking if the dish already exists
    let queryString = "SELECT * FROM Dishes WHERE Dish_name = ?";

    connection.query(queryString, [dish.name], (err, res) => {

        if (err) cb(err);

        let dish_id = "";

        // Trying to find an existing dish
        for (line of res) {
            
            let currDish = {name: line['Dish_name'],
                            proteins: line['Proteins'],
                            fats: line['Fats'],
                            carbohydrates: line['Carbohydrates'],
                            calories: line['Calories']}

            if (checkDishesEquality(dish, currDish)) {
                dish_id = line['Dish_ID'];
                break;
            }
        }

        if (dish_id == "") {
            
            // Creating the new dish
            let insertQuery = "INSERT INTO Dishes(Dish_name, Proteins, Fats, "
                + "Carbohydrates, Calories, Is_public) VALUES(?, ?, ?, ?, ?, 0)";

            connection.query(insertQuery, [dish.name, dish.proteins,
                dish.fats, dish.carbohydrates, dish.calories],
                (err, resIn) => {

                if (err) cb(err);

                cb(null, resIn.insertId);
            });
        }
        else {
            cb(null, dish_id);
        }
    });
}


// Add the eating of the user
// If the standard eating used, eating.photo can be null
// Callback parameters: id of the new row in Dishes_eats table
function addEating(connection, user_id, date, eating, cb) {

    findOrAddDish(connection, eating, (err, dish_id) => {

        if (err) cb(err);

        // Processing the photo
        if (eating.photo) {

            let photo_id = user_id + '_' + getDay(Date(date));

            images.saveImage('dishes', photo_id, eating.photo, (err) => {

                if (err) cb(err);

                insertIntoDishesEats(connection, user_id, dish_id,
                    eating.weight, date, photo_id, cb);
            });
        }
        else {
            // Photo_id is equal to dish_id
            insertIntoDishesEats(connection, user_id, dish_id,
                eating.weight, date, '' + dish_id, cb);
        }
    });    
}


// Edit the eating (weight of dish)
function editEating(connection, user_id, eating_id, date, eating, cb) {

    findOrAddDish(connection, eating, (err, dish_id) => {

        if (err) cb(err);     

        // Updating the photo
        if (eating.photo) {

            let photo_id = user_id + '_' + getDay(Date(date));

            images.saveImage('dishes', photo_id, eating.photo, (err) => {

                if (err) cb(err);
                
                // Updating the raw in database
                let queryString = "UPDATE dishes_eats SET dish_id = ?, weight = ?, photo_ID = ? "
                    + "WHERE user_dish_id = ?";
    
                connection.query(queryString, [dish_id, eating.weight, photo_id, eating_id],
                    (err) => {
                    cb(err);
                });
            });
        }
        else {
            // Updating the raw in database
            let queryString = "UPDATE dishes_eats SET dish_id = ?, weight = ? "
                + "WHERE user_dish_id = ?";

            connection.query(queryString, [dish_id, eating.weight, eating_id], (err) => {
                cb(err);
            });
        }          
    });
}


// Delete the eating
function deleteEating(connection, eating_id, cb) {

    let queryString = "DELETE FROM dishes_eats WHERE user_dish_id = ?";

    connection.query(queryString, [eating_id], (err) => {

        if (err) cb(err);

        cb();
    });
}