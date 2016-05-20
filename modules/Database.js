/**
 * Created by DatHTSE61273 on 5/18/16.
 */
'use strict'
const mysql = require('mysql');
const request = require('request');

// handle process word from api.ai
function connectToDatabase() {
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : '',
        database : 'chatbot'
    });

    connection.connect();

    connection.query('select * from food', function(err, rows, fields) {
        if (err) throw err;

        for(var i = 0; i < rows.length; i++) {
            console.log(i + "-" + rows[i].name);
        }
    });

    connection.end();
}

module.exports = router;
