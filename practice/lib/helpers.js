/*
 * Helpers
 */
// dependencies
var crypto = require('crypto');
var config = require('./config');

//container for all helpers
var helpers = {};

// create a SHA256 hash
helpers.hash = function (str) {
    if (typeof (str) === 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
}

// parse to obj
helpers.parseJsonToObject = function (str) {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch (e) {
        return {};
    }
};


// creta a random string
helpers.createRandomString = function (strLength) {
    strLength = typeof (strLength) === 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        var str = '';
        for (var i = 1; i <= strLength; i++) {
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            str += randomCharacter;
        }
        return str;
    } else {
        return false;
    }
}














module.exports = helpers;