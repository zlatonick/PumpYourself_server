
// Module that allows to work with images as the pathes to them
// Images are determined by category and id
// Category is one of the following strings: users, groups, dishes
// Id is the id of corresponding record in database

const fs = require('fs');

exports.getImage = getImage;
exports.saveImage = saveImage;
exports.createStandardImage = createStandardImage;
exports.getImageQuery = getImageQuery;


function getPath(category, id) {
    return './database/images/' + category + '/' + id + '.png';
}


// Reading the image and returning an array of binary data
function getImage(category, id, cb) {
    fs.readFile(getPath(category, id), (err, res) => {
        
        if (err) cb(err);

        cb(null, res.toJSON(), id);       // Transforming buffer into array
    });
}


function saveImage(category, id, image, cb) {
    fs.writeFile(getPath(category, id), Buffer.from(image.data), (err) => {
        cb(err);
    });
}


// Copying the standard image and saving it as the image of dish/group/user
function createStandardImage(category, id, cb) {
    fs.copyFile(getPath(category, 'standard'), getPath(category, id), (err) => {
        cb(err);
    });
}


function getImageQuery(group, params, cb) {
    fs.readFile('./database/images/' + group + '/' + params.image_id + '.png', (err, data) => {
        if (err) cb(err);
        cb(null, data, 'image/png');
    });
}
