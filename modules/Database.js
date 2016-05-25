/**
 * Created by DatHTSE61273 on 5/18/16.
 */
'use strict'
const mysql = require('mysql');
var config = require('../common/app-config').config;

module.exports = {

    

    connectToDatabase: function (sql, callback) {

        var connection = mysql.createConnection({
            host     : config.DBManager.connection.host,
            user     : config.DBManager.connection.user,
            password : config.DBManager.connection.password,
            database : config.DBManager.connection.database
        });
        connection.connect();

        connection.query(sql, function(err, rows, fields) {
            if (err) return new Error("Error: " + err);
            return callback(rows);

        });

        connection.end();

    }

};

