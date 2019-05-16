
/*
 * Main server module.
 * Provides the server-side of the application
 */

const http = require('http');

const asyncQueue = require('./asyncQueue.js').createQueue();
const dbHandler = require('./database/dbHandler.js');


const server = http.createServer((request, response) => {

    // Parsing the URL of received query
    let incomingUrl = new URL(request.url, 'https://example.org/');

    // Determining the type of query
    let group = incomingUrl.pathname.substring(1);
    let actionId = incomingUrl.searchParams.get('action_id');

    if (group == null || actionId == null) {
        console.log("Incorrect URL. Missing group and action id");
        response.statusCode = 404;
        response.end();
        return;
    }
    
    if (request.method == 'GET') {

        // Putting all other URL parameters into the array
        let params = [];

        incomingUrl.searchParams.forEach((value) => {
            params.push(value);
        });

        params.shift();        // Removing the 'action_id' parameter

        // Forming the task and executing it
        task = formTask(group, actionId, params, response);
        
        if (task) {
            asyncQueue.addTask(task);
        }
        else {
            console.log("Incorrect URL");
            response.statusCode = 404;
            response.end();
            return;
        }
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
        
                    if (task) {
                        asyncQueue.addTask(task);
                    }
                    else {
                        response.statusCode = 404;
                        response.end();
                        console.log("Incorrect URL");
                        return;
                    }
                }
                else {
                    console.log("Error while parsing JSON");
                    response.statusCode = 404;
                    response.end();
                    return;
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

    let receivedAction = dbHandler.getActionByID(group, actionId);

    if (receivedAction == null) {
        return null;
    }

    return {
        action: receivedAction,
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
        server.listen(process.env.PORT);
        console.log("Server is listening the port 8080");
    }
});