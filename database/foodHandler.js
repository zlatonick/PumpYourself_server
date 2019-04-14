
/*
 * Module provides functions for processing food requests
 */

exports.getAllFood = getAllFood;
exports.addEating = addEating;
exports.editEating = editEating;
exports.deleteEating = deleteEating;


// Parse the datetime, extract the date and return as string YYYY-MM-DD
function getDay(line) {

    // TODO: Check the date format and rewrite the function

    return line;
}


// Check if two dish objects are equal
function checkDishesEquality(dish1, dish2) {
    return dish1.name == dish2.name &&
        dish1.proteins == dish2.proteins &&
        dish1.fats == dish2.fats &&
        dish1.carbohydrates == dish2.carbohydrates &&
        dish1.calories == dish2.calories;
}


// Get all eatings data of the user
function getAllFood(connection, user_ID, cb) {

    // Selecting all the eatings of the user
    let queryString = "SELECT User_dish_ID, Dishes_eats.Dish_ID AS Dish_ID, Weight, Eating_date, "
        + "Dish_name, Proteins, Fats, Carbohydrates, Calories "
        + "FROM Dishes_eats "
        + "JOIN Dishes ON Dishes_eats.Dish_ID = Dishes.Dish_ID "
        + "WHERE User_ID = ?";

    connection.query(queryString, [user_ID], (err, res) => {

        if (err) cb(err);

        // All days of eating the food
        let foodByDays = {};

        // Information about all eaten dishes
        let allDishes = {};

        for (line of res) {
            
            // Day of eating
            let currDate = getDay(line['Eating_date']);

            // Fact of eating
            let currEating = {id: line['User_dish_ID'],
                              id_food: line['Dish_ID'],
                              weight: line['Weight']};

            // Adding the eating to the array of certain day
            if (foodByDays[currDate] == null) {
                foodByDays[currDate] = [currEating];
            }
            else {
                foodByDays[currDate].push(currEating);
            }

            // Adding the information about the dish
            if (allDishes[line['Dish_ID']] == null) {
                allDishes[line['Dish_ID']] = {name: line['Dish_name'],
                                              proteins: line['Proteins'],
                                              fats: line['Fats'],
                                              carbohydrates: line['Carbohydrates'],
                                              calories: line['Calories']};
            }
        }

        cb(null, {days: foodByDays, dishes: allDishes});
    });
}


// Insert the row into Dishes_eats table
// Callback parameters: id of the new row in Dishes_eats table
function insertIntoDishesEats(connection, user_ID, dish_ID, weight, date, cb) {

    let queryString = "INSERT INTO Dishes_eats(User_ID, Dish_ID, Weight, Eating_date) "
        + "VALUES(?, ?, ?, DATE(?))";
    
    connection.query(queryString, [user_ID, dish_ID, weight, date], (err, res) => {

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
                + "Carbohydrates, Calories) VALUES(?, ?, ?, ?, ?)";

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
// Callback parameters: id of the new row in Dishes_eats table
function addEating(connection, user_id, date, eating, cb) {

    findOrAddDish(connection, eating, (err, dish_id) => {

        if (err) cb(err);        

        insertIntoDishesEats(connection, user_id, dish_id, eating.weight, date, cb);
    });    
}


// Edit the eating (weight of dish)
function editEating(connection, eating_id, eating, cb) {

    findOrAddDish(connection, eating, (err, dish_id) => {

        if (err) cb(err);        

        // Updating the raw in database
        let queryString = "UPDATE dishes_eats SET dish_id = ?, weight = ? "
            + "WHERE user_dish_id = ?";

        connection.query(queryString, [dish_id, eating.weight, eating_id], (err, res) => {

            if (err) cb(err);

            cb();
        });
    }); 
}


// Delete the eating
function deleteEating(connection, eating_id, cb) {

    let queryString = "DELETE FROM dishes_eats WHERE user_dish_id = ?";

    connection.query(queryString, [eating_id], (err, res) => {

        if (err) cb(err);

        cb();
    });
}