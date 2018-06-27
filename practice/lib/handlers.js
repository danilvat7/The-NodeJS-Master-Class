/*
 *   Request handlers
 */
// dependencies
var _data = require('./data');
var helpers = require('./helpers');
// Define all the handlers
var handlers = {};

// users
handlers.users = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for users sub methods
handlers._users = {};

// users post
// required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function (data, callback) {
    // check that all required fields are filled out
    var firstName = typeof (data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;

    var lastName = typeof (data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;

    var phone = typeof (data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;

    var password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    var tosAgreement = typeof (data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? true : false;
    if (firstName && lastName && phone && password && tosAgreement) {
        // check user for existing
        _data.read('users', phone, function (err, data) {
            if (err) {
                // hash password

                var hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    // crete user object
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    }

                    // store the user
                    _data.create('users', phone, userObject, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {
                                'Error': 'Could not create the new user'
                            });
                        }
                    });
                } else {
                    callback(500, {
                        'Error': 'Could not hash the password'
                    })
                }

            } else {
                callback(400, {
                    'Error': 'A user already exist'
                });
            }
        });
    } else {
        callback(400, {
            'Error': 'Missing required fields'
        });
    }
};

// users get
// required data: phone
// Optional data: non
// @TODO add auth access
handlers._users.get = function (data, callback) {
    var phone = typeof (data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;

    if (phone) {
        // lookup the user
        _data.read('users', phone, function (err, data) {
            if (!err && data) {
                // remove hash password
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404)
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing required field'
        });
    }
};

// users put
// required data: phone
// Optional data: firstName, lastName, password
// @TODO add auth access
handlers._users.put = function (data, callback) {

    console.log(data.payload)
    var phone = typeof (data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;


    var firstName = typeof (data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;

    var lastName = typeof (data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;

    var password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone) {
        if (firstName || lastName || password) {
            _data.read('users', phone, function (err, userData) {
                if (!err && userData) {
                    // update fields

                    if (firstName) {
                        userData.firstName = firstName;
                    }
                    if (lastName) {
                        userData.lastName = lastName;
                    }
                    if (password) {
                        userData.hashedPassword = helpers.hash(password);
                    }

                    // store new updates
                    _data.update('users', phone, userData, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);

                            callback(500, {
                                'Error': 'Could not update the user'
                            });
                        }
                    })
                } else {
                    callback(400, {
                        'Error': 'The specified user does not exist'
                    });
                }
            });
        } else {
            callback(400, {
                'Error': 'Missing fields to update'
            })
        }
    } else {
        callback(400, {
            'Error': 'Missing required field'
        });
    }
};

// users delete
// required data: phone
// Optional data: non
// @TODO add auth access
handlers._users.delete = function (data, callback) {
    var phone = typeof (data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;

    if (phone) {
        // lookup the user
        _data.read('users', phone, function (err, data) {
            if (!err && data) {
                _data.delete('users', phone, function (err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, {
                            'Error': 'Could not find user'
                        });
                    }
                });
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing required field'
        });
    }
};


// Ping handler
handlers.ping = function (data, callback) {
    callback(200);
};


// Not-Found handler
handlers.notFound = function (data, callback) {
    callback(404);
};


module.exports = handlers;