
/*
 * Main server module.
 * Provides the server-side of the application
 */

const http = require('http');
const url = require('url');

const asyncQueue = require('./asyncQueue.js').createQueue();
const dbHandler = require('./database/dbHandler.js');


const server = http.createServer((request, response) => {

    // Parsing the URL of received query
    let incomingUrl = url.parse(request.url, true);

    // Determining the type of query
    let group = incomingUrl.pathname.substring(1);
    let actionId = incomingUrl.query.action_id;
    
    if (request.method == 'GET') {

        // TODO: Process requests with other parameter types (registration)

        // Getting the user id
        let userId = parseInt(incomingUrl.query.user_id);

        // Forming the task and executing it
        let task = null;
        if (userId) {
            task = formTask(group, actionId, [userId], response);
        }
        else {
            task = formTask(group, actionId, [], response);
        }
        asyncQueue.addTask(task);

    }
    else if (request.method == 'POST') {

        // Getting the body of request
        getRequestBody(request, (err, body) => {

            if (err) {
                console.log("Bad request");
            }
            else {

                // Parsing the body
                let reqBody = safeJsonParse(body);

                if (reqBody) {
                    // Forming the task
                    let task = formTask(group, actionId, reqBody, response);

                    // Putting the task into queue and executing it
                    asyncQueue.addTask(task);
                }
                else {
                    console.log("Error while parsing JSON");
                }
            }
        });        
    }
});


// Getting the body of request
function getRequestBody(request, cb) {

    let body = [];

    request.on('error', (err) => {
        cb(err);
    }).on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        cb(null, body);
    });
}


// Parsing JSON without exceptions
function safeJsonParse(line) {
    
    let result;

    try {
        result = JSON.parse(line);
    }
    catch (e) {
        result = null;
    }

    return result;
}


// Forming the correct task for asynchronous queue
function formTask(group, actionId, reqBody, response) {
    return {
        action: dbHandler.getActionByID(group, actionId),
        args: reqBody,
        callback: formServerResponse(response)
    }
}


// Forming the server response
function formServerResponse(response) {
    return (err, res) => {

        if (err) {
            response.statusCode = 404;
            console.log(err);
        }
        else {
            
            response.statusCode = 200;

            // Headers
            response.setHeader('Content-Type', 'application/json');

            // Result JSON
            if (res) {
                response.write(JSON.stringify(res));
            }

            console.log("Request has been processed successfully");
        }

        response.end();
    }
}


// Starting the server
dbHandler.connectToDB((err, connectionID) => {
    if (err) {
        console.log("Error while connecting to database: " + err);
    }
    else {
        console.log("Connected to database with id " + connectionID);
        server.listen(8080);
        console.log("Server is listening the port 8080");
    }
});