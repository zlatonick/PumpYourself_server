
// Debug module. Is used for tests

const http = require('http');
const fs = require('fs');


function getImage(path, cb) {
    fs.readFile(path, (err, res) => {
        
        if (err) cb(err);

        cb(null, res);       // Transforming buffer into array
    });
}


function saveImage(path, image, cb) {
    fs.writeFile(path, Buffer.from(image.data), (err) => {
        cb(err);
    });
}


function getAllMeal() {

    let get_options = {
        host: 'localhost',
        port: '8080',
        path: '/meal?action_id=0&user_id=1&start_date=2017-08-10T12:45:54&end_date=2019-08-10T12:45:54',
        method: 'GET'
    };

    // Set up the request
    let get_req = http.request(get_options, (res) => {
        
        let res_data = '';

        res.on('data', (chunk) => {
            res_data += chunk;
        });

        res.on('end', () => {

            response = JSON.parse(res_data);

            //console.log(response);

            console.log('Days:');
            console.dir(response.days);

            console.log('Dishes:');
            console.dir(response.dishes);

            // Writing only first image
            /*saveImage('./response/image.png', response.photos['1_2019-07-08'], (err) => {
                
                if (err) throw err;

                console.log('Image was saved successfully');
            });*/
        });
    });

    get_req.end();
}


function addMeal() {

    getImage('./photo.png', (err, image) => {

        if (err) throw err;

        let post_body = [
            1,
            '2019-07-08T12:45:54',
            {
                name: 'Buckwheat',
                weight: 22.4,
                photo: image,
                proteins: 80,
                fats: 90,
                carbohydrates: 100,
                calories: 110
            }
        ];

        let post_options = {
            host: 'localhost',
            port: '8080',
            path: '/meal?action_id=1',
            method: 'POST'
        };
    
        // Set up the request
        let post_req = http.request(post_options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('Response: ' + chunk);
            });
        });
    
        // post the data
        post_req.write(JSON.stringify(post_body));
        post_req.end();
    });    
}


function editMeal() {
    getImage('./new_photo.png', (err, image) => {

        if (err) throw err;

        let post_body = [
            1,
            9,
            '2017-11-25T12:45:54',
            {
                name: 'Soup',
                weight: 17.5,
                photo: image,
                proteins: 55,
                fats: 13,
                carbohydrates: 70,
                calories: 95
            }
        ];

        let post_options = {
            host: 'localhost',
            port: '8080',
            path: '/meal?action_id=2',
            method: 'POST'
        };
    
        // Set up the request
        let post_req = http.request(post_options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('Response: ' + chunk);
            });
        });
    
        // post the data
        post_req.write(JSON.stringify(post_body));
        post_req.end();
    });  
}


function deleteMeal() {
    
    let post_body = [6];

    let post_options = {
        host: 'localhost',
        port: '8080',
        path: '/meal?action_id=3',
        method: 'POST'
    };

    // Set up the request
    let post_req = http.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });

    // post the data
    post_req.write(JSON.stringify(post_body));
    post_req.end();
}


getAllMeal();
//addMeal();
//editMeal();
//deleteMeal();