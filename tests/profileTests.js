
// Profile API tests

const http = require('http');
const images = require('./imagesHandler.js');


function addUserTest() {

    images.getImage('./test_images/users/user1.png', (err, image) => {

        if (err) throw err;

        let post_body = [{
            login: 'superman',
            password: '12345',
            name: 'Peter',
            status: 'Keep calm',
            photo: image
        }];

        let post_options = {
            host: 'localhost',
            port: '8080',
            path: '/profile?action_id=3',
            method: 'POST'
        };
    
        // Set up the request
        let post_req = http.request(post_options, (res) => {
        
            let res_data = '';
    
            res.on('data', (chunk) => {
                res_data += chunk;
            });
    
            res.on('end', () => {    
                response = JSON.parse(res_data);    
                console.log(response);
            });
        });
    
        // post the data
        post_req.write(JSON.stringify(post_body));
        post_req.end();
    });  
}


function addUserWithoutImageTest() {
    let post_body = [{
        login: 'batman',
        password: '12345',
        name: 'Stepan',
        status: 'I am the best'
    }];

    let post_options = {
        host: 'localhost',
        port: '8080',
        path: '/profile?action_id=3',
        method: 'POST'
    };

    // Set up the request
    let post_req = http.request(post_options, (res) => {
    
        let res_data = '';

        res.on('data', (chunk) => {
            res_data += chunk;
        });

        res.on('end', () => {    
            response = JSON.parse(res_data);    
            console.log(response);
        });
    });

    // post the data
    post_req.write(JSON.stringify(post_body));
    post_req.end();
}


function searchUserTest() {

    let get_options = {
        host: 'localhost',
        port: '8080',
        path: '/profile?action_id=2&phrase=ick',
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

            console.dir(response);

            // Writing only first image
            images.saveImage('./test_images/response/image.png', response[1].photo, (err) => {
                
                if (err) throw err;

                console.log('Image was saved successfully');
            });
        });
    });

    get_req.end();
}


function changeUserInfoTest() {

    images.getImage('./test_images/users/user3.png', (err, image) => {

        if (err) throw err;

        let post_body = [
            2,
            {
                name: 'Ivan',
                status: 'Keep calm 2',
                photo: image
            }
        ];

        let post_options = {
            host: 'localhost',
            port: '8080',
            path: '/profile?action_id=4',
            method: 'POST'
        };
    
        // Set up the request
        let post_req = http.request(post_options, () => {});
    
        // post the data
        post_req.write(JSON.stringify(post_body));
        post_req.end();
    });
}


function sendFriendRequestTest() {

    let post_body = [1, 3];

    let post_options = {
        host: 'localhost',
        port: '8080',
        path: '/profile?action_id=9',
        method: 'POST'
    };

    // Set up the request
    let post_req = http.request(post_options, () => {});

    // post the data
    post_req.write(JSON.stringify(post_body));
    post_req.end();
}


function acceptFriendRequestTest() {

    let post_body = [3, 1];

    let post_options = {
        host: 'localhost',
        port: '8080',
        path: '/profile?action_id=7',
        method: 'POST'
    };

    // Set up the request
    let post_req = http.request(post_options, () => {});

    // post the data
    post_req.write(JSON.stringify(post_body));
    post_req.end();
}


function declineFriendRequestTest() {

    let post_body = [3, 2];

    let post_options = {
        host: 'localhost',
        port: '8080',
        path: '/profile?action_id=8',
        method: 'POST'
    };

    // Set up the request
    let post_req = http.request(post_options, () => {});

    // post the data
    post_req.write(JSON.stringify(post_body));
    post_req.end();
}


function getUserInfo() {

    let get_options = {
        host: 'localhost',
        port: '8080',
        path: '/profile?action_id=0&user_id=1',
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

            console.log('Name: ' + response.name);
            console.log('Status: ' + response.status);
            
            console.log('Notifications:');
            console.dir(response.notifications);

            console.log('Friends:');
            console.dir(response.friends);

            // Writing profile image
            images.saveImage('./test_images/response/user.png', response.photo, (err) => {
                
                if (err) throw err;

                console.log('User image was saved successfully');

                images.saveImage('./test_images/response/friend2.png',
                    response.friends[2].photo, (err) => {
                    
                    if (err) throw err;

                    console.log('Friend2 image was saved successfully');

                    images.saveImage('./test_images/response/friend3.png',
                        response.friends[3].photo, (err) => {
                        
                        if (err) throw err;

                        console.log('Friend3 image was saved successfully');
                    });
                });
            });
        });
    });

    get_req.end();
}


//addUserTest();
//addUserWithoutImageTest();
//searchUserTest();
//changeUserInfoTest();
//sendFriendRequestTest();
//acceptFriendRequestTest();
//declineFriendRequestTest();
//getUserInfo();