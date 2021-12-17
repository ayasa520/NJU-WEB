'use strict';
module.exports = {
    port: 3001,
    allow_origin: 'http://127.0.0.1:8080',
    jwt_secret: 'jskhIUAS89aSDAnnnan3NNnaepopq7asd',
    session_secret: 'sessiontest',
    /** mongodb settings */
    mongodb: {
        URI: 'mongodb+srv://rikka:rikka@cluster0.fznke.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
    },
    debug: true
}