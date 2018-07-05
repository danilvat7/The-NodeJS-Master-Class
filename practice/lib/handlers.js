/*
 *   Request handlers
 */
// dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

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
handlers._users.get = function (data, callback) {
    var phone = typeof (data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;

    if (phone) {

        // get the token from the headers
        var token = typeof (data.headers.token) === 'string' ? data.headers.token : false;

        // verify token
        handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
            if (tokenIsValid) {
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
                callback(403, {
                    'Error': 'Missing required token'
                });
            }
        });

    } else {
        callback(400, {
            'Error': 'Missing required field'
        });
    }
};

// users put
// required data: phone
// Optional data: firstName, lastName, password
handlers._users.put = function (data, callback) {

    var phone = typeof (data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;


    var firstName = typeof (data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;

    var lastName = typeof (data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;

    var password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone) {

        // get the token from the headers
        var token = typeof (data.headers.token) === 'string' ? data.headers.token : false;

        // verify token
        handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
            if (tokenIsValid) {

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
                    });
                }
            } else {
                callback(403, {
                    'Error': 'Missing required token'
                });
            }
        })

    } else {
        callback(400, {
            'Error': 'Missing required field'
        });
    }
};

// users delete
// required data: phone
// Optional data: non
handlers._users.delete = function (data, callback) {
    var phone = typeof (data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;

    if (phone) {

        // get the token from the headers
        var token = typeof (data.headers.token) === 'string' ? data.headers.token : false;

        // verify token
        handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
            if (tokenIsValid) {
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
                });
            } else {
                callback(403, {
                    'Error': 'Missing required token'
                });
            }
        })

    } else {
        callback(400, {
            'Error': 'Missing required field'
        });
    }
};


// tokens
handlers.tokens = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for tokens methods
handlers._tokens = {};

// tokens post
// require data: phone, password
// optional data: none
handlers._tokens.post = function (data, callback) {
    var phone = typeof (data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;

    var password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone && password) {
        _data.read('users', phone, function (err, userData) {
            if (!err && userData) {
                // hash send password
                var hashedPassword = helpers.hash(password);
                if (hashedPassword === userData.hashedPassword) {
                    // if valid create a new token. Set expiration date
                    var tokenId = helpers.createRandomString(20);

                    var expires = Date.now() + 1000 * 60 * 60;

                    var tokenObjects = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // store token
                    _data.create('tokens', tokenId, tokenObjects, function (err) {
                        if (!err) {
                            callback(200, tokenObjects)
                        } else {
                            callback(500, {
                                'Error': 'Could not create new token'
                            });
                        }
                    });
                } else {
                    callback(400, {
                        'Error': 'Did not match password'
                    });
                }
            } else {
                callback(400, {
                    'Error': 'Could not find user'
                });
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing required field(s)'
        });
    }
};

// tokens get
// Required data: id
// Optional data: none
handlers._tokens.get = function (data, callback) {
    var id = typeof (data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;

    if (id) {
        // lookup the token
        _data.read('tokens', id, function (err, data) {
            if (!err && data) {
                callback(200, data);
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

// tokens put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function (data, callback) {
    var id = typeof (data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;

    var extend = typeof (data.payload.extend) === 'boolean' && data.payload.extend ? true : false;

    if (id && extend) {
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                if (tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    _data.update('tokens', id, tokenData, function (err) {
                        {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, {
                                    'Error': 'Could not update token'
                                });
                            }
                        }
                    })
                } else {
                    callback(400, {
                        'Error': 'Token has already expired'
                    });
                }
            } else {
                callback(400, {
                    'Error': 'Token does not exist'
                });
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing required fild(s)'
        });
    }
};

// tokens delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function (data, callback) {
    var id = typeof (data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;


    if (id) {
        // lookup the user
        _data.read('tokens', id, function (err, data) {
            if (!err && data) {
                _data.delete('tokens', id, function (err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, {
                            'Error': 'Could not find token'
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

// verify if a given id is currently valid for a given user
handlers._tokens.verifyToken = function (id, phone, callback) {
    _data.read('tokens', id, function (err, tokenData) {
        if (!err && tokenData) {
            if (tokenData.phone === phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

// Checks
handlers.checks = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for checks methods
handlers._checks = {};

// checks post
// require data: protocol, url, method, successCodes, timeoutSeconds
// optional data: none
handlers._checks.post = function (data, callback) {
    var protocol = typeof (data.payload.protocol) === 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol.trim() : false;

    var url = typeof (data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;

    var method = typeof (data.payload.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method.trim() : false;

    var successCodes = typeof (data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;

    var timeoutSeconds = typeof (data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        // get the token from the headers
        var token = typeof (data.headers.token) === 'string' ? data.headers.token : false;

        _data.read('tokens', token, function (err, tokenData) {
            if (!err && tokenData) {
                var userPhone = tokenData.phone;

                _data.read('users', userPhone, function (err, userData) {
                    if (!err && userData) {
                        var userChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];

                        // Vetify with max-checks-per-users
                        if (userChecks.length < config.maxChecks) {
                            // create a random id for the check
                            var checkId = helpers.createRandomString(20);

                            var checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds': timeoutSeconds
                            };

                            _data.create('checks', checkId, checkObject, function (err) {
                                if (!err) {
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    _data.update('users', userPhone, userData, function (err) {
                                        if (!err) {
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, {
                                                'Error': 'Could not update user with new chec'
                                            });
                                        }
                                    })
                                } else {
                                    callback(500, {
                                        'Error': 'Could not create the new check'
                                    });
                                }
                            });

                        } else {
                            callback(400, {
                                'Error': 'User has already max checks'
                            });
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(403);
            }
        });

    } else {
        callback(400, {
            'Error': 'Missing required inputs'
        });
    }
};

// checks get
// require data:id
// optional data: none
handlers._checks.get = function (data, callback) {
    var id = typeof (data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;

    if (id) {
        _data.read('checks', id, function (err, checkData) {
            if (!err && checkData) {

                // get the token from the headers
                var token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
                // verify token
                handlers._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
                    if (tokenIsValid) {
                        // return the data
                        callback(200, checkData);
                    } else {
                        callback(403, {
                            'Error': 'Missing required token'
                        });
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {
            'Error': 'Missing required field'
        });
    }
};

// checks put
// require data: id
// optional data: protocol, url, method, successCodes, timeoutSeconds
handlers._checks.put = function (data, callback) {
    var id = typeof (data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;

    var protocol = typeof (data.payload.protocol) === 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol.trim() : false;

    var url = typeof (data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;

    var method = typeof (data.payload.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method.trim() : false;

    var successCodes = typeof (data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;

    var timeoutSeconds = typeof (data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (id) {
        if (protocol || url || method || successCodes || timeoutSeconds) {
            _data.read('checks', id, function (err, checkData) {
                if (!err && checkData) {
                    // get the token from the headers
                    var token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
                    // verify token
                    handlers._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
                        if (tokenIsValid) {
                            if (protocol) {
                                checkData.protocol = protocol;
                            }
                            if (url) {
                                checkData.url = url;
                            }
                            if (method) {
                                checkData.method = method;
                            }
                            if (successCodes) {
                                checkData.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds;
                            }

                            _data.update('checks', id, checkData, function (err) {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500);
                                }
                            });
                        } else {
                            callback(403, {
                                'Error': 'Missing required token'
                            });
                        }
                    });
                } else {
                    callback(400, {
                        'Error': 'Check did not exist'
                    });
                }
            });
        } else {
            callback(400, {
                'Error': 'Missing fields for update'
            });
        }
    } else {
        callback(400, {
            'Error': 'Missing required field'
        })
    }

};

// checks delete
// require data: phone, password
// optional data: none
handlers._checks.delete = function (data, callback) {

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