
/*
 * Main server module.
 * Provides the server-side of the application
 */

const http = require('http');

const asyncQueue = require('./asyncQueue.js').createQueue();
const dbHandler = require('./database/dbHandler.js');


const server = http.createServer((request, response) => {

    // Parsing the URL of received query
    const incomingUrl = new URL(request.url, 'https://example.org/');

    // Determining the type of query
    let urlParts = incomingUrl.pathname.split('/');
    urlParts.shift();       // Removing first empty string

    let group = urlParts[0];
    let action = urlParts[1];

    if (group == null || action == null) {
        finishResponse(response, 404, "Incorrect URL. Missing group or action",
            incomingUrl.path);
        return;
    }
    
    if (request.method == 'GET') {

        // Putting all other URL parameters into the array
        let params = {};

        incomingUrl.searchParams.forEach((value, name) => {
            params[name] = value;
        });

        // Forming the task and executing it
        task = formTask(group, action, params, response);
        
        if (task) {
            asyncQueue.addTask(task);
        }
        else {
            finishResponse(response, 404, "Incorrect URL", incomingUrl.path);
            return;
        }
    }
    else if (request.method == 'POST') {

        // Getting the body of request
        getRequestBody(request, (err, body) => {

            if (err) {
                finishResponse(response, 404, "Bad request", incomingUrl.path);
            }
            else {

                // Parsing the body
                let reqBody = safeJsonParse(body);

                if (reqBody) {

                    // Forming the task
                    let task = formTask(group, action, reqBody, response);
        
                    if (task) {
                        asyncQueue.addTask(task);
                    }
                    else {
                        finishResponse(response, 404, "Incorrect URL", incomingUrl.path);
                        return;
                    }
                }
                else {
                    finishResponse(response, 404, "Error while parsing JSON", incomingUrl.path);
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
        args: [reqBody],
        callback: formServerResponse(response)
    }
}


// Forming the server response
function formServerResponse(response) {
    return (err, res, type) => {

        if (err) {
            finishResponse(response, 404, err.toString());
        }
        else {

            // Image
            if (type && typeof(type) == 'string') {
                response.setHeader('Content-Type', type);
                response.write(res, 'binary');
            }
            else {
                
                response.setHeader('Content-Type', 'application/json');
                
                // Result JSON
                if (res) {
                    response.write(JSON.stringify(res));
                }
            }            

            finishResponse(response, 200, "Request has been processed successfully")
        }

        response.end();
    }
}


function finishResponse(response, code, message, url) {

    if (url) {
        console.log(message + ". " + new Date().toLocaleString() + " - " + url);

    }
    else {
        console.log(message + ". " + new Date().toLocaleString());
    }

    response.statusCode = code;
    response.end();
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