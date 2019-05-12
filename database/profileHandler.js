
/*
 * Module provides functions for processing profile requests
 */


const images = require('./dbImagesHandler.js');
const asyncQueueFactory = require('../asyncQueue.js');


exports.getProfileInfo = getProfileInfo;
exports.getFriendInfo = getFriendInfo;
exports.searchUser = searchUser;
exports.addNewUser = addNewUser;
exports.changeProfileInfo = changeProfileInfo;
exports.acceptGroupRequest = acceptGroupRequest;
exports.declineGroupRequest = declineGroupRequest;
exports.acceptFriendRequest = acceptFriendRequest;
exports.declineFriendRequest = declineFriendRequest;
exports.sendFriendRequest = sendFriendRequest;
exports.removeFriend = removeFriend;


// Getting all needed info about the user
function getProfileInfo(connection, user_id, cb) {

    // Getting firstly the main profile info
    let queryString = "SELECT User_name, User_status FROM Users "
        + "WHERE User_ID = ?";

    connection.query(queryString, [user_id], (err, user_res) => {

        if (err) cb(err);

        // Getting all the friends
        let friendsString = "SELECT Users.User_ID AS Friend_ID, User_name, User_status "
            + "FROM Friends JOIN Users ON Friends.Second_user_ID = Users.User_ID "
            + "WHERE Friends.First_user_ID = ?";

        connection.query(friendsString, [user_id], (err, fr_res) => {

            if (err) cb(err);

            // Getting all the friends requests
            let friendsRequestsString = "SELECT Users.User_ID AS Friend_ID, "
                + "User_name, User_status FROM Friends_requests "
                + "JOIN Users ON Friends_requests.User_ID_from = Users.User_ID "
                + "WHERE Friends_requests.User_ID_to = ?";

            connection.query(friendsRequestsString, [user_id], (err, frReq_res) => {

                if (err) cb(err);

                // Getting all the groups requests
                let groupsRequestsString = "SELECT Training_groups.Group_ID AS Group_ID, "
                    + "Group_name, Group_description FROM Groups_requests "
                    + "JOIN Training_groups ON Groups_requests.Group_ID = Training_groups.Group_ID "
                    + "WHERE Groups_requests.User_ID_to = ?";

                connection.query(groupsRequestsString, [user_id], (err, grReq_res) => {

                    if (err) cb(err);

                    // Initializing an asynchronous queue
                    let queue = asyncQueueFactory.createQueue();

                    // Forming the result
                    let result = {};

                    result.name = user_res[0]['User_name'];
                    result.status = user_res[0]['User_status'];

                    // Profile photo
                    queue.addTask({
                        action: images.getImage,
                        args: ['users', user_id],
                        callback: (err, res) => {
                            if (err) cb(err);
                            result.photo = res;
                        }
                    });

                    // Forming the friends
                    result.friends = {};

                    for (line of fr_res) {
                        
                        result.friends[line['Friend_ID']] = {
                            name: line['User_name'],
                            status: line['User_status']
                        }
                        
                        // Photo
                        queue.addTask({
                            action: images.getImage,
                            args: ['users', line['Friend_ID']],
                            callback: (err, res, image_id) => {
                                if (err) cb(err);
                                result.friends[image_id].photo = res;
                            }
                        });
                    }

                    // Forming the notifications
                    result.notifications = {
                        friends_requests: {},
                        groups_requests: {}
                    };

                    // Friends notifications
                    for (line of frReq_res) {
                        
                        result.notifications.friends_requests[line['Friend_ID']] = {
                            name: line['User_name'],
                            status: line['User_status']
                        }
                        
                        // Photo
                        queue.addTask({
                            action: images.getImage,
                            args: ['users', line['Friend_ID']],
                            callback: (err, res, image_id) => {
                                if (err) cb(err);
                                result.notifications.friends_requests[image_id].photo = res;
                            }
                        });
                    }

                    // Groups notifications
                    for (line of grReq_res) {
                        
                        result.notifications.groups_requests[line['Group_ID']] = {
                            name: line['Group_name'],
                            description: line['Group_description']
                        }
                        
                        // Photo
                        queue.addTask({
                            action: images.getImage,
                            args: ['groups', line['Group_ID']],
                            callback: (err, res, image_id) => {
                                if (err) cb(err);
                                result.notifications.groups_requests[image_id].photo = res;
                            }
                        });
                    }

                    // Adding the callback
                    queue.addTask({
                        action: cb,
                        args: [null, result]
                    });
                });
            });
        });
    });
}


function getFriendInfo(connection, user_id, friend_id, cb) {

    // Getting all the friends
    let friendsString = "SELECT Users.User_ID AS Friend_ID, User_name, User_status "
    + "FROM Friends JOIN Users ON Friends.Second_user_ID = Users.User_ID "
    + "WHERE Friends.First_user_ID = ?";

    connection.query(friendsString, [friend_id], (err, fr_res) => {

        if (err) cb(err);

        // Getting all the mutual groups
        let groupsString = "SELECT Group_id, Group_name, Group_description "
            + "FROM Training_groups WHERE Group_id IN "
            + "(SELECT Group_ID FROM Groups_users "
            + "WHERE User_ID = ? AND Group_ID IN "
            + "(SELECT Group_ID FROM Groups_users WHERE User_ID = ?))";

        connection.query(groupsString, [user_id, friend_id], (err, gr_res) => {

            if (err) cb(err);

            // Initializing an asynchronous queue
            let queue = asyncQueueFactory.createQueue();

            // Forming the result
            let result = {
                friends: {},
                mutual_groups: {}
            };

            // Forming the friends
            for (line of fr_res) {
                        
                result.friends[line['Friend_ID']] = {
                    name: line['User_name'],
                    status: line['User_status']
                }
                
                // Photo
                queue.addTask({
                    action: images.getImage,
                    args: ['users', line['Friend_ID']],
                    callback: (err, res, image_id) => {
                        if (err) cb(err);
                        result.friends[image_id].photo = res;
                    }
                });
            }

            // Forming the mutual groups
            for (line of gr_res) {
                        
                result.mutual_groups[line['Group_id']] = {
                    name: line['Group_name'],
                    description: line['Group_description']
                }
                
                // Photo
                queue.addTask({
                    action: images.getImage,
                    args: ['groups', line['Group_id']],
                    callback: (err, res, image_id) => {
                        if (err) cb(err);
                        result.mutual_groups[image_id].photo = res;
                    }
                });
            }

            // Adding the callback
            queue.addTask({
                action: cb,
                args: [null, result]
            });
        });
    });
}


// Search for users by input phrase
// Returns the shallow user info
function searchUser(connection, input_phrase, cb) {
    
    let queryString = "SELECT User_ID, User_name, User_status FROM Users "
        + "WHERE User_name LIKE ?";

    connection.query(queryString, ['%' + input_phrase + '%'], (err, res) => {

        if (err) cb(err);

        // Initializing an asynchronous queue
        let queue = asyncQueueFactory.createQueue();

        // Forming the result
        let result = {};

        // Forming the users
        for (line of res) {
                    
            result[line['User_ID']] = {
                name: line['User_name'],
                status: line['User_status']
            }
            
            // Photo
            queue.addTask({
                action: images.getImage,
                args: ['users', line['User_ID']],
                callback: (err, res, image_id) => {
                    if (err) cb(err);
                    result[image_id].photo = res;
                }
            });
        }

        // Adding the callback
        queue.addTask({
            action: cb,
            args: [null, result]
        });
    });
}


function addNewUser(connection, user_info, cb) {

    // Checking if the login already exists
    let checkString = "SELECT COUNT(*) AS quan FROM Users WHERE Login = ?";

    connection.query(checkString, [user_info.login], (err, res) => {

        if (err) {
            cb(err);
        }

        if (res[0].quan > 0) {
            cb("Login already exists");
        }
        else {

            // Inserting the user
            let queryString = "INSERT INTO Users(Login, Password, User_name, User_status) "
                + "VALUES(?, ?, ?, ?)";

            connection.query(queryString, [user_info.login, user_info.password,
                user_info.name, user_info.status], (err, res) => {

                if (err) cb(err);

                let user_id = res.insertId;

                // Processing the photo
                if (user_info.photo) {            
                    images.saveImage('users', user_id, user_info.photo, (err) => {
                        cb(err, user_id);
                    });
                }
                else {            
                    images.createStandardImage('users', user_id, (err) => {
                        cb(err, user_id);
                    });
                }
            });
        }
    });    
}


function changeProfileInfo(connection, user_id, user_info, cb) {

    let queryString = "UPDATE Users SET User_name = ?, User_status = ? "
        + "WHERE User_ID = ?";

    connection.query(queryString, [user_info.name, user_info.status, user_id],
        (err, res) => {

        if (err) cb(err);

        // Processing the photo
        if (user_info.photo) {            
            images.saveImage('users', user_id, user_info.photo, (err) => {
                cb(err);
            });
        }
        else {
            cb();
        }
    });
}


function acceptGroupRequest(connection, user_id, group_id, cb) {

    let deleteString = "DELETE FROM Groups_requests WHERE User_ID_to = ? "
        + "AND Group_ID = ?";

    connection.query(deleteString, [user_id, group_id], (err) => {
    
        if (err) cb(err);

        let queryString = "INSERT INTO Groups_users(User_ID, Group_ID) VALUES(?, ?)";
    
        connection.query(queryString, [user_id, group_id], (err) => {
            cb(err);
        });
    });    
}


function declineGroupRequest(connection, user_id, group_id, cb) {

    let deleteString = "DELETE FROM Groups_requests WHERE User_ID_to = ? "
        + "AND Group_ID = ?";

    connection.query(deleteString, [user_id, group_id], (err) => {
        cb(err);
    });
}


function acceptFriendRequest(connection, user_id, friend_id, cb) {

    let deleteString = "DELETE FROM Friends_requests WHERE User_ID_to = ? "
        + "AND User_ID_from = ?";

    connection.query(deleteString, [user_id, friend_id], (err) => {
    
        if (err) cb(err);

        let queryString = "INSERT INTO Friends(First_user_ID, Second_user_ID) VALUES(?, ?)";
    
        connection.query(queryString, [user_id, friend_id], (err) => {

            if (err) cb(err);

            // Entry is added twice
            let queryString = "INSERT INTO Friends(First_user_ID, Second_user_ID) VALUES(?, ?)";
        
            connection.query(queryString, [friend_id, user_id], (err) => {
                cb(err);
            });
        });
    });    
}


function declineFriendRequest(connection, user_id, friend_id, cb) {

    let deleteString = "DELETE FROM Friends_requests WHERE User_ID_to = ? "
        + "AND User_ID_from = ?";

    connection.query(deleteString, [user_id, friend_id], (err) => {
        cb(err);
    });
}


function sendFriendRequest(connection, user_id, friend_id, cb) {

    let queryString = "INSERT INTO Friends_requests(User_ID_from, User_ID_to) "
        + "VALUES(?, ?)";

    connection.query(queryString, [user_id, friend_id], (err) => {
        cb(err);
    });
}


function removeFriend(connection, user_id, friend_id, cb) {

    let deleteString = "DELETE FROM Friends WHERE First_user_ID = ? "
        + "AND Second_user_ID = ?";

    connection.query(deleteString, [user_id, friend_id], (err) => {

        if (err) cb(err);

        // Entry is removed twice
        let deleteString = "DELETE FROM Friends WHERE First_user_ID = ? "
            + "AND Second_user_ID = ?";

        connection.query(deleteString, [friend_id, user_id], (err) => {
            cb(err);
        });
    });
}