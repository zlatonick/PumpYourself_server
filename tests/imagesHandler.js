
// Module for tests. Provides functions to read/save images on disk

exports.getImage = getImage;
exports.saveImage = saveImage;

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