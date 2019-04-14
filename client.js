
// Debug module. Is used for tests

const http = require('http');


function getAddUserQuery(name) {
    return JSON.stringify({
        action: 0,       // Add user
        args: [name]
    });
}


function addTraining() {

    let post_data = JSON.stringify([{
        name: 'Running training',
        description: 'Helps to keep fit',
        days: [
            {day_number: 1, day_plan: 'Run 1 km'},
            {day_number: 2, day_plan: 'Run 2 km'},
            {day_number: 3, day_plan: 'Run 3 km'},
            {day_number: 4, day_plan: 'Run 4 km'},
        ]
    }]);

    let post_options = {
        host: 'localhost',
        port: '8080',
        path: '/trainings?action_id=2',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    // Set up the request
    var post_req = http.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();

}


function startTraining() {

    let post_data = JSON.stringify([25, 11]);

    let post_options = {
        host: 'localhost',
        port: '8080',
        path: '/trainings?action_id=3',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    // Set up the request
    var post_req = http.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();

}


function main() {

    // Build the post string from an object
    //let post_data = getGetAllFoodRequest(25);
    //let post_data = getAddUserQuery("peter");
    /*let post_data = getAddEatingQuery(25, '2018.07.11', {
        name: 'Soup',
        weight: 22.4,
        proteins: 7.6,
        fats: 2.0,
        carbohydrates: 1.45,
        calories: 6.8
    });*/

    // An object of options to indicate where to post to
    let post_options = {
        host: 'localhost',
        port: '8080',
        path: '/trainings?action_id=0',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    // Set up the request
    var post_req = http.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });

    // post the data
    //post_req.write(post_data);
    post_req.end();
}


main();
//startTraining();