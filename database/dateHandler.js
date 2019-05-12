
// Module provides some functions for working with date

exports.getDateTime = getDateTime;
exports.getDay = getDay;


// 9 -> 09, 11 -> 11
function pad(number) {
    if (number < 10) {
        return '0' + number;
    }
    return number;
}

// Represents date as a string YYYY-MM-DDTHHMMSS
function getDateTime(date) {
    return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      'T' + pad(date.getHours())
      + pad(date.getMinutes())
      + pad(date.getSeconds())
};

// Represents date as a string YYYY-MM-DD
function getDay(date) {
    return getDateTime(date).substring(0, 10);
}